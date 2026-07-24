import type { ReactNode } from "react";

/**
 * Dense table shell — the shared chrome for the app's data tables.
 *
 * Today the activity digest, the tasks tables, and the big accounts
 * table each draw their own container ring, row dividers, and hover
 * treatment. This is the agreed shell so they read identically:
 *
 *   - a rounded container clipped by a hairline ring
 *   - `text-xs` base type
 *   - zebra-free rows separated by hairline dividers
 *   - subtle row hover
 *
 * Row/cell classes are exported as constants rather than baked into
 * subcomponents so callers keep full control of their column layout
 * (widths, alignment, responsive hiding) while still inheriting the
 * shared rhythm. Numeric / date columns should add `tabular-nums`.
 *
 * Intentionally NOT a do-everything table: the sortable, selectable
 * accounts table layers its own header controls on top of this shell
 * during the cascade rather than forcing that complexity in here.
 */
export const dataTableRowClass =
  "transition hover:bg-surface-elevated/60";

export const dataTableCellClass = "px-3 py-2 align-middle";

export const dataTableHeadCellClass =
  "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-text-muted";

interface DataTableProps {
  children: ReactNode;
  /** Extra classes for the outer container (e.g. max height + scroll). */
  className?: string;
  /** Use `table-fixed` layout so the `<colgroup>` widths are honored and
   *  wide cells truncate instead of forcing the table past its container
   *  (which the outer `overflow-hidden` would otherwise clip). Opt-in —
   *  callers with content-sized columns keep the default auto layout. */
  fixed?: boolean;
}

export default function DataTable({
  children,
  className = "",
  fixed = false,
}: DataTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg ring-1 ring-surface-border/70 ${className}`}
    >
      <table className={`w-full text-xs ${fixed ? "table-fixed" : ""}`}>
        {children}
      </table>
    </div>
  );
}

/** Standard hairline-divided body wrapper. */
export function DataTableBody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-surface-border/60">{children}</tbody>
  );
}
