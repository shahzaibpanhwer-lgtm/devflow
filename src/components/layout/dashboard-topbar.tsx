"use client";

import { SearchIcon } from "lucide-react";

import { CommandMenu, useCommandMenu } from "@/components/layout/command-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { UserMenu, type SessionUser } from "@/components/layout/user-menu";

type DashboardTopbarProps = {
  user: SessionUser;
};

export function DashboardTopbar({ user }: DashboardTopbarProps) {
  const { open, setOpen } = useCommandMenu();

  return (
    <>
      <header className="border-line bg-surface-0/85 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm sm:px-6">
        <MobileNav />

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border-line bg-surface-1 text-text-tertiary hover:border-line-strong hover:text-text-secondary flex h-8 w-full max-w-xs items-center gap-2 rounded-md border px-2.5 text-sm transition-colors"
        >
          <SearchIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Search…</span>
          <kbd className="border-line bg-surface-2 ml-auto hidden shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <NotificationsMenu />
          <UserMenu user={user} />
        </div>
      </header>

      <CommandMenu open={open} onOpenChange={setOpen} />
    </>
  );
}
