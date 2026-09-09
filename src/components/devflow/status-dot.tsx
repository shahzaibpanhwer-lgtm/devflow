import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/status";

const TONE_BACKGROUND: Record<StatusTone, string> = {
  success: "bg-status-success",
  warning: "bg-status-warning",
  danger: "bg-status-danger",
  info: "bg-status-info",
  neutral: "bg-status-neutral",
};

type StatusDotProps = {
  tone: StatusTone;
  /** Renders a soft halo for work that is still in progress. */
  pulsing?: boolean;
  className?: string;
};

export function StatusDot({ tone, pulsing = false, className }: StatusDotProps) {
  return (
    <span className={cn("relative inline-flex size-2 shrink-0", className)} aria-hidden="true">
      {pulsing ? (
        <span
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-60",
            TONE_BACKGROUND[tone],
          )}
        />
      ) : null}
      <span className={cn("relative size-2 rounded-full", TONE_BACKGROUND[tone])} />
    </span>
  );
}
