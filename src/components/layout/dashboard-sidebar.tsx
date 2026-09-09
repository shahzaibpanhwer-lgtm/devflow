import Link from "next/link";

import { Logo } from "@/components/devflow/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Separator } from "@/components/ui/separator";

/**
 * Persistent desktop sidebar. Rendered on the server — only the nav list
 * itself is a client component, because it needs the active pathname.
 */
export function DashboardSidebar() {
  return (
    <aside className="bg-sidebar border-sidebar-border hidden w-60 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-14 shrink-0 items-center px-6">
        <Link
          href="/dashboard"
          className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-6 py-2" aria-label="Main">
        <SidebarNav section="primary" indicatorId="sidebar-indicator" />
        <Separator className="bg-sidebar-border my-4" />
        <SidebarNav section="secondary" indicatorId="sidebar-indicator-secondary" />
      </nav>

      <div className="border-sidebar-border shrink-0 border-t px-6 py-3">
        <p className="text-text-tertiary font-mono text-[11px]">DevFlow v0.1.0</p>
      </div>
    </aside>
  );
}
