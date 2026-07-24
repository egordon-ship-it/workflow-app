"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";

/**
 * Canonical button and input classes. There is deliberately no <Button>
 * component — buttons are styled inline with these recipes so call sites
 * keep full control. Copy them verbatim.
 */
export const primaryButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-surface-border bg-surface-elevated px-4 text-sm font-medium text-text-primary transition hover:bg-surface-elevated/70 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-50";

export const inputClass =
  "w-full rounded-md border border-surface-border bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export const labelClass =
  "mb-1 block text-xs font-medium text-text-secondary";

export default function InteractiveDemos() {
  const confirm = useConfirm();
  const [text, setText] = useState("");

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete "Sample record"?',
      description:
        "This is the branded replacement for window.confirm(). Danger tone focuses Cancel by default so Enter can't immediately delete.",
      tone: "danger",
    });
    if (ok) toast.success("Deleted (not really).");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium text-text-secondary">Buttons</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => toast.success("Saved!")}
          >
            Primary action
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => toast("A neutral toast.")}
          >
            Secondary
          </button>
          <button type="button" className={dangerButtonClass} onClick={handleDelete}>
            <Trash2 size={14} strokeWidth={1.8} />
            Delete (opens confirm)
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Text input</span>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something…"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Select</span>
          <select className={inputClass} defaultValue="b">
            <option value="a">Option A</option>
            <option value="b">Option B</option>
            <option value="c">Option C</option>
          </select>
        </label>
      </div>

      <p className="text-xs leading-relaxed text-text-muted">
        Native <code>window.confirm</code> / <code>alert</code> /{" "}
        <code>prompt</code> are banned by ESLint. Use{" "}
        <code>useConfirm()</code> for yes/no questions and{" "}
        <code>react-hot-toast</code> for transient notifications.
      </p>
    </div>
  );
}
