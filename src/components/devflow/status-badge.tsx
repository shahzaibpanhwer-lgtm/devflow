import { StatusDot } from "@/components/devflow/status-dot";
import {
  DEPLOYMENT_STATUS_META,
  PROJECT_STATUS_META,
  type DeploymentStatus,
  type ProjectStatus,
  type StatusTone,
} from "@/lib/status";
import { cn } from "@/lib/utils";

const TONE_TEXT: Record<StatusTone, string> = {
  success: "text-status-success",
  warning: "text-status-warning",
  danger: "text-status-danger",
  info: "text-status-info",
  neutral: "text-text-secondary",
};

type StatusBadgeProps =
  | { kind: "project"; status: ProjectStatus; className?: string }
  | { kind: "deployment"; status: DeploymentStatus; className?: string };

export function StatusBadge(props: StatusBadgeProps) {
  const meta =
    props.kind === "project"
      ? PROJECT_STATUS_META[props.status]
      : DEPLOYMENT_STATUS_META[props.status];

  return (
    <span
      className={cn(
        "border-line bg-surface-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE_TEXT[meta.tone],
        props.className,
      )}
    >
      <StatusDot tone={meta.tone} pulsing={meta.pulsing} />
      {meta.label}
    </span>
  );
}
