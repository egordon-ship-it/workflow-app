import { notFound } from "next/navigation";
import {
  Clock3,
  History,
  Mail,
  ShieldOff,
  Users,
} from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import GroupLabel from "@/components/ui/GroupLabel";
import EmptySectionCard, {
  emptySectionCtaClass,
} from "@/components/ui/EmptySectionCard";
import WorkflowDetailClient from "@/components/WorkflowDetailClient";
import {
  DEPARTMENTS,
  getWorkflow,
} from "@/lib/navigation";
import { getWorkflowDefinition } from "@/lib/workflows";

export function generateStaticParams() {
  return DEPARTMENTS.flatMap((d) =>
    d.workflows.map((w) => ({ id: w.id }))
  );
}

export default function WorkflowPage({
  params,
}: {
  params: { id: string };
}) {
  const match = getWorkflow(params.id);
  if (!match) notFound();

  const { department, workflow } = match;
  const def = getWorkflowDefinition(params.id);

  if (def) {
    return (
      <WorkflowDetailClient
        baseDefinition={def}
        department={{
          slug: department.slug,
          name: department.name,
        }}
        processType={workflow.processType}
      />
    );
  }

  const DeptIcon = department.icon;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {department.name} / Workflow
        </p>
        <div className="mt-1 flex items-center gap-2">
          <DeptIcon size={22} strokeWidth={1.8} className="text-accent" />
          <h1 className="text-2xl font-semibold text-text-primary">
            {workflow.name}
          </h1>
        </div>
      </div>
      <PlaceholderBody />
    </div>
  );
}

function PlaceholderBody() {
  return (
    <>
      <GroupLabel>Logic</GroupLabel>
      <div className="grid gap-4 sm:grid-cols-2">
        <PlaceholderLogicCard
          icon={Users}
          label="Enrollment rules"
          body="Who enters this workflow, and under what conditions."
        />
        <PlaceholderLogicCard
          icon={Clock3}
          label="Start / stop & timing"
          body="Entry triggers, delays between steps, and exit criteria."
        />
        <PlaceholderLogicCard
          icon={ShieldOff}
          label="Suppression logic"
          body="Who is excluded, opt-outs, and conflict rules with other flows."
        />
        <PlaceholderLogicCard
          icon={History}
          label="Enrollment history"
          body="Everyone who has gone through this workflow so far."
        />
      </div>
      <GroupLabel>Emails in this workflow</GroupLabel>
      <EmptySectionCard
        icon={Mail}
        iconClassName="text-accent"
        accentClass="bg-accent"
        label="Emails"
        descriptor="sequence & HubSpot links"
      >
        <button type="button" className={emptySectionCtaClass} disabled>
          Word docs and HubSpot links will appear here
        </button>
      </EmptySectionCard>
    </>
  );
}

function PlaceholderLogicCard({
  icon: Icon,
  label,
  body,
}: {
  icon: typeof Users;
  label: string;
  body: string;
}) {
  return (
    <Card>
      <SectionHeader icon={Icon} iconClassName="text-accent" label={label} />
      <p className="text-sm leading-relaxed text-text-secondary">{body}</p>
      <p className="mt-3 text-xs text-text-muted">Details coming in next phase</p>
    </Card>
  );
}
