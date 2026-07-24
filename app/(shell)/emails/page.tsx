import Link from "next/link";
import { ArrowRight, ExternalLink, Mail } from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import GroupLabel from "@/components/ui/GroupLabel";
import Badge from "@/components/ui/Badge";
import {
  DEPARTMENTS,
  getWorkflow,
  processTypeLabel,
  type ProcessType,
} from "@/lib/navigation";
import { WORKFLOWS } from "@/lib/workflows";
import { hasEmailContent } from "@/lib/emails/getEmailContent";

/**
 * Email library — catalog keys linked to workflows, with Word bodies
 * imported from Marketing content-management logs (latest V.n).
 */

type CatalogEmail = {
  id: string;
  name: string;
  key?: string;
  subject?: string;
  department: string;
  workflowId: string;
  workflowName: string;
  processType: ProcessType;
  real: boolean;
  hasBody: boolean;
};

function buildCatalog(): CatalogEmail[] {
  const fromSpecs: CatalogEmail[] = WORKFLOWS.flatMap((wf) => {
    const match = getWorkflow(wf.id);
    if (!match) return [];
    return wf.emails.map((email) => ({
      id: `${wf.id}-${email.key}`,
      name: email.name,
      key: email.key,
      subject: email.subject,
      department: match.department.name,
      workflowId: wf.id,
      workflowName: wf.name,
      processType: wf.processType,
      real: true,
      hasBody: hasEmailContent(email.key),
    }));
  });

  const coveredWorkflowIds = new Set(WORKFLOWS.map((w) => w.id));

  const placeholders: CatalogEmail[] = DEPARTMENTS.flatMap((department) =>
    department.workflows
      .filter((w) => !coveredWorkflowIds.has(w.id))
      .map((workflow, index) => ({
        id: `${workflow.id}-email-${index + 1}`,
        name: `${workflow.name} — Email ${index + 1}`,
        department: department.name,
        workflowId: workflow.id,
        workflowName: workflow.name,
        processType: workflow.processType,
        real: false,
        hasBody: false,
      }))
  );

  return [...fromSpecs, ...placeholders];
}

const CATALOG = buildCatalog();
const withBody = CATALOG.filter((e) => e.hasBody).length;
const realCount = CATALOG.filter((e) => e.real).length;

export default function EmailsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">All Emails</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          {withBody} of {realCount} catalog templates include Word body copy
          (latest V.n from Marketing logs). HubSpot deep links come next.
        </p>
      </div>

      <GroupLabel>Library</GroupLabel>

      <div className="space-y-3">
        {CATALOG.map((email) => (
          <Card key={email.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <SectionHeader
                  icon={Mail}
                  iconClassName="text-accent"
                  label={email.name}
                />
                <p className="mt-1 text-sm text-text-secondary">
                  {email.department} · {email.workflowName}
                  {email.key ? (
                    <>
                      {" "}
                      ·{" "}
                      <Link
                        href={`/emails/${email.key}`}
                        className="font-medium text-accent hover:underline"
                      >
                        <code className="rounded bg-surface-elevated px-1 text-xs">
                          {email.key}
                        </code>
                      </Link>
                    </>
                  ) : null}
                </p>
                {email.subject ? (
                  <p className="mt-1 text-xs text-text-muted">
                    Subject: {email.subject}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="neutral">
                    {processTypeLabel(email.processType)}
                  </Badge>
                  {email.real ? (
                    <Badge tone="success">Catalog</Badge>
                  ) : (
                    <Badge tone="warning">Placeholder</Badge>
                  )}
                  {email.hasBody ? (
                    <Badge tone="info">Body imported</Badge>
                  ) : email.real ? (
                    <Badge tone="warning">Body pending</Badge>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href={
                    email.key
                      ? `/emails/${email.key}`
                      : `/workflows/${email.workflowId}`
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-surface-border bg-surface-elevated px-3 text-sm font-medium text-text-primary transition hover:bg-accent-muted hover:text-accent"
                >
                  {email.key ? "Open email" : "Workflow"}{" "}
                  <ArrowRight size={14} strokeWidth={1.8} />
                </Link>
                <span
                  title="HubSpot link not connected yet"
                  className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-white opacity-50"
                >
                  HubSpot <ExternalLink size={14} strokeWidth={1.8} />
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
