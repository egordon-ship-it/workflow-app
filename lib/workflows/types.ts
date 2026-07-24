/**
 * Domain model for Communication Workflows.
 *
 * Specs are the source of truth for journey logic. Each step forms a
 * visual graph: linear `next`, or `branches` at decision points.
 * Day counts marked null still need Billing SME confirmation.
 */

export type ProcessType = "timed" | "manual" | "trigger";

export type TriggerKind = "event" | "scheduled" | "manual";

export type TimingStatus = "confirmed" | "tbd";

export type StepKind =
  | "start"
  | "email"
  | "sms"
  | "delay"
  | "branch"
  | "action"
  | "exit";

export type ExitTone = "success" | "danger" | "neutral";

export interface WorkflowEmail {
  key: string;
  name: string;
  subject: string;
  purpose: string;
  trigger: TriggerKind;
  apps?: string[];
  step?: number;
}

export interface DelaySpec {
  days: number | null;
  status: TimingStatus;
  note?: string;
}

export interface WorkflowBranch {
  id: string;
  /** Short label drawn on the edge */
  label: string;
  condition: string;
  next: string;
  /** Visual hint for yes/no style branches */
  tone?: "success" | "danger" | "neutral";
}

export interface WorkflowStep {
  id: string;
  kind: StepKind;
  label: string;
  /** CRM template key when kind is email or sms */
  emailKey?: string;
  /** Subject line shown under email nodes */
  subject?: string;
  /** Default linear successor when not a branch node */
  next?: string;
  /** Wait after this step before following `next` (rendered as delay node) */
  delayAfter?: DelaySpec;
  branches?: WorkflowBranch[];
  note?: string;
  exitTone?: ExitTone;
  /** For start nodes: how the workflow is entered */
  triggerKind?: TriggerKind;
  /** Short trigger detail shown on the start node (event/job name) */
  triggerDetail?: string;
}

export interface EnrollmentRule {
  summary: string;
  details: string[];
}

export interface StopRule {
  summary: string;
  details: string[];
}

export interface SuppressionRule {
  summary: string;
  priority?: number;
  details: string[];
}

export interface WorkflowDefinition {
  id: string;
  sequenceKey: string;
  name: string;
  businessProcess: string;
  departmentSlug: string;
  processType: ProcessType;
  summary: string;
  sourceJobs?: string[];
  enrollment: EnrollmentRule;
  start: {
    summary: string;
    triggers: string[];
  };
  stop: StopRule;
  suppression: SuppressionRule;
  /** Entry step id for the visual graph */
  entryStepId: string;
  steps: WorkflowStep[];
  emails: WorkflowEmail[];
  openQuestions?: string[];
}
