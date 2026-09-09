import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Signed, pre-formatted change, e.g. "+12.4%". */
  delta?: string;
  /** Whether a positive delta is good news — inverted for error rates. */
  deltaIntent?: "positive" | "negative" | "neutral";
  /** Draws the accent treatment. Reserve for the single most important metric. */
  emphasis?: boolean;
  className?: string;
};

const INTENT_CLASS = {
  positive: "text-status-success",
  negative: "text-status-danger",
  neutral: "text-text-secondary",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaIntent = "neutral",
  emphasis = false,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "border-line bg-surface-1 hover:border-line-strong group relative overflow-hidden rounded-lg border p-4 transition-colors",
        className,
      )}
    >
      {emphasis ? (
        <span
          aria-hidden="true"
          className="bg-brand-500 absolute inset-x-0 top-0 h-px opacity-70"
        />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <p className="text-text-secondary text-xs font-medium tracking-wide uppercase">{label}</p>
        <Icon
          className={cn(
            "size-4 shrink-0 transition-colors",
            emphasis ? "text-brand-500" : "text-text-tertiary group-hover:text-text-secondary",
          )}
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {delta ? (
        <p className={cn("mt-1 text-xs font-medium tabular-nums", INTENT_CLASS[deltaIntent])}>
          {delta}
          <span className="text-text-tertiary font-normal"> vs. previous period</span>
        </p>
      ) : null}
    </div>
  );
}
