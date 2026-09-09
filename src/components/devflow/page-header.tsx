import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Primary and secondary actions, right-aligned on wide viewports. */
  actions?: ReactNode;
  /** Optional status badge or metadata rendered beside the title. */
  badge?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, badge, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {badge}
        </div>
        {description ? (
          <p className="text-text-secondary max-w-2xl text-sm text-pretty">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
