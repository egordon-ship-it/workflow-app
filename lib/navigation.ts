import {
  Building2,
  Coffee,
  GitBranch,
  Headphones,
  LayoutGrid,
  Mails,
  Receipt,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  getWorkflowsByDepartment,
  type ProcessType,
} from "@/lib/workflows";

/**
 * Navigation catalog for Email Workflows.
 * Departments map to audience / VIP programs from the email catalog.
 */

export type { ProcessType };

export interface WorkflowNavItem {
  id: string;
  name: string;
  processType: ProcessType;
  sequenceKey?: string;
  summary?: string;
}

export interface Department {
  slug: string;
  name: string;
  icon: LucideIcon;
  description: string;
  workflows: WorkflowNavItem[];
}

function navFromDepartment(slug: string): WorkflowNavItem[] {
  return getWorkflowsByDepartment(slug).map((w) => ({
    id: w.id,
    name: w.name,
    processType: w.processType,
    sequenceKey: w.sequenceKey,
    summary: w.summary,
  }));
}

export const DEPARTMENTS: Department[] = [
  {
    slug: "billing",
    name: "Billing",
    icon: Receipt,
    description:
      "Card decline recovery, card expiration, invoice collection, ACH rejection, payment confirmation, and refunds.",
    workflows: navFromDepartment("billing"),
  },
  {
    slug: "customers",
    name: "Customers",
    icon: Users,
    description:
      "Portal access, sales close, fulfillment, SXM/SYB product journeys, and support — general customer-facing paths.",
    workflows: navFromDepartment("customers"),
  },
  {
    slug: "tim-hortons",
    name: "Tim Hortons",
    icon: Coffee,
    description:
      "VIP Tim Hortons store fulfillment and portal access, including internal New & Reno companions.",
    workflows: navFromDepartment("tim-hortons"),
  },
  {
    slug: "encore",
    name: "Encore / PSAV",
    icon: Building2,
    description:
      "VIP Encore portal activation, subscription & service changes, and feedback — with Encore-internal companions.",
    workflows: navFromDepartment("encore"),
  },
  {
    slug: "technician-dealer",
    name: "Technician / Dealer",
    icon: Wrench,
    description:
      "Dealer partner onboarding and technician service provisioning (activate, trial, swap, deactivate).",
    workflows: navFromDepartment("technician-dealer"),
  },
  {
    slug: "internal",
    name: "Internal",
    icon: Headphones,
    description:
      "Staff-only task ops, lead pipeline, and collections network termination.",
    workflows: navFromDepartment("internal"),
  },
];

export const OVERVIEW_LINKS: {
  name: string;
  href: string;
  icon: LucideIcon;
}[] = [
  { name: "Home", href: "/", icon: LayoutGrid },
  { name: "Visual workflows", href: "/diagrams", icon: GitBranch },
  { name: "All Emails", href: "/emails", icon: Mails },
];

export function getDepartment(slug: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.slug === slug);
}

export function getWorkflow(
  id: string
): { department: Department; workflow: WorkflowNavItem } | undefined {
  for (const department of DEPARTMENTS) {
    const workflow = department.workflows.find((w) => w.id === id);
    if (workflow) return { department, workflow };
  }
  return undefined;
}

export function processTypeLabel(type: ProcessType): string {
  switch (type) {
    case "timed":
      return "Timed";
    case "manual":
      return "Manual";
    case "trigger":
      return "Trigger";
  }
}
