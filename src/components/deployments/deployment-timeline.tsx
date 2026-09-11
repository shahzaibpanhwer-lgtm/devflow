"use client";

import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { DEPLOYMENT_PIPELINE, DEPLOYMENT_STATUS_META, type DeploymentStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

/** Labels for the pipeline stages; the final stage reads as its outcome. */
const STAGE_LABELS: Record<(typeof DEPLOYMENT_PIPELINE)[number], string> = {
  QUEUED: "Queued",
  BUILDING: "Building",
  TESTING: "Testing",
  DEPLOYING: "Deploying",
  SUCCESS: "Production",
};

type StageState = "complete" | "active" | "failed" | "pending";

/**
 * Resolves each stage against the deployment's current status.
 *
 * A failed deployment marks the stage it died in, leaving earlier stages
 * complete — so the timeline shows *where* it broke rather than just that it
 * broke. The failure point is inferred from the recorded status, since the
 * pipeline stops advancing the moment it fails.
 */
function stageStates(
  status: DeploymentStatus,
  failedAt: DeploymentStatus | null,
): Record<string, StageState> {
  const order = DEPLOYMENT_PIPELINE as readonly DeploymentStatus[];
  const states: Record<string, StageState> = {};

  if (status === "SUCCESS") {
    for (const stage of order) states[stage] = "complete";
    return states;
  }

  if (status === "FAILED") {
    const failureIndex = failedAt ? order.indexOf(failedAt) : order.indexOf("TESTING");
    order.forEach((stage, index) => {
      states[stage] =
        index < failureIndex ? "complete" : index === failureIndex ? "failed" : "pending";
    });
    return states;
  }

  const currentIndex = order.indexOf(status);
  order.forEach((stage, index) => {
    states[stage] =
      index < currentIndex ? "complete" : index === currentIndex ? "active" : "pending";
  });
  return states;
}

export function DeploymentTimeline({
  status,
  failedAt = null,
}: {
  status: DeploymentStatus;
  /** Stage the deployment failed in, when known. */
  failedAt?: DeploymentStatus | null;
}) {
  const prefersReducedMotion = useReducedMotion();
  const states = stageStates(status, failedAt);
  const stages = DEPLOYMENT_PIPELINE;

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
      {stages.map((stage, index) => {
        const state = states[stage] ?? "pending";
        const isLast = index === stages.length - 1;

        return (
          <li key={stage} className="flex flex-1 gap-3 sm:flex-col sm:gap-2">
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium transition-colors",
                  state === "complete" &&
                    "border-status-success/40 bg-status-success/15 text-status-success",
                  state === "active" && "border-brand-500/50 bg-brand-500/15 text-brand-500",
                  state === "failed" &&
                    "border-status-danger/40 bg-status-danger/15 text-status-danger",
                  state === "pending" && "border-line bg-surface-2 text-text-tertiary",
                )}
                aria-hidden="true"
              >
                {state === "complete" ? (
                  <CheckIcon className="size-3" />
                ) : state === "failed" ? (
                  <XIcon className="size-3" />
                ) : state === "active" ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  index + 1
                )}
              </span>

              {!isLast ? (
                <span
                  className="bg-line relative my-1 h-6 w-px overflow-hidden sm:my-0 sm:ml-2 sm:h-px sm:w-full"
                  aria-hidden="true"
                >
                  {state === "complete" ? (
                    prefersReducedMotion ? (
                      <span className="bg-status-success/50 absolute inset-0" />
                    ) : (
                      <motion.span
                        className="bg-status-success/50 absolute inset-0 origin-top sm:origin-left"
                        initial={{ scaleY: 0, scaleX: 0 }}
                        animate={{ scaleY: 1, scaleX: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    )
                  ) : null}
                </span>
              ) : null}
            </div>

            <div className="pb-4 sm:pb-0">
              <p
                className={cn(
                  "text-xs font-medium",
                  state === "pending" ? "text-text-tertiary" : "text-foreground",
                )}
              >
                {STAGE_LABELS[stage]}
              </p>
              <p className="text-text-tertiary text-[11px]">
                {state === "complete"
                  ? "Done"
                  : state === "active"
                    ? DEPLOYMENT_STATUS_META[status].label
                    : state === "failed"
                      ? "Failed"
                      : "Waiting"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
