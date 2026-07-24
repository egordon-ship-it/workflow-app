import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";

/**
 * The one empty-state for a section. Models the Products empty state
 * (the agreed favorite): a full bordered `Card` with its colored accent
 * bar, a `SectionHeader` (icon + label + a short inline descriptor of
 * what the section is for), and a prominent full-width dashed CTA button
 * below. Replaces the divergent empty treatments that had grown up —
 * thin "click to add" rows (Description / Deal notes), a combined
 * starter card (Customer intelligence), and header-only zones.
 *
 * Presentational + hook-free so it renders in both server and client
 * trees. The CTA itself is passed as `children` so each call site wires
 * its own action (open a picker, enter edit, open a create modal); style
 * that trigger with the exported `emptySectionCtaClass` so every CTA
 * looks identical.
 */

/** Shared look for the dashed call-to-action button inside an empty
 *  section card. Apply to whatever trigger element a call site uses. */
export const emptySectionCtaClass =
  "group flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-surface-border bg-surface-elevated/40 px-4 py-5 text-sm text-text-muted transition hover:border-accent/50 hover:bg-accent/5 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60";

interface EmptySectionCardProps {
  icon: LucideIcon;
  /** Tailwind text-color class for the icon (e.g. "text-rose-500"). */
  iconClassName?: string;
  /** Colored accent bar on the card's left edge (e.g. "bg-rose-500"). */
  accentClass?: string;
  /** Section name — e.g. "Pain". */
  label: ReactNode;
  /** Short plain-language note on what the section is for, rendered
   *  quiet + inline after the label (e.g. "what's hurting the buyer"). */
  descriptor?: string;
  /** The CTA trigger — style it with `emptySectionCtaClass`. */
  children: ReactNode;
}

export default function EmptySectionCard({
  icon,
  iconClassName,
  accentClass,
  label,
  descriptor,
  children,
}: EmptySectionCardProps) {
  return (
    <Card accentClass={accentClass}>
      <SectionHeader
        icon={icon}
        iconClassName={iconClassName}
        label={
          <>
            {label}
            {descriptor && (
              <span className="font-normal normal-case tracking-normal text-text-muted">
                {" "}
                · {descriptor}
              </span>
            )}
          </>
        }
      />
      {children}
    </Card>
  );
}
