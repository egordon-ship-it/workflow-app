import type { LucideIcon } from "lucide-react";

/**
 * The one section-header style for the app.
 *
 * Standardizes on the company-overview treatment (the stated
 * favorite): a thin uppercase tracked label with a small lucide icon,
 * plus an optional right-aligned action (usually an "All X →" link).
 * Replaces the three divergent header styles that had grown up across
 * the overview surfaces — `text-[10px]`/`text-xs`/`text-sm`, two
 * casings, and muted-vs-primary color.
 *
 * The icon AND label share one accent color per section (emerald
 * next-action, indigo briefs, sky activity, etc.) via `iconClassName`
 * — the label tints to match its icon so a section reads as one
 * colored unit. Defaults to muted, so a header with no `iconClassName`
 * stays neutral. Quiet inline descriptors / count badges inside the
 * `label` node opt back out by setting their own `text-text-muted`.
 */
interface SectionHeaderProps {
  icon?: LucideIcon;
  /** Tailwind text-color class for the icon (e.g. "text-emerald-500"). */
  iconClassName?: string;
  /** Usually a plain string; accepts a node so blocks can append a
   *  quiet inline descriptor (reset case/weight with `normal-case
   *  font-normal` on the nested span). */
  label: React.ReactNode;
  /** Right-aligned node — typically a small "All X →" link. */
  action?: React.ReactNode;
  className?: string;
}

export default function SectionHeader({
  icon: Icon,
  iconClassName = "text-text-muted",
  label,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <h2
        className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${iconClassName}`}
      >
        {Icon && <Icon size={13} strokeWidth={1.8} />}
        {label}
      </h2>
      {action}
    </div>
  );
}
