import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Call to action that resolves the empty state, e.g. "Create project". */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-line bg-surface-1 flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <div className="border-line bg-surface-2 text-text-secondary mb-4 flex size-10 items-center justify-center rounded-lg border">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-text-secondary mt-1.5 max-w-sm text-sm text-pretty">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
