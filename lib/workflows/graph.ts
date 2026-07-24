import type {
  DelaySpec,
  WorkflowBranch,
  WorkflowDefinition,
  WorkflowStep,
} from "./types";

/**
 * Expand workflow steps into a renderable graph.
 * Delay specs become explicit delay nodes between steps.
 */

export type GraphNodeKind =
  | "start"
  | "email"
  | "sms"
  | "delay"
  | "branch"
  | "action"
  | "exit";

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  emailKey?: string;
  subject?: string;
  note?: string;
  exitTone?: "success" | "danger" | "neutral";
  delay?: DelaySpec;
  triggerKind?: "event" | "scheduled" | "manual";
  triggerDetail?: string;
  /** Layout rank (0 = top) */
  rank: number;
  /** Order within rank */
  order: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  tone?: "success" | "danger" | "neutral";
}

export interface WorkflowGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function delayNodeId(afterStepId: string) {
  return `${afterStepId}__delay`;
}

/**
 * Build a visual graph from workflow steps.
 * Inserts delay nodes when `delayAfter` is set on a step that continues.
 */
export function buildWorkflowGraph(def: WorkflowDefinition): WorkflowGraph {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  function ensureStepNode(step: WorkflowStep): GraphNode {
    const existing = nodes.get(step.id);
    if (existing) return existing;
    const node: GraphNode = {
      id: step.id,
      kind: step.kind,
      label: step.label,
      emailKey: step.emailKey,
      subject: step.subject,
      note: step.note,
      exitTone: step.exitTone,
      triggerKind: step.triggerKind,
      triggerDetail: step.triggerDetail,
      rank: 0,
      order: 0,
    };
    nodes.set(step.id, node);
    return node;
  }

  function ensureDelayNode(after: WorkflowStep): GraphNode {
    const id = delayNodeId(after.id);
    const existing = nodes.get(id);
    if (existing) return existing;
    const d = after.delayAfter!;
    const label =
      d.days != null
        ? `Wait ${d.days} day${d.days === 1 ? "" : "s"}`
        : "Wait (days TBD)";
    const node: GraphNode = {
      id,
      kind: "delay",
      label,
      note: d.note,
      delay: d,
      rank: 0,
      order: 0,
    };
    nodes.set(id, node);
    return node;
  }

  function addEdge(
    from: string,
    to: string,
    label?: string,
    tone?: WorkflowBranch["tone"]
  ) {
    const id = `${from}->${to}${label ? `:${label}` : ""}`;
    if (edges.some((e) => e.id === id)) return;
    edges.push({ id, from, to, label, tone });
  }

  for (const step of def.steps) {
    ensureStepNode(step);
  }

  for (const step of def.steps) {
    if (step.kind === "branch" && step.branches?.length) {
      for (const b of step.branches) {
        addEdge(step.id, b.next, b.label, b.tone);
      }
      continue;
    }

    if (!step.next) continue;

    // Don't double-wrap steps that are already delays
    if (step.delayAfter && step.kind !== "delay") {
      const delay = ensureDelayNode(step);
      addEdge(step.id, delay.id);
      addEdge(delay.id, step.next);
    } else {
      addEdge(step.id, step.next);
    }
  }

  // Longest-path ranking so shared exits sit below every parent
  // (no upward edges; success joins don't cross mid-flow nodes).
  const ranks = new Map<string, number>();
  for (const id of nodes.keys()) ranks.set(id, 0);
  ranks.set(def.entryStepId, 0);

  for (let pass = 0; pass < nodes.size + 2; pass++) {
    let changed = false;
    for (const e of edges) {
      const fr = ranks.get(e.from) ?? 0;
      const tr = ranks.get(e.to) ?? 0;
      if (tr < fr + 1) {
        ranks.set(e.to, fr + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }

  let maxRank = Math.max(0, ...ranks.values());
  for (const id of nodes.keys()) {
    if (!ranks.has(id)) {
      maxRank += 1;
      ranks.set(id, maxRank);
    }
  }

  const byRank = new Map<number, string[]>();
  for (const [id, rank] of ranks) {
    const list = byRank.get(rank) ?? [];
    list.push(id);
    byRank.set(rank, list);
  }

  for (const [, ids] of byRank) {
    ids.sort((a, b) => {
      const na = nodes.get(a)!;
      const nb = nodes.get(b)!;
      const score = (n: GraphNode) => {
        if (n.kind === "exit" && n.exitTone === "success") return 0;
        if (n.kind === "email" || n.kind === "sms") return 1;
        if (n.kind === "delay") return 2;
        if (n.kind === "branch") return 3;
        if (n.kind === "exit" && n.exitTone === "danger") return 5;
        return 4;
      };
      return score(na) - score(nb) || a.localeCompare(b);
    });
    ids.forEach((id, order) => {
      const node = nodes.get(id)!;
      node.rank = ranks.get(id)!;
      node.order = order;
    });
  }

  return {
    nodes: Array.from(nodes.values()).sort(
      (a, b) => a.rank - b.rank || a.order - b.order
    ),
    edges,
  };
}
