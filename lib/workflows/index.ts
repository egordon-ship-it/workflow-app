import type { WorkflowDefinition } from "./types";
import { BILLING_WORKFLOWS } from "./billing";
import { CUSTOMER_WORKFLOWS } from "./customers";
import { DEALER_WORKFLOWS } from "./dealer";
import { ENCORE_WORKFLOWS } from "./encore";
import { INTERNAL_WORKFLOWS } from "./internal";
import { TIM_HORTONS_WORKFLOWS } from "./timhortons";

/** All fully-specified workflows currently in the app. */
export const WORKFLOWS: WorkflowDefinition[] = [
  ...BILLING_WORKFLOWS,
  ...CUSTOMER_WORKFLOWS,
  ...TIM_HORTONS_WORKFLOWS,
  ...ENCORE_WORKFLOWS,
  ...DEALER_WORKFLOWS,
  ...INTERNAL_WORKFLOWS,
];

export function getWorkflowDefinition(
  id: string
): WorkflowDefinition | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}

export function getWorkflowsByDepartment(
  departmentSlug: string
): WorkflowDefinition[] {
  return WORKFLOWS.filter((w) => w.departmentSlug === departmentSlug);
}

/** Look up a catalog email by CRM key across all modeled workflows. */
export function getEmailByKey(key: string): {
  email: WorkflowDefinition["emails"][number];
  workflow: WorkflowDefinition;
} | undefined {
  for (const workflow of WORKFLOWS) {
    const email = workflow.emails.find((e) => e.key === key);
    if (email) return { email, workflow };
  }
  return undefined;
}

export function listCatalogEmails() {
  return WORKFLOWS.flatMap((workflow) =>
    workflow.emails.map((email) => ({ email, workflow }))
  );
}

export {
  loadWorkflowOverride,
  saveWorkflowOverride,
  clearWorkflowOverride,
  cloneWorkflow,
} from "./storage";

export { BILLING_WORKFLOWS, BILLING_PROGRAM } from "./billing";
export { CUSTOMER_WORKFLOWS } from "./customers";
export { DEALER_WORKFLOWS } from "./dealer";
export { ENCORE_WORKFLOWS } from "./encore";
export { INTERNAL_WORKFLOWS } from "./internal";
export { TIM_HORTONS_WORKFLOWS } from "./timhortons";
export { buildWorkflowGraph } from "./graph";
export type { GraphNode, GraphEdge, WorkflowGraph } from "./graph";
export type {
  ProcessType,
  TriggerKind,
  TimingStatus,
  StepKind,
  ExitTone,
  WorkflowEmail,
  DelaySpec,
  WorkflowBranch,
  WorkflowStep,
  EnrollmentRule,
  StopRule,
  SuppressionRule,
  WorkflowDefinition,
} from "./types";

/**
 * Catalog keys or sequences not yet modeled — keep empty when coverage is
 * complete. Use for future SME-confirmed ladders only.
 */
export const SEQUENCE_BACKLOG: {
  sequenceKey: string;
  suggestedDepartment: string;
  suggestedWorkflowName: string;
  processType: "timed" | "manual" | "trigger";
  steps: string;
  notes: string;
}[] = [];
