"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, GitBranch } from "lucide-react";
import {
  DEPARTMENTS,
  OVERVIEW_LINKS,
  type Department,
} from "@/lib/navigation";

/**
 * Sidebar — Dynamic Media shell with department dropdowns.
 *
 * Overview links sit at the top. Each department is a collapsible
 * section listing its workflows. Active routes expand the parent
 * department automatically.
 */

const APP_NAME = "Email Workflows v0.1";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const activeDepartmentSlug = DEPARTMENTS.find(
    (d) =>
      pathname === `/departments/${d.slug}` ||
      d.workflows.some((w) => pathname === `/workflows/${w.id}`)
  )?.slug;

  const [openDepartments, setOpenDepartments] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        DEPARTMENTS.map((d) => [d.slug, d.slug === activeDepartmentSlug])
      )
  );

  useEffect(() => {
    if (!activeDepartmentSlug) return;
    setOpenDepartments((prev) =>
      prev[activeDepartmentSlug]
        ? prev
        : { ...prev, [activeDepartmentSlug]: true }
    );
  }, [activeDepartmentSlug]);

  const toggleDepartment = (slug: string) => {
    setOpenDepartments((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  return (
    <aside className="app-shell-sidebar fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-surface-secondary border-r border-surface-border">
      <div className="flex items-center px-5 py-6 border-b border-surface-border">
        <Image
          src="/DM-logo-white-blue.svg"
          alt="Dynamic Media"
          width={538}
          height={89}
          className="h-8 w-auto hidden dark:block"
          priority
          unoptimized
        />
        <Image
          src="/DM_logo-black-blue.svg"
          alt="Dynamic Media"
          width={612}
          height={172}
          className="h-8 w-auto block dark:hidden"
          priority
          unoptimized
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SectionLabel>Overview</SectionLabel>
        <div className="mt-1 space-y-0.5">
          {OVERVIEW_LINKS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? "sidebar-link-active" : ""}`}
            >
              <item.icon size={18} strokeWidth={1.8} />
              {item.name}
            </Link>
          ))}
        </div>

        <div className="mt-5">
          <SectionLabel>Departments</SectionLabel>
          <div className="mt-1 space-y-0.5">
            {DEPARTMENTS.map((department) => (
              <DepartmentNav
                key={department.slug}
                department={department}
                open={!!openDepartments[department.slug]}
                onToggle={() => toggleDepartment(department.slug)}
                pathname={pathname}
                isActive={isActive}
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-surface-border">
        <p className="text-xs text-text-muted">{APP_NAME}</p>
      </div>
    </aside>
  );
}

function DepartmentNav({
  department,
  open,
  onToggle,
  pathname,
  isActive,
}: {
  department: Department;
  open: boolean;
  onToggle: () => void;
  pathname: string;
  isActive: (href: string) => boolean;
}) {
  const departmentHref = `/departments/${department.slug}`;
  const departmentActive = isActive(departmentHref);
  const Icon = department.icon;

  return (
    <div>
      <div className="flex items-center gap-0.5">
        <Link
          href={departmentHref}
          className={`sidebar-link min-w-0 flex-1 ${departmentActive ? "sidebar-link-active" : ""}`}
        >
          <Icon size={18} strokeWidth={1.8} />
          <span className="truncate">{department.name}</span>
        </Link>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${department.name} workflows`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition hover:bg-accent-muted hover:text-accent"
        >
          <ChevronDown
            size={16}
            strokeWidth={1.8}
            className={`transition-transform duration-150 ${open ? "rotate-0" : "-rotate-90"}`}
          />
        </button>
      </div>

      {open && (
        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-surface-border pl-2">
          {department.workflows.map((workflow) => {
            const href = `/workflows/${workflow.id}`;
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={workflow.id}
                href={href}
                className={`sidebar-link py-1.5 text-xs ${active ? "sidebar-link-active" : ""}`}
              >
                <GitBranch size={14} strokeWidth={1.8} />
                <span className="truncate">{workflow.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      {children}
    </p>
  );
}
