"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  Clock3,
  Coffee,
  ExternalLink,
  GitBranch,
  Headphones,
  History,
  Mail,
  Pencil,
  Plus,
  Receipt,
  ShieldOff,
  Trash2,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import GroupLabel from "@/components/ui/GroupLabel";
import Badge from "@/components/ui/Badge";
import WorkflowDiagram from "@/components/WorkflowDiagram";
import { useConfirm } from "@/components/ConfirmDialog";
import { processTypeLabel, type ProcessType } from "@/lib/navigation";
import type {
  StepKind,
  WorkflowDefinition,
  WorkflowStep,
} from "@/lib/workflows/types";
import {
  clearWorkflowOverride,
  cloneWorkflow,
  loadWorkflowOverride,
  saveWorkflowOverride,
} from "@/lib/workflows/storage";

const inputClass =
  "w-full rounded-md border border-surface-border bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const btnSecondary =
  "inline-flex h-9 items-center gap-1.5 rounded-md border border-surface-border bg-surface-elevated px-3 text-sm font-medium text-text-primary transition hover:bg-accent-muted hover:text-accent disabled:opacity-50";

const btnPrimary =
  "inline-flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50";

const btnDanger =
  "inline-flex h-9 items-center gap-1.5 rounded-md bg-red-600 px-3 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50";

/** Resolve icons on the client — never pass Lucide components across the RSC boundary. */
const DEPT_ICONS: Record<string, LucideIcon> = {
  billing: Receipt,
  customers: Users,
  "tim-hortons": Coffee,
  encore: Building2,
  "technician-dealer": Wrench,
  internal: Headphones,
};

type Props = {
  baseDefinition: WorkflowDefinition;
  department: {
    slug: string;
    name: string;
  };
  processType: ProcessType;
};

function newStepId(kind: string) {
  return `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function syncEmailsFromSteps(def: WorkflowDefinition): WorkflowDefinition {
  const emails = def.steps
    .filter((s) => (s.kind === "email" || s.kind === "sms") && s.emailKey)
    .map((s, i) => {
      const existing = def.emails.find((e) => e.key === s.emailKey);
      return (
        existing ?? {
          key: s.emailKey!,
          name: s.label,
          subject: s.subject ?? s.label,
          purpose: s.note ?? s.label,
          trigger:
            s.kind === "sms"
              ? ("manual" as const)
              : ("event" as const),
          step: i + 1,
        }
      );
    });
  // Keep unique by key
  const seen = new Set<string>();
  const unique = emails.filter((e) => {
    if (seen.has(e.key)) return false;
    seen.add(e.key);
    return true;
  });
  return { ...def, emails: unique };
}

export default function WorkflowDetailClient({
  baseDefinition,
  department,
  processType,
}: Props) {
  const confirm = useConfirm();
  const [saved, setSaved] = useState<WorkflowDefinition>(baseDefinition);
  const [draft, setDraft] = useState<WorkflowDefinition>(baseDefinition);
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [hasOverride, setHasOverride] = useState(false);

  useEffect(() => {
    const override = loadWorkflowOverride(baseDefinition.id);
    const initial = override ?? baseDefinition;
    setSaved(initial);
    setDraft(cloneWorkflow(initial));
    setHasOverride(!!override);
    setHydrated(true);
  }, [baseDefinition]);

  const DeptIcon = DEPT_ICONS[department.slug] ?? GitBranch;
  const display = editing ? draft : saved;
  const selected = useMemo(
    () => display.steps.find((s) => s.id === selectedId) ?? null,
    [display.steps, selectedId]
  );

  const updateDraft = useCallback((updater: (d: WorkflowDefinition) => WorkflowDefinition) => {
    setDraft((prev) => {
      const next = updater(cloneWorkflow(prev));
      setDirty(true);
      return next;
    });
  }, []);

  const beginEdit = () => {
    setDraft(cloneWorkflow(saved));
    setDirty(false);
    setEditing(true);
    setSelectedId(saved.entryStepId);
  };

  const discard = async () => {
    if (dirty) {
      const ok = await confirm({
        title: "Discard changes?",
        description: "Unsaved edits to this workflow will be lost.",
        confirmLabel: "Discard",
        tone: "danger",
      });
      if (!ok) return;
    }
    setDraft(cloneWorkflow(saved));
    setDirty(false);
    setEditing(false);
    setSelectedId(null);
    toast.success("Changes discarded");
  };

  const save = () => {
    const next = syncEmailsFromSteps(draft);
    if (!next.steps.some((s) => s.id === next.entryStepId)) {
      next.entryStepId = next.steps[0]?.id ?? next.entryStepId;
    }
    saveWorkflowOverride(next);
    setSaved(next);
    setDraft(cloneWorkflow(next));
    setDirty(false);
    setEditing(false);
    setSelectedId(null);
    setHasOverride(true);
    toast.success("Workflow saved");
  };

  const resetToCatalog = async () => {
    const ok = await confirm({
      title: "Reset to catalog version?",
      description:
        "This removes your saved edits and restores the original Billing catalog workflow.",
      confirmLabel: "Reset",
      tone: "danger",
    });
    if (!ok) return;
    clearWorkflowOverride(baseDefinition.id);
    setSaved(baseDefinition);
    setDraft(cloneWorkflow(baseDefinition));
    setDirty(false);
    setEditing(false);
    setHasOverride(false);
    toast.success("Restored catalog workflow");
  };

  const moveStep = (id: string, dir: -1 | 1) => {
    updateDraft((d) => {
      const idx = d.steps.findIndex((s) => s.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= d.steps.length) return d;
      const steps = [...d.steps];
      [steps[idx], steps[j]] = [steps[j], steps[idx]];
      return { ...d, steps };
    });
  };

  const removeStep = async (id: string) => {
    if (id === draft.entryStepId) {
      toast.error("Can't delete the entry trigger step");
      return;
    }
    const ok = await confirm({
      title: "Remove this step?",
      description: "Connections pointing here will need to be re-wired.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    updateDraft((d) => {
      const steps = d.steps
        .filter((s) => s.id !== id)
        .map((s) => ({
          ...s,
          next: s.next === id ? undefined : s.next,
          branches: s.branches
            ?.filter((b) => b.next !== id)
            .map((b) => b),
        }));
      return { ...d, steps };
    });
    setSelectedId(null);
  };

  const addStep = (kind: StepKind) => {
    const id = newStepId(kind);
    const step: WorkflowStep = {
      id,
      kind,
      label:
        kind === "email"
          ? "New email"
          : kind === "delay"
            ? "Wait (days TBD)"
            : kind === "branch"
              ? "Decision"
              : kind === "sms"
                ? "New SMS"
                : kind === "exit"
                  ? "End"
                  : kind === "action"
                    ? "Action"
                    : "Trigger",
      emailKey: kind === "email" || kind === "sms" ? `NEW_${Date.now().toString(36).toUpperCase()}` : undefined,
      subject: kind === "email" ? "Subject line" : undefined,
      next: undefined,
      exitTone: kind === "exit" ? "neutral" : undefined,
      triggerKind: kind === "start" ? "event" : undefined,
      branches:
        kind === "branch"
          ? [
              {
                id: `${id}-yes`,
                label: "Yes",
                condition: "Condition met",
                next: draft.steps[draft.steps.length - 1]?.id ?? id,
                tone: "success",
              },
              {
                id: `${id}-no`,
                label: "No",
                condition: "Condition not met",
                next: draft.steps[draft.steps.length - 1]?.id ?? id,
                tone: "danger",
              },
            ]
          : undefined,
    };

    updateDraft((d) => {
      const steps = [...d.steps];
      // Insert after selected, or at end
      const idx = selectedId
        ? steps.findIndex((s) => s.id === selectedId)
        : steps.length - 1;
      const insertAt = idx >= 0 ? idx + 1 : steps.length;
      const prev = steps[insertAt - 1];
      if (prev && prev.kind !== "branch" && !prev.next) {
        prev.next = id;
      } else if (prev && prev.kind !== "branch" && prev.next) {
        step.next = prev.next;
        prev.next = id;
      }
      steps.splice(insertAt, 0, step);
      return { ...d, steps };
    });
    setSelectedId(id);
  };

  const patchSelected = (patch: Partial<WorkflowStep>) => {
    if (!selectedId) return;
    updateDraft((d) => ({
      ...d,
      steps: d.steps.map((s) =>
        s.id === selectedId ? { ...s, ...patch } : s
      ),
    }));
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-sm text-text-muted">
        Loading workflow…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <Link
              href={`/departments/${department.slug}`}
              className="inline-flex items-center gap-1 hover:text-accent"
            >
              <DeptIcon size={12} strokeWidth={1.8} />
              {department.name}
            </Link>
            <span>/</span>
            <span>Workflow</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-text-primary">
            {display.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary">
            {display.summary}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="info">{processTypeLabel(processType)}</Badge>
            <Badge tone="none" className="bg-accent-muted text-accent">
              {display.sequenceKey}
            </Badge>
            {editing ? (
              <Badge tone="warning">Editing</Badge>
            ) : hasOverride ? (
              <Badge tone="success">Saved edits</Badge>
            ) : (
              <Badge tone="success">Spec loaded</Badge>
            )}
            {dirty ? <Badge tone="warning">Unsaved</Badge> : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {!editing ? (
            <>
              <button type="button" className={btnPrimary} onClick={beginEdit}>
                <Pencil size={14} strokeWidth={1.8} />
                Edit
              </button>
              {hasOverride ? (
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={resetToCatalog}
                >
                  Reset to catalog
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                className={btnPrimary}
                onClick={save}
                disabled={!dirty}
              >
                <Check size={14} strokeWidth={1.8} />
                Save
              </button>
              <button type="button" className={btnSecondary} onClick={discard}>
                <X size={14} strokeWidth={1.8} />
                Discard
              </button>
            </>
          )}
        </div>
      </div>

      <GroupLabel>Flow</GroupLabel>
      <WorkflowDiagram
        definition={display}
        editing={editing}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
      />

      {editing ? (
        <EditPanel
          draft={draft}
          selected={selected}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={moveStep}
          onRemove={removeStep}
          onAdd={addStep}
          onPatch={patchSelected}
          onPatchBranch={(branchId, patch) => {
            if (!selectedId) return;
            updateDraft((d) => ({
              ...d,
              steps: d.steps.map((s) => {
                if (s.id !== selectedId || !s.branches) return s;
                return {
                  ...s,
                  branches: s.branches.map((b) =>
                    b.id === branchId ? { ...b, ...patch } : b
                  ),
                };
              }),
            }));
          }}
          onSetEntry={() => {
            if (!selectedId) return;
            updateDraft((d) => ({ ...d, entryStepId: selectedId }));
          }}
        />
      ) : null}

      <DefinedWorkflowBody def={display} />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/emails"
          className={btnSecondary}
        >
          Browse all emails
        </Link>
        <span
          title="HubSpot connection not wired yet"
          className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md bg-accent px-3 text-sm font-medium text-white opacity-50"
        >
          Open in HubSpot <ExternalLink size={14} strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}

function EditPanel({
  draft,
  selected,
  selectedId,
  onSelect,
  onMove,
  onRemove,
  onAdd,
  onPatch,
  onPatchBranch,
  onSetEntry,
}: {
  draft: WorkflowDefinition;
  selected: WorkflowStep | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
  onAdd: (kind: StepKind) => void;
  onPatch: (patch: Partial<WorkflowStep>) => void;
  onPatchBranch: (
    branchId: string,
    patch: Partial<NonNullable<WorkflowStep["branches"]>[number]>
  ) => void;
  onSetEntry: () => void;
}) {
  const stepIds = draft.steps.map((s) => s.id);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <SectionHeader
          icon={GitBranch}
          iconClassName="text-accent"
          label="Steps (drag order with arrows)"
        />
        <p className="mb-3 text-xs text-text-muted">
          Select a step to edit. Use ↑↓ to reorder. Add or remove steps from the
          toolbar.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" className={btnSecondary} onClick={() => onAdd("email")}>
            <Plus size={14} strokeWidth={1.8} /> Email
          </button>
          <button type="button" className={btnSecondary} onClick={() => onAdd("delay")}>
            <Plus size={14} strokeWidth={1.8} /> Wait
          </button>
          <button type="button" className={btnSecondary} onClick={() => onAdd("branch")}>
            <Plus size={14} strokeWidth={1.8} /> Decision
          </button>
          <button type="button" className={btnSecondary} onClick={() => onAdd("sms")}>
            <Plus size={14} strokeWidth={1.8} /> SMS
          </button>
          <button type="button" className={btnSecondary} onClick={() => onAdd("exit")}>
            <Plus size={14} strokeWidth={1.8} /> End
          </button>
          <button type="button" className={btnSecondary} onClick={() => onAdd("action")}>
            <Plus size={14} strokeWidth={1.8} /> Action
          </button>
        </div>
        <ul className="divide-y divide-surface-border rounded-md ring-1 ring-surface-border">
          {draft.steps.map((step, i) => {
            const active = step.id === selectedId;
            return (
              <li
                key={step.id}
                className={`flex items-center gap-2 px-3 py-2 ${
                  active ? "bg-accent-muted" : "bg-surface-secondary"
                }`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelect(step.id)}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    {step.kind}
                    {step.id === draft.entryStepId ? " · entry" : ""}
                  </span>
                  <span className="block truncate text-sm font-medium text-text-primary">
                    {step.label}
                    {step.emailKey ? (
                      <span className="ml-2 font-mono text-xs text-text-muted">
                        {step.emailKey}
                      </span>
                    ) : null}
                  </span>
                </button>
                <button
                  type="button"
                  className={btnSecondary + " !h-8 !px-2"}
                  disabled={i === 0}
                  onClick={() => onMove(step.id, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp size={14} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  className={btnSecondary + " !h-8 !px-2"}
                  disabled={i === draft.steps.length - 1}
                  onClick={() => onMove(step.id, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown size={14} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  className={btnDanger + " !h-8 !px-2"}
                  disabled={step.id === draft.entryStepId}
                  onClick={() => onRemove(step.id)}
                  aria-label="Remove"
                >
                  <Trash2 size={14} strokeWidth={1.8} />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <SectionHeader
          icon={Pencil}
          iconClassName="text-accent"
          label="Selected step"
        />
        {!selected ? (
          <p className="text-sm text-text-muted">
            Click a step in the list or on the diagram to edit it.
          </p>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-muted">
              Label
              <input
                className={`${inputClass} mt-1`}
                value={selected.label}
                onChange={(e) => onPatch({ label: e.target.value })}
              />
            </label>
            {(selected.kind === "email" || selected.kind === "sms") && (
              <>
                <label className="block text-xs font-medium text-text-muted">
                  CRM key
                  <input
                    className={`${inputClass} mt-1 font-mono`}
                    value={selected.emailKey ?? ""}
                    onChange={(e) => onPatch({ emailKey: e.target.value })}
                  />
                </label>
                <label className="block text-xs font-medium text-text-muted">
                  Subject
                  <input
                    className={`${inputClass} mt-1`}
                    value={selected.subject ?? ""}
                    onChange={(e) => onPatch({ subject: e.target.value })}
                  />
                </label>
              </>
            )}
            {selected.kind === "start" && (
              <>
                <label className="block text-xs font-medium text-text-muted">
                  Trigger type
                  <select
                    className={`${inputClass} mt-1`}
                    value={selected.triggerKind ?? "event"}
                    onChange={(e) =>
                      onPatch({
                        triggerKind: e.target.value as WorkflowStep["triggerKind"],
                      })
                    }
                  >
                    <option value="event">Event</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>
                <label className="block text-xs font-medium text-text-muted">
                  Trigger detail
                  <input
                    className={`${inputClass} mt-1`}
                    value={selected.triggerDetail ?? ""}
                    onChange={(e) =>
                      onPatch({ triggerDetail: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            {selected.kind === "delay" && (
              <label className="block text-xs font-medium text-text-muted">
                Wait note
                <input
                  className={`${inputClass} mt-1`}
                  value={selected.note ?? ""}
                  onChange={(e) => onPatch({ note: e.target.value })}
                />
              </label>
            )}
            {selected.kind !== "branch" && selected.kind !== "exit" && (
              <label className="block text-xs font-medium text-text-muted">
                Next step
                <select
                  className={`${inputClass} mt-1`}
                  value={selected.next ?? ""}
                  onChange={(e) =>
                    onPatch({
                      next: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">(none)</option>
                  {stepIds
                    .filter((id) => id !== selected.id)
                    .map((id) => {
                      const s = draft.steps.find((x) => x.id === id)!;
                      return (
                        <option key={id} value={id}>
                          {s.label} ({s.kind})
                        </option>
                      );
                    })}
                </select>
              </label>
            )}
            {selected.kind === "exit" && (
              <label className="block text-xs font-medium text-text-muted">
                Exit tone
                <select
                  className={`${inputClass} mt-1`}
                  value={selected.exitTone ?? "neutral"}
                  onChange={(e) =>
                    onPatch({
                      exitTone: e.target.value as WorkflowStep["exitTone"],
                    })
                  }
                >
                  <option value="success">Success</option>
                  <option value="danger">Danger</option>
                  <option value="neutral">Neutral</option>
                </select>
              </label>
            )}
            {selected.kind === "branch" && selected.branches && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-text-muted">Branches</p>
                {selected.branches.map((b) => (
                  <div
                    key={b.id}
                    className="space-y-2 rounded-md bg-surface-elevated p-3 ring-1 ring-surface-border"
                  >
                    <input
                      className={inputClass}
                      value={b.label}
                      onChange={(e) =>
                        onPatchBranch(b.id, { label: e.target.value })
                      }
                      placeholder="Branch label"
                    />
                    <select
                      className={inputClass}
                      value={b.next}
                      onChange={(e) =>
                        onPatchBranch(b.id, { next: e.target.value })
                      }
                    >
                      {stepIds
                        .filter((id) => id !== selected.id)
                        .map((id) => {
                          const s = draft.steps.find((x) => x.id === id)!;
                          return (
                            <option key={id} value={id}>
                              → {s.label}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                ))}
              </div>
            )}
            <label className="block text-xs font-medium text-text-muted">
              Note
              <input
                className={`${inputClass} mt-1`}
                value={selected.note ?? ""}
                onChange={(e) => onPatch({ note: e.target.value })}
              />
            </label>
            {selected.id !== draft.entryStepId ? (
              <button type="button" className={btnSecondary} onClick={onSetEntry}>
                Set as entry trigger
              </button>
            ) : (
              <p className="text-xs text-text-muted">This is the entry trigger.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function DefinedWorkflowBody({ def }: { def: WorkflowDefinition }) {
  return (
    <>
      <GroupLabel>Logic</GroupLabel>
      <div className="grid gap-4 sm:grid-cols-2">
        <LogicCard
          icon={Users}
          label="Enrollment rules"
          summary={def.enrollment.summary}
          details={def.enrollment.details}
        />
        <LogicCard
          icon={Clock3}
          label="Start / stop & timing"
          summary={def.start.summary}
          details={[
            ...def.start.triggers.map((t) => `Start: ${t}`),
            def.stop.summary,
            ...def.stop.details,
            ...(def.sourceJobs?.length
              ? [`Jobs today: ${def.sourceJobs.join(", ")}`]
              : []),
          ]}
        />
        <LogicCard
          icon={ShieldOff}
          label="Suppression logic"
          summary={def.suppression.summary}
          details={[
            ...(def.suppression.priority != null
              ? [
                  `Conflict priority rank: ${def.suppression.priority} (decline > invoice > expiry)`,
                ]
              : []),
            ...def.suppression.details,
          ]}
        />
        <Card>
          <SectionHeader
            icon={History}
            iconClassName="text-accent"
            label="Enrollment history"
          />
          <p className="text-sm leading-relaxed text-text-secondary">
            History attaches once HubSpot / CRM send logs are wired. Tracking
            key:{" "}
            <code className="rounded bg-surface-elevated px-1 text-xs">
              {def.sequenceKey}
            </code>
            .
          </p>
        </Card>
      </div>

      <GroupLabel>Emails in this workflow</GroupLabel>
      <div className="space-y-3">
        {def.emails.map((email) => (
          <Card key={email.key}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/emails/${email.key}`}
                  className="flex flex-wrap items-center gap-2 hover:text-accent"
                >
                  <Mail size={14} strokeWidth={1.8} className="text-accent" />
                  <p className="text-sm font-semibold text-text-primary hover:underline">
                    {email.name}
                  </p>
                </Link>
                <p className="mt-1 text-xs text-text-muted">
                  <code className="rounded bg-surface-elevated px-1">
                    {email.key}
                  </code>
                  {email.step != null ? ` · step ${email.step}` : null}
                </p>
              </div>
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
            </div>
            <p className="mt-2 text-sm text-text-secondary">{email.purpose}</p>
            <p className="mt-1 text-xs text-text-muted">
              Subject: {email.subject}
            </p>
            <Link
              href={`/emails/${email.key}`}
              className="mt-3 inline-flex text-xs font-medium text-accent hover:underline"
            >
              Open email detail →
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}

function LogicCard({
  icon: Icon,
  label,
  summary,
  details,
}: {
  icon: typeof Users;
  label: string;
  summary: string;
  details: string[];
}) {
  return (
    <Card>
      <SectionHeader icon={Icon} iconClassName="text-accent" label={label} />
      <p className="text-sm leading-relaxed text-text-secondary">{summary}</p>
      <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs text-text-muted">
        {details.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </Card>
  );
}
