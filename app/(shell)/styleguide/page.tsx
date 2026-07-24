import {
  CircleDollarSign,
  Layers,
  ListTodo,
  MessageSquare,
  Sparkles,
  Table2,
  Type,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import DataTable, {
  DataTableBody,
  dataTableCellClass,
  dataTableHeadCellClass,
  dataTableRowClass,
} from "@/components/ui/DataTable";
import EmptySectionCard, {
  emptySectionCtaClass,
} from "@/components/ui/EmptySectionCard";
import GroupLabel from "@/components/ui/GroupLabel";
import SectionHeader from "@/components/ui/SectionHeader";
import InteractiveDemos from "./InteractiveDemos";

/**
 * Live gallery of the design system. Everything on this page is built
 * from the shared primitives in components/ui — copy the patterns here
 * rather than inventing new treatments.
 */

const TOKENS: { name: string; className: string; usage: string }[] = [
  { name: "surface-primary", className: "bg-surface-primary", usage: "page background" },
  { name: "surface-secondary", className: "bg-surface-secondary", usage: "cards, sidebar, topbar" },
  { name: "surface-elevated", className: "bg-surface-elevated", usage: "hover states, wells" },
  { name: "surface-border", className: "bg-surface-border", usage: "hairlines" },
  { name: "accent", className: "bg-accent", usage: "brand cyan #00AEEF" },
  { name: "accent-hover", className: "bg-accent-hover", usage: "hover on accent" },
];

const SAMPLE_ROWS = [
  { name: "Batteries Plus", stage: "Discovery", owner: "R. Santangelo", value: "$42,000" },
  { name: "Camping World", stage: "Proposal", owner: "M. Chen", value: "$118,500" },
  { name: "Pet Supplies Co", stage: "Won", owner: "R. Santangelo", value: "$67,200" },
];

export default function StyleGuidePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Style guide</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Every shared primitive, live. Flip the theme toggle in the top bar
          to check both modes.
        </p>
      </div>

      {/* ── Tokens ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <GroupLabel>Design tokens</GroupLabel>
        <Card>
          <SectionHeader icon={Layers} iconClassName="text-sky-500" label="Color tokens" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TOKENS.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <span
                  className={`h-8 w-8 shrink-0 rounded-md ring-1 ring-surface-border ${t.className}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-text-primary">{t.name}</p>
                  <p className="truncate text-[11px] text-text-muted">{t.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader icon={Type} iconClassName="text-indigo-500" label="Typography" />
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-text-primary">Page title — 2xl semibold</p>
            <p className="text-base font-semibold text-text-primary">Dialog heading — base semibold</p>
            <p className="text-sm text-text-secondary">Body copy — sm secondary</p>
            <p className="text-xs text-text-muted">Metadata — xs muted</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Section header — xs uppercase tracked
            </p>
          </div>
        </Card>
      </section>

      {/* ── Badges ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <GroupLabel>Badges</GroupLabel>
        <Card>
          <SectionHeader icon={Sparkles} iconClassName="text-amber-500" label="Tones and shapes" />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="info">Info</Badge>
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="success" dot>
              With dot
            </Badge>
            <Badge tone="info" size="md">
              Medium
            </Badge>
            <Badge tone="none" shape="square" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
              Identity chip
            </Badge>
          </div>
        </Card>
      </section>

      {/* ── Cards ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <GroupLabel>Cards</GroupLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <SectionHeader label="Default card" />
            <p className="text-sm text-text-secondary">
              rounded-xl, solid surface-secondary, single hairline ring, p-5.
            </p>
          </Card>
          <Card tone="accent">
            <SectionHeader label="Accent tone" iconClassName="text-accent" />
            <p className="text-sm text-text-secondary">
              For callouts and setup checklists.
            </p>
          </Card>
          <Card accentClass="bg-rose-500">
            <SectionHeader
              icon={CircleDollarSign}
              iconClassName="text-rose-500"
              label="Accent bar"
            />
            <p className="text-sm text-text-secondary">
              A colored left-edge bar makes a page scannable by section color.
            </p>
          </Card>
          <Card tone="success">
            <SectionHeader label="Success tone" iconClassName="text-emerald-600" />
            <p className="text-sm text-text-secondary">For won/positive states.</p>
          </Card>
        </div>
      </section>

      {/* ── Data table ─────────────────────────────────────── */}
      <section className="space-y-4">
        <GroupLabel>Data table</GroupLabel>
        <Card>
          <SectionHeader icon={Table2} iconClassName="text-sky-500" label="Dense table shell" />
          <DataTable>
            <thead>
              <tr>
                <th className={dataTableHeadCellClass}>Account</th>
                <th className={dataTableHeadCellClass}>Stage</th>
                <th className={dataTableHeadCellClass}>Owner</th>
                <th className={`${dataTableHeadCellClass} text-right`}>Value</th>
              </tr>
            </thead>
            <DataTableBody>
              {SAMPLE_ROWS.map((row) => (
                <tr key={row.name} className={dataTableRowClass}>
                  <td className={`${dataTableCellClass} font-medium text-text-primary`}>
                    {row.name}
                  </td>
                  <td className={dataTableCellClass}>
                    <Badge
                      tone={
                        row.stage === "Won"
                          ? "success"
                          : row.stage === "Proposal"
                            ? "info"
                            : "neutral"
                      }
                    >
                      {row.stage}
                    </Badge>
                  </td>
                  <td className={`${dataTableCellClass} text-text-secondary`}>{row.owner}</td>
                  <td className={`${dataTableCellClass} text-right tabular-nums text-text-primary`}>
                    {row.value}
                  </td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
        </Card>
      </section>

      {/* ── Empty state ────────────────────────────────────── */}
      <section className="space-y-4">
        <GroupLabel>Empty state</GroupLabel>
        <EmptySectionCard
          icon={ListTodo}
          iconClassName="text-emerald-500"
          accentClass="bg-emerald-500"
          label="Tasks"
          descriptor="what needs doing next"
        >
          <button type="button" className={emptySectionCtaClass}>
            <ListTodo size={15} strokeWidth={1.8} />
            Add the first task
          </button>
        </EmptySectionCard>
      </section>

      {/* ── Interactive: buttons, forms, toast, confirm ────── */}
      <section className="space-y-4">
        <GroupLabel>Buttons, forms &amp; dialogs</GroupLabel>
        <Card>
          <SectionHeader
            icon={MessageSquare}
            iconClassName="text-accent"
            label="Interactive patterns"
          />
          <InteractiveDemos />
        </Card>
      </section>
    </div>
  );
}
