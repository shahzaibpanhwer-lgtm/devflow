"use client";

import type { ReactNode } from "react";

import type { AnalyticsRange } from "@/lib/analytics-range";

/**
 * Formatting and chrome shared by the analytics charts, so axes, tooltips and
 * legends read identically across every visualization on the page.
 */

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(Math.round(value));
}

/**
 * Buckets are UTC instants, so they are formatted as UTC. Reading them as
 * local time would shift every label by the viewer's offset and put the counts
 * against the wrong hour or day.
 */
export function formatBucket(iso: string, range: AnalyticsRange): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return range === "24H"
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function formatBucketLong(iso: string, range: AnalyticsRange): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return range === "24H"
    ? `${date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}, ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`
    : date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
}

/** Shared tooltip shell so every chart's hover layer looks the same. */
export function TooltipShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-line-strong bg-surface-2 rounded-md border px-3 py-2 shadow-lg">
      <p className="text-text-secondary text-xs">{title}</p>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

/**
 * One tooltip row. The swatch carries the series identity; the text stays in
 * ink tokens rather than taking the series colour, so it holds its contrast.
 */
export function TooltipRow({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: string;
}) {
  return (
    <p className="flex items-center gap-2 text-xs">
      {color ? (
        <span
          className="size-2 shrink-0 rounded-[2px]"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ) : null}
      <span className="text-text-secondary">{label}</span>
      <span className="ml-auto font-mono font-medium tabular-nums">{value}</span>
    </p>
  );
}

/** Axis and grid styling, kept recessive so the data stays dominant. */
export const AXIS_TICK = { fill: "var(--text-tertiary)", fontSize: 11 } as const;
export const GRID_PROPS = {
  vertical: false,
  stroke: "var(--line)",
  strokeDasharray: "3 3",
  strokeOpacity: 0.7,
} as const;

/** Roughly six labelled ticks whatever the bucket count, so axes never crowd. */
export function tickInterval(length: number): number {
  return Math.max(0, Math.floor(length / 6) - 1);
}
