"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * App-wide confirmation dialog.
 *
 * Why this exists: the browser's `window.confirm()` ships an unstyled OS modal
 * that breaks the brand and feels jarring in an otherwise polished UI. This
 * module provides a promise-based `useConfirm()` hook that mirrors the
 * `confirm()` ergonomics (`const ok = await confirm({...})`) but renders a
 * branded dialog matching the rest of the surface system.
 *
 * Pattern:
 *   1. <ConfirmProvider> sits high in the tree (inside `Providers.tsx`) and
 *      owns a single dialog instance + its open state.
 *   2. Any client component calls `useConfirm()` to get a function that
 *      returns `Promise<boolean>`.
 *   3. While open, the provider renders a portal'd dialog with backdrop blur,
 *      Escape-to-cancel, click-outside-to-cancel, focus management, and a
 *      "loading" state for slow async confirms.
 *
 * Visual style mirrors the existing MeetingModal in CalendarClient.tsx
 * (border-surface-border / bg-surface-secondary / shadow-2xl) so dialogs feel
 * native to the app rather than bolted on.
 */

export type ConfirmTone = "default" | "danger";

export interface ConfirmOptions {
  /** Short, sentence-case heading. e.g. `Delete "Batteries Plus"?` */
  title: string;
  /**
   * Body copy. Plain string for one-liners, or a ReactNode for richer
   * content (e.g. an inline chip naming the resource being deleted).
   */
  description?: React.ReactNode;
  /** Confirm button label. Defaults to "Confirm" or "Delete" for danger tone. */
  confirmLabel?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /**
   * `danger` swaps the confirm button to a red destructive style and adds a
   * warning icon — use for any irreversible action. `default` is neutral
   * accent (cyan).
   */
  tone?: ConfirmTone;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface QueuedConfirm {
  options: ConfirmOptions;
  resolve: (result: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<QueuedConfirm | null>(null);
  // `pending` flips true while the user clicked Confirm and the caller is
  // still doing work (e.g. an async server action). We don't actually run the
  // caller's work here — the contract is: `confirm()` resolves immediately on
  // click, and the caller drives any subsequent loading UI itself. So
  // `pending` here is just a guard against double-clicks while the close
  // animation/tear-down runs.
  const [pending, setPending] = useState(false);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setActive({ options, resolve });
      setPending(false);
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      if (!active || pending) return;
      if (result) setPending(true);
      active.resolve(result);
      // Clear synchronously so a follow-up `confirm()` call from the resolver
      // chain (rare but possible) gets a fresh dialog rather than animating
      // over the previous one.
      setActive(null);
      setPending(false);
    },
    [active, pending],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {active && (
        <ConfirmDialog
          options={active.options}
          onCancel={() => close(false)}
          onConfirm={() => close(true)}
          pending={pending}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error(
      "useConfirm() called outside of <ConfirmProvider>. Wrap your tree in components/Providers.tsx.",
    );
  }
  return ctx;
}

interface ConfirmDialogProps {
  options: ConfirmOptions;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}

function ConfirmDialog({
  options,
  onCancel,
  onConfirm,
  pending,
}: ConfirmDialogProps) {
  const {
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    tone = "default",
  } = options;

  const isDanger = tone === "danger";
  const resolvedConfirmLabel =
    confirmLabel ?? (isDanger ? "Delete" : "Confirm");

  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the *cancel* button by default for destructive actions (safer
  // default — Enter doesn't immediately delete) and the *confirm* button
  // for non-destructive ones (faster path for the common case).
  useEffect(() => {
    const target = isDanger ? cancelRef.current : confirmRef.current;
    target?.focus();
  }, [isDanger]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      // Tiny focus trap so Tab cycles between Cancel and Confirm and never
      // escapes the dialog. This is enough for a 2-button confirm; richer
      // dialogs would need a real focus-trap library.
      if (e.key === "Tab") {
        const focusables = [cancelRef.current, confirmRef.current].filter(
          (el): el is HTMLButtonElement => el !== null,
        );
        if (focusables.length === 0) return;
        const current = document.activeElement;
        const idx = focusables.findIndex((el) => el === current);
        e.preventDefault();
        const nextIdx = e.shiftKey
          ? (idx <= 0 ? focusables.length - 1 : idx - 1)
          : (idx === focusables.length - 1 ? 0 : idx + 1);
        focusables[nextIdx]?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? "confirm-dialog-desc" : undefined}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Only treat a press that *starts* on the backdrop as a cancel.
        // Without this guard, dragging a text selection from inside the
        // dialog out onto the backdrop would close it on mouseup.
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-xl border border-surface-border border-t-[3px] border-t-accent bg-surface-secondary p-6 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          {isDanger && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle
                size={20}
                strokeWidth={1.8}
                className="text-red-500 dark:text-red-400"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-dialog-title"
              className="text-base font-semibold text-text-primary"
            >
              {title}
            </h3>
            {description && (
              <div
                id="confirm-dialog-desc"
                className="mt-2 text-sm leading-relaxed text-text-secondary"
              >
                {description}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex h-9 items-center justify-center rounded-md border border-surface-border bg-surface-elevated px-4 text-sm font-medium text-text-primary transition hover:bg-surface-elevated/70 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={
              isDanger
                ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                : "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {pending && (
              <Loader2 size={14} strokeWidth={2} className="animate-spin" />
            )}
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
