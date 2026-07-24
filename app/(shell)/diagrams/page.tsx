"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";
import GroupLabel from "@/components/ui/GroupLabel";
import Badge from "@/components/ui/Badge";
import WorkflowDiagram from "@/components/WorkflowDiagram";
import { DEPARTMENTS, processTypeLabel } from "@/lib/navigation";
import { getWorkflowDefinition } from "@/lib/workflows";

/**
 * Full visual catalog — every workflow diagram in the app design
 * (high-contrast nodes, gutters, clickable emails).
 */
export default function DiagramsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Visual workflows
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Logic charts for every catalog workflow. Click an email node to open
          its detail page.
        </p>
      </div>

      {DEPARTMENTS.map((department) => {
        const Icon = department.icon;
        const defs = department.workflows
          .map((w) => getWorkflowDefinition(w.id))
          .filter(Boolean);

        if (!defs.length) return null;

        return (
          <section key={department.slug} className="space-y-4">
            <GroupLabel>{department.name}</GroupLabel>
            {defs.map((def) => {
              if (!def) return null;
              return (
                <Card key={def.id}>
                  <SectionHeader
                    icon={Icon}
                    iconClassName="text-accent"
                    label={def.name}
                    action={
                      <div className="flex items-center gap-2">
                        <Badge tone="info">
                          {processTypeLabel(def.processType)}
                        </Badge>
                        <Link
                          href={`/workflows/${def.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        >
                          Open <ArrowRight size={12} />
                        </Link>
                      </div>
                    }
                  />
                  <p className="mb-4 text-sm text-text-secondary">
                    {def.summary}
                  </p>
                  <WorkflowDiagram definition={def} />
                </Card>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
