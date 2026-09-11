"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DOC_SECTIONS } from "@/lib/docs";
import { cn } from "@/lib/utils";

export function DocsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation sections">
      <ul className="space-y-0.5">
        {DOC_SECTIONS.map((section) => {
          const href = `/dashboard/docs/${section.slug}` as Route;
          const active =
            pathname === href ||
            (pathname === "/dashboard/docs" && section.slug === "introduction");

          return (
            <li key={section.slug}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-foreground font-medium"
                    : "text-text-secondary hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                {section.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
