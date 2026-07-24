import type { ReactNode } from "react";

/**
 * Zone label — a labeled hairline divider that sits one tier ABOVE the
 * card `SectionHeader`s, grouping a run of cards into a named zone (e.g.
 * "The deal", "Customer intelligence", "Triage sources").
 *
 * Deliberately distinct from `SectionHeader` so the two tiers don't
 * compete: no icon, slightly darker (secondary) text, wider tracking,
 * and a rule that runs to the edge. `SectionHeader` names one card;
 * `GroupLabel` names a group of them.
 *
 * Promoted out of the opportunity page into `ui/` because zone labels
 * are part of the shared design language the Overview pattern cascades
 * to the other tabs — keep new zones consistent by using this rather
 * than re-deriving the divider.
 */
export default function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
        {children}
      </h2>
      <span className="h-px flex-1 bg-surface-border" />
    </div>
  );
}
