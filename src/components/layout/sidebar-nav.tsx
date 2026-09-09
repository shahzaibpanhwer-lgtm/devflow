"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { PRIMARY_NAV, SECONDARY_NAV, isNavItemActive, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const SECTIONS: Record<"primary" | "secondary", readonly NavItem[]> = {
  primary: PRIMARY_NAV,
  secondary: SECONDARY_NAV,
};

type SidebarNavProps = {
  /**
   * The nav config is resolved inside this client component rather than passed
   * down as props: each item carries a Lucide icon *component*, and functions
   * cannot cross the server/client boundary.
   */
  section: "primary" | "secondary";
  /** Shared layoutId group so the active indicator travels between items. */
  indicatorId: string;
  onNavigate?: () => void;
};

export function SidebarNav({ section, indicatorId, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const items = SECTIONS[section];

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        const Icon = item.icon;

        return (
          <li key={item.href} className="relative">
            {active ? (
              prefersReducedMotion ? (
                <span
                  aria-hidden="true"
                  className="bg-brand-500 absolute top-1.5 bottom-1.5 -left-3 w-0.5 rounded-full"
                />
              ) : (
                <motion.span
                  layoutId={indicatorId}
                  aria-hidden="true"
                  className="bg-brand-500 absolute top-1.5 bottom-1.5 -left-3 w-0.5 rounded-full"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )
            ) : null}
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-foreground font-medium"
                  : "text-text-secondary hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon
                className={cn("size-4 shrink-0", active ? "text-brand-500" : "text-current")}
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
