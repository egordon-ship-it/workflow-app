import type { HTMLAttributes } from "react";

/**
 * Canonical surface container for the app — one card, used everywhere.
 *
 * Consolidates the four hand-rolled card treatments that had drifted
 * apart across the overview surfaces (company-hub `Block`, the
 * opportunity Facts grid, the Strategy-tab `Card`, and the inline
 * editor panels). Each of those mixed `rounded-lg`/`rounded-xl`, a
 * bare `border` *and* a `ring-1` (a redundant double edge), and
 * `bg-…/60`/solid backgrounds. This is the single agreed look:
 *
 *   rounded-xl · solid surface-secondary · single inset-free ring ·
 *   p-5
 *
 * Tones cover the accent banner (Setup checklist) and the won/lost
 * Strategy cards without each re-deriving its own ring colors.
 *
 * Presentational only — pass any extra layout via `className`; it's
 * appended last so callers can override spacing per instance.
 */
type CardTone = "default" | "accent" | "warning" | "success";
type CardPadding = "default" | "compact" | "none";

const TONE: Record<CardTone, string> = {
  default: "bg-surface-secondary ring-surface-border",
  accent: "bg-accent/5 ring-accent/25",
  warning:
    "bg-surface-secondary ring-amber-300/60 dark:ring-amber-700/40",
  success:
    "bg-surface-secondary ring-emerald-300/60 dark:ring-emerald-700/40",
};

const PADDING: Record<CardPadding, string> = {
  default: "p-5",
  compact: "p-4",
  none: "",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: CardPadding;
  /** Optional colored accent bar (e.g. "bg-sky-500"). Rendered as a
   *  full-height bar on the LEFT edge so the page is scannable by
   *  section color without a heavy top banner. When set, the ring +
   *  radius live on the outer element and padding moves to an inner
   *  wrapper so the bar runs edge-to-edge. */
  accentClass?: string;
}

export default function Card({
  tone = "default",
  padding = "default",
  accentClass,
  className = "",
  children,
  ...rest
}: CardProps) {
  if (accentClass) {
    return (
      <div
        className={`flex overflow-hidden rounded-xl ring-1 ${TONE[tone]} ${className}`}
        {...rest}
      >
        <div className={`w-1 shrink-0 ${accentClass}`} />
        <div className={`min-w-0 flex-1 ${PADDING[padding]}`}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl ring-1 ${TONE[tone]} ${PADDING[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
