import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  GitBranch,
  History,
  Link2,
  Mails,
  ShieldOff,
  Users,
} from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import GroupLabel from "@/components/ui/GroupLabel";
import Badge from "@/components/ui/Badge";
import { DEPARTMENTS } from "@/lib/navigation";
import { listCatalogEmails } from "@/lib/workflows";

export default function HomePage() {
  const workflowCount = DEPARTMENTS.reduce(
    (sum, d) => sum + d.workflows.length,
    0
  );
  const emailCount = listCatalogEmails().length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Email Workflows
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Single source of truth for every email workflow at Dynamic Media —
          start/stop rules, enrollment, timing, suppression, and history —
          across billing, customers, VIP programs (Tim Hortons, Encore),
          technician/dealer, and internal staff.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Departments" value={String(DEPARTMENTS.length)} />
        <StatCard label="Workflows" value={String(workflowCount)} />
        <StatCard label="Emails cataloged" value={String(emailCount)} />
      </div>

      <GroupLabel>Browse by department</GroupLabel>

      <div className="grid gap-4 sm:grid-cols-2">
        {DEPARTMENTS.map((department) => {
          const Icon = department.icon;
          return (
            <Card key={department.slug} accentClass="bg-accent">
              <SectionHeader
                icon={Icon}
                iconClassName="text-accent"
                label={department.name}
                action={
                  <Link
                    href={`/departments/${department.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                  >
                    Open <ArrowRight size={12} />
                  </Link>
                }
              />
              <p className="text-sm leading-relaxed text-text-secondary">
                {department.description}
              </p>
              <p className="mt-3 text-xs text-text-muted">
                {department.workflows.length} workflow
                {department.workflows.length === 1 ? "" : "s"}
              </p>
            </Card>
          );
        })}
      </div>

      <GroupLabel>What this shell covers</GroupLabel>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <SectionHeader
            icon={GitBranch}
            iconClassName="text-accent"
            label="Workflow logic"
          />
          <ul className="space-y-2 text-sm leading-relaxed text-text-secondary">
            <li className="flex items-start gap-2">
              <Clock3 size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-text-muted" />
              Start / stop and timing rules
            </li>
            <li className="flex items-start gap-2">
              <Users size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-text-muted" />
              Enrollment criteria
            </li>
            <li className="flex items-start gap-2">
              <ShieldOff size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-text-muted" />
              Suppression logic
            </li>
            <li className="flex items-start gap-2">
              <History size={14} strokeWidth={1.8} className="mt-0.5 shrink-0 text-text-muted" />
              Enrollment history
            </li>
          </ul>
        </Card>

        <Card>
          <SectionHeader
            icon={Mails}
            iconClassName="text-accent"
            label="Email library + HubSpot"
          />
          <p className="text-sm leading-relaxed text-text-secondary">
            Every system email will live here. Clicking an email will open the
            corresponding HubSpot asset. Content will be imported from Word
            documents in a later pass.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="info">Timed</Badge>
            <Badge tone="neutral">Manual</Badge>
            <Badge tone="success">Trigger</Badge>
          </div>
          <Link
            href="/emails"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
          >
            <Link2 size={12} strokeWidth={1.8} />
            Go to All Emails
          </Link>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-secondary p-4 ring-1 ring-surface-border">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
