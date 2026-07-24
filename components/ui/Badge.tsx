import type { ReactNode } from "react";

/**
 * The one small status-token style for the app — pills, chips, badges.
 *
 * Consolidates the divergent "little colored token" treatments that had
 * grown up independently: the deal-context `SeverityChip` (rose/amber/
 * muted soft pills), the product catalog chips (per-SKU palette + a
 * leading dot), and assorted inline status text. They shared a silhouette
 * (`rounded-full`, soft bg, `font-medium`) but each re-derived it, so
 * weights and paddings drifted a half-step apart.
 *
 * Two color paths:
 *   - `tone` — a semantic keyword that maps to a soft bg + text (+ ring
 *     for the loud tones). Use this for severity / risk / status where
 *     the meaning is "danger vs warning vs fine."
 *   - `className` with `tone="none"` — bring your own palette (e.g. the
 *     product catalog's per-SKU `bg-*`/`text-*`), when the color encodes
 *     identity rather than severity.
 *
 * `dot` renders a `bg-current` leading dot (inherits the text color);
 * `leading` overrides it with an arbitrary node (e.g. a spinner while a
 * toggle is in flight). Trailing content (a remove button) is just part
 * of `children`.
 */
export type BadgeTone =
  | "neutral"
  | "danger"
  | "warning"
  | "success"
  | "info"
  | "none";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-surface-elevated text-text-muted",
  danger:
    "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-300/60 dark:bg-rose-900/40 dark:text-rose-200 dark:ring-rose-700/40",
  warning:
    "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300/60 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-700/40",
  success:
    "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-300/60 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-700/40",
  info: "bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-300/60 dark:bg-sky-900/40 dark:text-sky-200 dark:ring-sky-700/40",
  none: "",
};

const SIZE = {
  sm: "px-1.5 py-0.5 text-[10px] gap-1",
  md: "px-2.5 py-1 text-xs gap-1.5",
} as const;

/** Corner treatment. `pill` (default) is the fully-rounded severity/
 *  status token; `square` is the softly-rounded identity chip (product
 *  SKUs) — squared so a row of identity chips reads as a tidy set of
 *  tags rather than a string of lozenges. */
const SHAPE = {
  pill: "rounded-full",
  square: "rounded-md",
} as const;

interface BadgeProps {
  tone?: BadgeTone;
  size?: keyof typeof SIZE;
  shape?: keyof typeof SHAPE;
  /** Render a leading `bg-current` dot. Ignored when `leading` is set. */
  dot?: boolean;
  /** Custom leading node (e.g. a spinner) — overrides `dot`. */
  leading?: ReactNode;
  /** Extra classes; the place to pass a full palette override alongside
   *  `tone="none"`. Appended last so callers win. */
  className?: string;
  children: ReactNode;
}

export default function Badge({
  tone = "neutral",
  size = "sm",
  shape = "pill",
  dot = false,
  leading,
  className = "",
  children,
}: BadgeProps) {
  const lead =
    leading ??
    (dot ? (
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current"
      />
    ) : null);

  return (
    <span
      className={`inline-flex shrink-0 items-center font-medium ${SHAPE[shape]} ${SIZE[size]} ${TONE[tone]} ${className}`}
    >
      {lead}
      {children}
    </span>
  );
}

/** Maps a deal-context severity / risk level to a Badge tone. Kept here
 *  so every surface that renders a severity pill agrees on the mapping. */
export function severityTone(severity: "high" | "medium" | "low"): BadgeTone {
  return severity === "high"
    ? "danger"
    : severity === "medium"
      ? "warning"
      : "neutral";
}
