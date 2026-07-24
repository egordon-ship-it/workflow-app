import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, GitBranch } from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import GroupLabel from "@/components/ui/GroupLabel";
import Badge from "@/components/ui/Badge";
import {
  DEPARTMENTS,
  getDepartment,
  processTypeLabel,
} from "@/lib/navigation";

export function generateStaticParams() {
  return DEPARTMENTS.map((d) => ({ slug: d.slug }));
}

export default function DepartmentPage({
  params,
}: {
  params: { slug: string };
}) {
  const department = getDepartment(params.slug);
  if (!department) notFound();

  const Icon = department.icon;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Department
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Icon size={22} strokeWidth={1.8} className="text-accent" />
          <h1 className="text-2xl font-semibold text-text-primary">
            {department.name}
          </h1>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          {department.description}
        </p>
      </div>

      <GroupLabel>Workflows</GroupLabel>

      <div className="grid gap-4 sm:grid-cols-2">
        {department.workflows.map((workflow) => (
          <Card key={workflow.id} accentClass="bg-accent">
            <SectionHeader
              icon={GitBranch}
              iconClassName="text-accent"
              label={workflow.name}
              action={
                <Link
                  href={`/workflows/${workflow.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  Open <ArrowRight size={12} />
                </Link>
              }
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="info">{processTypeLabel(workflow.processType)}</Badge>
              {workflow.sequenceKey ? (
                <Badge tone="none" className="bg-accent-muted text-accent">
                  {workflow.sequenceKey}
                </Badge>
              ) : (
                <Badge tone="warning">Shell</Badge>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {workflow.summary ??
                "Shell placeholder — enrollment rules, timing, suppression, email sequence, and history will land here."}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
