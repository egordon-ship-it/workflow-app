"use client";

import { useId, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { WorkflowDefinition } from "@/lib/workflows/types";
import {
  buildWorkflowGraph,
  type GraphEdge,
  type GraphNode,
} from "@/lib/workflows/graph";

const NODE_W = 220;
const NODE_H = 72;
const RANK_GAP = 100;
const NODE_GAP = 56;
const PAD_X = 64;
const PAD_Y = 44;
const LANE_GUTTER = 96;

/** Opaque, high-contrast fills — readable in dark mode (app default). */
function nodeStyle(kind: GraphNode["kind"], exitTone?: GraphNode["exitTone"]) {
  switch (kind) {
    case "start":
      return {
        bg: "#3a3a3e",
        border: "#8e8e93",
        title: "#f5f5f7",
        meta: "#c7c7cc",
        key: "#aeaeb2",
      };
    case "email":
    case "sms":
      return {
        bg: "#0a3d52",
        border: "#00aeef",
        title: "#ffffff",
        meta: "#7dd3fc",
        key: "#bae6fd",
      };
    case "delay":
      return {
        bg: "#4a3208",
        border: "#f59e0b",
        title: "#ffffff",
        meta: "#fcd34d",
        key: "#fde68a",
      };
    case "branch":
      return {
        bg: "#2c2c30",
        border: "#d1d1d6",
        title: "#ffffff",
        meta: "#e5e5ea",
        key: "#aeaeb2",
      };
    case "action":
      return {
        bg: "#343438",
        border: "#a1a1a6",
        title: "#ffffff",
        meta: "#d1d1d6",
        key: "#aeaeb2",
      };
    case "exit":
      if (exitTone === "success")
        return {
          bg: "#064e3b",
          border: "#34d399",
          title: "#ffffff",
          meta: "#6ee7b7",
          key: "#a7f3d0",
        };
      if (exitTone === "danger")
        return {
          bg: "#4c0519",
          border: "#fb7185",
          title: "#ffffff",
          meta: "#fda4af",
          key: "#fecdd3",
        };
      return {
        bg: "#3a3a3e",
        border: "#8e8e93",
        title: "#ffffff",
        meta: "#d1d1d6",
        key: "#aeaeb2",
      };
    default:
      return {
        bg: "#2c2c30",
        border: "#8e8e93",
        title: "#ffffff",
        meta: "#d1d1d6",
        key: "#aeaeb2",
      };
  }
}

function edgeStroke(tone?: "success" | "danger" | "neutral") {
  if (tone === "success") return "#34d399";
  if (tone === "danger") return "#fb7185";
  return "#c7c7cc";
}

function edgeLabelFill(tone?: "success" | "danger" | "neutral") {
  if (tone === "success") return "#6ee7b7";
  if (tone === "danger") return "#fda4af";
  return "#e5e5ea";
}

function kindLabel(kind: GraphNode["kind"], n?: GraphNode) {
  switch (kind) {
    case "start":
      if (n?.triggerKind === "event") return "TRIGGER · EVENT";
      if (n?.triggerKind === "scheduled") return "TRIGGER · SCHEDULED";
      if (n?.triggerKind === "manual") return "TRIGGER · MANUAL";
      return "TRIGGER";
    case "email":
      return "EMAIL";
    case "sms":
      return "SMS";
    case "delay":
      return "WAIT";
    case "branch":
      return "IF";
    case "action":
      return "ACTION";
    case "exit":
      return "END";
  }
}

function layoutPositions(nodes: GraphNode[]) {
  const ranks = new Map<number, GraphNode[]>();
  for (const n of nodes) {
    const list = ranks.get(n.rank) ?? [];
    list.push(n);
    ranks.set(n.rank, list);
  }

  const maxRank = Math.max(...ranks.keys(), 0);
  let contentWidth = 0;
  const pos = new Map<
    string,
    { x: number; y: number; cx: number; cy: number; rank: number }
  >();

  for (let r = 0; r <= maxRank; r++) {
    const row = (ranks.get(r) ?? []).sort((a, b) => a.order - b.order);
    const rowWidth =
      row.length * NODE_W + Math.max(0, row.length - 1) * NODE_GAP;
    contentWidth = Math.max(contentWidth, rowWidth);
  }

  for (let r = 0; r <= maxRank; r++) {
    const row = (ranks.get(r) ?? []).sort((a, b) => a.order - b.order);
    const rowWidth =
      row.length * NODE_W + Math.max(0, row.length - 1) * NODE_GAP;
    const startX = PAD_X + LANE_GUTTER + (contentWidth - rowWidth) / 2;
    const y = PAD_Y + r * (NODE_H + RANK_GAP);
    row.forEach((n, i) => {
      const x = startX + i * (NODE_W + NODE_GAP);
      pos.set(n.id, {
        x,
        y,
        cx: x + NODE_W / 2,
        cy: y + NODE_H / 2,
        rank: n.rank,
      });
    });
  }

  const height = PAD_Y * 2 + (maxRank + 1) * NODE_H + maxRank * RANK_GAP;
  const width = PAD_X * 2 + LANE_GUTTER * 2 + contentWidth;

  return {
    pos,
    width,
    height,
    leftLaneX: PAD_X / 2 + 12,
    rightLaneX: width - PAD_X / 2 - 12,
  };
}

type Pos = { x: number; y: number; cx: number; cy: number; rank: number };

/**
 * Orthogonal routes that never cut through mid-rank nodes.
 * Edge labels sit ON their own stroke (opaque chip covers the line).
 */
function routeEdge(
  e: GraphEdge,
  from: Pos,
  to: Pos,
  _fromNode: GraphNode,
  leftLaneX: number,
  rightLaneX: number
): { d: string; labelX: number; labelY: number } {
  const x1 = from.cx;
  const y1 = from.y + NODE_H;
  const x2 = to.cx;
  const y2 = to.y;
  const rankDelta = to.rank - from.rank;
  const skips = rankDelta > 1;

  // Same column, adjacent rank — straight drop. Sit the chip well below the
  // typical sibling elbow (mid-gap) so it rides the colored vertical, not the fork.
  if (!skips && Math.abs(x1 - x2) < 4) {
    return {
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      labelX: x1,
      labelY: y1 + (y2 - y1) * 0.68,
    };
  }

  // Adjacent rank, different columns — elbow in the gap between ranks only.
  // Place the chip on THIS edge's longest distinctive segment (never the short
  // shared stub under a branch diamond). Sideways = horizontal; mostly down =
  // final vertical into the target (e.g. "Yes — notify" on the green drop).
  if (!skips) {
    const midY = y1 + (RANK_GAP - 28) * 0.5;
    const stubV = midY - y1;
    const horiz = Math.abs(x2 - x1);
    const approachV = y2 - midY;
    const d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;

    if (horiz > approachV && horiz > stubV) {
      // Mid-horizontal, nudged past the fork so the chip rides this edge alone
      return {
        d,
        labelX: x1 + (x2 - x1) * 0.55,
        labelY: midY,
      };
    }
    if (approachV >= stubV) {
      return {
        d,
        labelX: x2,
        labelY: midY + approachV * 0.55,
      };
    }
    return {
      d,
      labelX: x1,
      labelY: y1 + stubV * 0.55,
    };
  }

  // Long-range: full travel on the side gutter (never through node columns)
  const useLeft = e.tone === "success" || (e.tone !== "danger" && x2 <= x1);
  const laneX = useLeft ? leftLaneX : rightLaneX;
  const dropY = y1 + 20;
  const approachY = y2 - 20;
  const topHoriz = Math.abs(laneX - x1);
  const gutterV = Math.abs(approachY - dropY);
  const bottomHoriz = Math.abs(x2 - laneX);

  // Prefer the gutter vertical; fall back to the longer horizontal jog
  let labelX = laneX;
  let labelY = dropY + gutterV * 0.35;
  if (gutterV < 40 && topHoriz >= bottomHoriz && topHoriz > gutterV) {
    labelX = (x1 + laneX) / 2;
    labelY = dropY;
  } else if (gutterV < 40 && bottomHoriz > gutterV) {
    labelX = (laneX + x2) / 2;
    labelY = approachY;
  }

  return {
    d: `M ${x1} ${y1} L ${x1} ${dropY} L ${laneX} ${dropY} L ${laneX} ${approachY} L ${x2} ${approachY} L ${x2} ${y2}`,
    labelX,
    labelY,
  };
}

export default function WorkflowDiagram({
  definition,
  editing = false,
  selectedId = null,
  onSelect,
}: {
  definition: WorkflowDefinition;
  editing?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const router = useRouter();
  const graph = useMemo(() => buildWorkflowGraph(definition), [definition]);
  const { pos, width, height, leftLaneX, rightLaneX } = useMemo(
    () => layoutPositions(graph.nodes),
    [graph.nodes]
  );

  const nodeById = useMemo(() => {
    const m = new Map<string, GraphNode>();
    for (const n of graph.nodes) m.set(n.id, n);
    return m;
  }, [graph.nodes]);

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-surface-border bg-[#1c1c1e]">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
          Visual workflow{editing ? " · edit mode" : ""}
        </p>
        <LegendDot color="#8e8e93" label="Trigger" />
        <LegendDot color="#00aeef" label="Email / SMS (clickable)" />
        <LegendDot color="#f59e0b" label="Wait" />
        <LegendDot color="#34d399" label="Success exit" />
        <LegendDot color="#fb7185" label="Escalate / stop" />
      </div>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${definition.name} workflow diagram`}
        className="block min-w-full"
      >
        <defs>
          <marker
            id={`${uid}-arrow`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#c7c7cc" />
          </marker>
          <marker
            id={`${uid}-arrow-success`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
          </marker>
          <marker
            id={`${uid}-arrow-danger`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#fb7185" />
          </marker>
        </defs>

        {/* Paths first so strokes never paint over labels */}
        {graph.edges.map((e) => {
          const from = pos.get(e.from);
          const to = pos.get(e.to);
          const fromNode = nodeById.get(e.from);
          if (!from || !to || !fromNode) return null;

          const { d } = routeEdge(
            e,
            from,
            to,
            fromNode,
            leftLaneX,
            rightLaneX
          );
          const stroke = edgeStroke(e.tone);
          const marker =
            e.tone === "success"
              ? `url(#${uid}-arrow-success)`
              : e.tone === "danger"
                ? `url(#${uid}-arrow-danger)`
                : `url(#${uid}-arrow)`;

          return (
            <path
              key={`path-${e.id}`}
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth={2}
              markerEnd={marker}
              strokeLinejoin="round"
              pointerEvents="none"
            />
          );
        })}

        {/* Labels drawn after every path */}
        {graph.edges.map((e) => {
          const from = pos.get(e.from);
          const to = pos.get(e.to);
          const fromNode = nodeById.get(e.from);
          if (!from || !to || !fromNode || !e.label) return null;

          const { labelX, labelY } = routeEdge(
            e,
            from,
            to,
            fromNode,
            leftLaneX,
            rightLaneX
          );
          const stroke = edgeStroke(e.tone);
          const label =
            e.label.length > 18 ? `${e.label.slice(0, 16)}…` : e.label;
          const chipW = label.length * 6.6 + 20;
          const chipH = 20;

          return (
            <g key={`label-${e.id}`} pointerEvents="none">
              <rect
                x={labelX - chipW / 2}
                y={labelY - chipH / 2}
                width={chipW}
                height={chipH}
                rx={4}
                fill="#1c1c1e"
                stroke={stroke}
                strokeWidth={1.5}
              />
              <text
                x={labelX}
                y={labelY + 4}
                textAnchor="middle"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fill: edgeLabelFill(e.tone),
                }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {graph.nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          const colors = nodeStyle(n.kind, n.exitTone);
          const isBranch = n.kind === "branch";
          const lines = nodeLines(n, isBranch);
          const isSelected = selectedId === n.id;
          const isLink =
            !editing &&
            (n.kind === "email" || n.kind === "sms") &&
            !!n.emailKey;
          const href = isLink ? `/emails/${encodeURIComponent(n.emailKey!)}` : undefined;

          const activate = () => {
            if (editing && onSelect) {
              onSelect(n.id);
              return;
            }
            if (href) router.push(href);
          };

          return (
            <g
              key={n.id}
              transform={`translate(${p.x}, ${p.y})`}
              style={{ cursor: isLink || editing ? "pointer" : "default" }}
              onClick={isLink || editing ? activate : undefined}
              role={isLink ? "link" : undefined}
              tabIndex={isLink || editing ? 0 : undefined}
              onKeyDown={
                isLink || editing
                  ? (ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        activate();
                      }
                    }
                  : undefined
              }
            >
              {isLink ? (
                <title>
                  Open email {n.emailKey}
                  {n.subject ? ` — ${n.subject}` : ""}
                </title>
              ) : null}

              {isBranch ? (
                <polygon
                  points={`${NODE_W / 2},3 ${NODE_W - 4},${NODE_H / 2} ${NODE_W / 2},${NODE_H - 3} 4,${NODE_H / 2}`}
                  fill={colors.bg}
                  stroke={isSelected ? "#ffffff" : colors.border}
                  strokeWidth={isSelected ? 3 : 2}
                />
              ) : (
                <rect
                  x={0}
                  y={0}
                  width={NODE_W}
                  height={NODE_H}
                  rx={n.kind === "exit" || n.kind === "start" ? 22 : 10}
                  fill={colors.bg}
                  stroke={
                    isSelected ? "#ffffff" : isLink ? "#38bdf8" : colors.border
                  }
                  strokeWidth={isSelected || isLink ? 2.5 : 2}
                />
              )}

              <text
                x={NODE_W / 2}
                y={lines.metaY}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: n.kind === "start" ? 9 : 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  fill: colors.meta,
                  pointerEvents: "none",
                }}
              >
                {kindLabel(n.kind, n)}
              </text>
              <text
                x={NODE_W / 2}
                y={lines.titleY}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fill: colors.title,
                  textDecoration: isLink ? "underline" : undefined,
                  textDecorationColor: "#7dd3fc",
                  pointerEvents: "none",
                }}
              >
                {lines.title}
              </text>
              {lines.key ? (
                <text
                  x={NODE_W / 2}
                  y={lines.keyY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: 11,
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontWeight: 600,
                    fill: colors.key,
                    pointerEvents: "none",
                  }}
                >
                  {lines.key}
                </text>
              ) : null}

              {/* Full-node hit target so clicks always register */}
              <rect
                x={0}
                y={0}
                width={NODE_W}
                height={NODE_H}
                fill="transparent"
                style={{
                  cursor: isLink || editing ? "pointer" : "default",
                  pointerEvents: isLink || editing ? "all" : "none",
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function nodeLines(n: GraphNode, isBranch: boolean) {
  if (isBranch) {
    return {
      metaY: NODE_H / 2 - 10,
      titleY: NODE_H / 2 + 10,
      keyY: 0,
      title: truncate(n.label, 16),
      key: null as string | null,
    };
  }
  if (n.kind === "start") {
    return {
      metaY: 16,
      titleY: 36,
      keyY: 56,
      title: truncate(n.label, 26),
      key: n.triggerDetail ? truncate(n.triggerDetail, 28) : null,
    };
  }
  if (n.kind === "delay") {
    return {
      metaY: 16,
      titleY: 36,
      keyY: 56,
      title: truncate(n.label, 26),
      key: n.note ? truncate(n.note, 28) : null,
    };
  }
  return {
    metaY: 16,
    titleY: n.emailKey ? 36 : 42,
    keyY: 56,
    title: truncate(n.label, 28),
    key: n.emailKey ?? null,
  };
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-white/75">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
