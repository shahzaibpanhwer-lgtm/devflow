"use client";

import { useEffect, useRef } from "react";

import type { LogLine } from "@/lib/deployment-runner";
import { cn } from "@/lib/utils";

const LEVEL_CLASS: Record<LogLine["level"], string> = {
  info: "text-text-secondary",
  success: "text-status-success",
  warn: "text-status-warning",
  error: "text-status-danger",
};

function formatClock(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString(undefined, { hour12: false });
}

/**
 * Terminal-style build log.
 *
 * While a deployment is running the view follows the newest line, but only if
 * the reader is already at the bottom — yanking the scroll position out from
 * under someone reading an earlier error is worse than missing a line.
 */
export function DeploymentLogs({
  logs,
  running = false,
  className,
}: {
  logs: LogLine[];
  running?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pinnedToBottom.current) return;
    container.scrollTop = container.scrollHeight;
  }, [logs]);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    pinnedToBottom.current = distanceFromBottom < 24;
  }

  if (logs.length === 0) {
    return (
      <div
        className={cn(
          "border-line bg-surface-0 text-text-tertiary rounded-md border p-4 text-center font-mono text-xs",
          className,
        )}
      >
        {running ? "Waiting for output…" : "No build output was recorded."}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      role="log"
      aria-label="Build output"
      aria-live={running ? "polite" : "off"}
      className={cn(
        "border-line bg-surface-0 max-h-72 overflow-y-auto rounded-md border p-3 font-mono text-xs leading-relaxed",
        className,
      )}
    >
      <ol>
        {logs.map((entry, index) => (
          <li key={`${entry.timestamp}-${index}`} className="flex gap-3">
            <span className="text-text-tertiary shrink-0 tabular-nums select-none">
              {formatClock(entry.timestamp)}
            </span>
            <span className={cn("min-w-0 break-words", LEVEL_CLASS[entry.level])}>
              {entry.message}
            </span>
          </li>
        ))}
      </ol>

      {running ? (
        <p className="text-brand-500 mt-1 flex gap-3">
          <span className="text-text-tertiary shrink-0 select-none">
            {formatClock(new Date().toISOString())}
          </span>
          <span className="animate-pulse">▋</span>
        </p>
      ) : null}
    </div>
  );
}
