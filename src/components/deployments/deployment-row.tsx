"use client";

import { ChevronDownIcon, Loader2Icon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DeploymentLogs } from "@/components/deployments/deployment-logs";
import { DeploymentTimeline } from "@/components/deployments/deployment-timeline";
import { StatusBadge } from "@/components/devflow/status-badge";
import type { ApiResult } from "@/lib/api-response";
import { relativeTime } from "@/lib/time";
import type { LogLine } from "@/lib/deployment-runner";
import type { DeploymentStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

export type DeploymentRowData = {
  id: string;
  version: string;
  status: DeploymentStatus;
  environment: string;
  durationMs: number | null;
  commitSha: string | null;
  commitMessage: string | null;
  branch: string | null;
  createdAt: string;
  project: { id: string; name: string };
};

const RUNNING: readonly DeploymentStatus[] = ["QUEUED", "BUILDING", "TESTING", "DEPLOYING"];

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/**
 * One deployment, expandable to reveal its pipeline and build output.
 *
 * While a deployment is in flight the row polls for its own updates. Polling
 * stops the moment it reaches a terminal state, so a finished list makes no
 * further requests.
 */
export function DeploymentRow({ deployment }: { deployment: DeploymentRowData }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<DeploymentStatus>(deployment.status);
  const [durationMs, setDurationMs] = useState<number | null>(deployment.durationMs);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const running = RUNNING.includes(status);
  const refreshedOnFinish = useRef(false);

  async function fetchDeployment(): Promise<void> {
    try {
      const response = await fetch(`/api/deployments/${deployment.id}`);
      const result = (await response.json()) as ApiResult<{
        deployment: { status: DeploymentStatus; durationMs: number | null; logs: LogLine[] };
      }>;

      if (!result.success) return;

      setStatus(result.data.deployment.status);
      setDurationMs(result.data.deployment.durationMs);
      setLogs(result.data.deployment.logs);
    } catch {
      // A dropped poll is not worth surfacing; the next tick will retry.
    }
  }

  // Poll only while in flight, and only every 1.5s — fast enough to feel live
  // without hammering the server once a list holds many running deployments.
  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      void fetchDeployment();
    }, 1500);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, deployment.id]);

  // Once it finishes, refresh the server-rendered page so the stat tiles and
  // activity feed reflect the outcome too.
  useEffect(() => {
    if (running || refreshedOnFinish.current || status === deployment.status) return;
    refreshedOnFinish.current = true;
    router.refresh();
  }, [running, status, deployment.status, router]);

  async function toggle() {
    const next = !expanded;
    setExpanded(next);

    if (next && logs.length === 0) {
      setLoadingLogs(true);
      await fetchDeployment();
      setLoadingLogs(false);
    }
  }

  return (
    <li className="border-line border-b last:border-b-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <StatusBadge kind="deployment" status={status} />

        <span className="font-mono text-xs font-medium">{deployment.version}</span>

        <Link
          href={`/dashboard/projects/${deployment.project.id}` as Route}
          className="text-text-secondary hover:text-foreground max-w-[10rem] min-w-0 truncate text-xs transition-colors"
        >
          {deployment.project.name}
        </Link>

        <span className="text-text-tertiary hidden min-w-0 flex-1 truncate text-xs sm:block">
          {deployment.commitMessage ?? ""}
        </span>

        <span className="text-text-tertiary hidden shrink-0 font-mono text-[11px] md:inline">
          {deployment.branch ?? "main"}
        </span>

        <span className="text-text-tertiary ml-auto shrink-0 font-mono text-[11px] tabular-nums sm:ml-0">
          {running ? (
            <Loader2Icon className="size-3 animate-spin" aria-label="Running" />
          ) : (
            formatDuration(durationMs)
          )}
        </span>

        <span className="text-text-tertiary hidden shrink-0 text-[11px] lg:inline">
          {relativeTime(new Date(deployment.createdAt))}
        </span>

        <button
          type="button"
          onClick={() => void toggle()}
          aria-expanded={expanded}
          aria-controls={`deployment-${deployment.id}`}
          className="text-text-tertiary hover:text-foreground focus-visible:ring-ring/50 shrink-0 rounded p-1 transition-colors focus-visible:ring-3 focus-visible:outline-none"
        >
          <span className="sr-only">
            {expanded ? "Hide" : "Show"} details for {deployment.version}
          </span>
          <ChevronDownIcon
            className={cn("size-4 transition-transform", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </div>

      {expanded ? (
        <div
          id={`deployment-${deployment.id}`}
          className="bg-surface-0/40 space-y-4 px-4 pt-1 pb-4"
        >
          <DeploymentTimeline status={status} />

          <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-text-tertiary text-[11px]">Environment</dt>
              <dd className="mt-0.5 font-mono">{deployment.environment.toLowerCase()}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-[11px]">Branch</dt>
              <dd className="mt-0.5 truncate font-mono">{deployment.branch ?? "main"}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-[11px]">Commit</dt>
              <dd className="mt-0.5 font-mono">{deployment.commitSha?.slice(0, 7) ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-[11px]">Duration</dt>
              <dd className="mt-0.5 font-mono tabular-nums">{formatDuration(durationMs)}</dd>
            </div>
          </dl>

          {loadingLogs ? (
            <p className="text-text-tertiary font-mono text-xs">Loading build output…</p>
          ) : (
            <DeploymentLogs logs={logs} running={running} />
          )}
        </div>
      ) : null}
    </li>
  );
}
