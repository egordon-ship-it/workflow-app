import type { WorkflowDefinition } from "./types";

const STORAGE_PREFIX = "dm-workflow-override:";

export function workflowStorageKey(id: string) {
  return `${STORAGE_PREFIX}${id}`;
}

export function loadWorkflowOverride(
  id: string
): WorkflowDefinition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(workflowStorageKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as WorkflowDefinition;
  } catch {
    return null;
  }
}

export function saveWorkflowOverride(def: WorkflowDefinition) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    workflowStorageKey(def.id),
    JSON.stringify(def)
  );
}

export function clearWorkflowOverride(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(workflowStorageKey(id));
}

export function cloneWorkflow(def: WorkflowDefinition): WorkflowDefinition {
  return JSON.parse(JSON.stringify(def)) as WorkflowDefinition;
}
