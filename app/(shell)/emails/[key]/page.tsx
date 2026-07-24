import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, GitBranch, Mail } from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import GroupLabel from "@/components/ui/GroupLabel";
import Badge from "@/components/ui/Badge";
import {
  listCatalogEmails,
  getEmailByKey,
} from "@/lib/workflows";
import { getEmailContent } from "@/lib/emails/getEmailContent";

export function generateStaticParams() {
  const seen = new Set<string>();
  return listCatalogEmails()
    .filter(({ email }) => {
      if (seen.has(email.key)) return false;
      seen.add(email.key);
      return true;
    })
    .map(({ email }) => ({ key: email.key }));
}

export default function EmailDetailPage({
  params,
}: {
  params: { key: string };
}) {
  const match = getEmailByKey(params.key);
  if (!match) notFound();

  const { email, workflow } = match;
  const content = getEmailContent(email.key);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/emails"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent"
        >
          <ArrowLeft size={12} strokeWidth={1.8} />
          All emails
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Mail size={20} strokeWidth={1.8} className="text-accent" />
          <h1 className="text-2xl font-semibold text-text-primary">
            {email.name}
          </h1>
        </div>
        <p className="mt-1 text-sm text-text-secondary">{email.purpose}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="none" className="bg-accent-muted text-accent">
            {email.key}
          </Badge>
          <Badge
            tone={
              email.trigger === "scheduled"
                ? "warning"
                : email.trigger === "manual"
                  ? "neutral"
                  : "info"
            }
          >
            {email.trigger}
          </Badge>
          {email.step != null ? (
            <Badge tone="neutral">Step {email.step}</Badge>
          ) : null}
          {content?.versionUsed != null ? (
            <Badge tone="success">Word V. {content.versionUsed}</Badge>
          ) : content ? (
            <Badge tone="neutral">Word (unversioned)</Badge>
          ) : (
            <Badge tone="warning">Body pending</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/workflows/${workflow.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-surface-border bg-surface-elevated px-3 text-sm font-medium text-text-primary transition hover:bg-accent-muted hover:text-accent"
        >
          Back to workflow
        </Link>
        <span
          title="HubSpot link not connected yet"
          className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-white opacity-50"
        >
          Open in HubSpot <ExternalLink size={14} strokeWidth={1.8} />
        </span>
      </div>

      <GroupLabel>Template</GroupLabel>
      <Card>
        <SectionHeader
          icon={Mail}
          iconClassName="text-accent"
          label="Subject"
        />
        <p className="text-sm font-medium text-text-primary">{email.subject}</p>
        {content?.subjectHint && content.subjectHint !== email.subject ? (
          <p className="mt-2 text-xs text-text-muted">
            Subject hint from Word: {content.subjectHint}
          </p>
        ) : null}
        {email.apps?.length ? (
          <p className="mt-3 text-xs text-text-muted">
            Apps: {email.apps.join("; ")}
          </p>
        ) : null}
      </Card>

      <GroupLabel>Email body</GroupLabel>
      <Card>
        <SectionHeader
          icon={FileText}
          iconClassName="text-accent"
          label={
            content?.versionUsed != null
              ? `Body (V. ${content.versionUsed})`
              : "Body"
          }
        />
        {content?.body ? (
          <div className="mt-1 whitespace-pre-line text-sm leading-relaxed text-text-primary">
            {content.body}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No Word body imported for this key yet.
          </p>
        )}
      </Card>

      <GroupLabel>Used in workflow</GroupLabel>
      <Card accentClass="bg-accent">
        <SectionHeader
          icon={GitBranch}
          iconClassName="text-accent"
          label={workflow.name}
          action={
            <Link
              href={`/workflows/${workflow.id}`}
              className="text-xs font-medium text-accent hover:underline"
            >
              Open workflow
            </Link>
          }
        />
        <p className="mt-1 text-xs text-text-muted">
          <code className="rounded bg-surface-elevated px-1">
            {workflow.sequenceKey}
          </code>
        </p>
        <p className="mt-2 text-sm text-text-secondary">{workflow.summary}</p>
      </Card>
    </div>
  );
}
