"use client";

import { useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { UsagePoint } from "@/lib/dashboard";

/**
 * Daily API request volume.
 *
 * One measure over time, so it is an area chart with a single series — no
 * legend, because the panel heading already names it. Errors are deliberately
 * *not* plotted here: at roughly 2% of traffic they would sit flat against the
 * axis, and giving them a second y-scale to make them visible would be a
 * dual-axis chart. They get their own stat tile instead.
 */

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

function formatDay(iso: string): string {
  // Bucket keys are UTC days, so they are read and formatted as UTC —
  // parsing them as local time would label each point a day early west of
  // Greenwich and a day late east of it.
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Recharts injects these at render time. Declared locally rather than pulled
 * from the library's generic TooltipProps, whose shape changed in v3.
 */
type ChartTooltipProps = {
  active?: boolean;
  payload?: { payload: UsagePoint }[];
  label?: string | number;
};

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="border-line-strong bg-surface-2 rounded-md border px-3 py-2 shadow-lg">
      <p className="text-text-secondary text-xs">{formatDay(String(label))}</p>
      <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
        {point.requests.toLocaleString()}
        <span className="text-text-tertiary ml-1 text-xs font-normal">requests</span>
      </p>
      {point.errors > 0 ? (
        <p className="text-text-tertiary mt-0.5 font-mono text-xs tabular-nums">
          {point.errors.toLocaleString()} failed
        </p>
      ) : null}
    </div>
  );
}

export function ApiUsageChart({ data }: { data: UsagePoint[] }) {
  const prefersReducedMotion = useReducedMotion();

  // Label roughly six ticks regardless of range, so the axis never crowds.
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1);

  const total = data.reduce((sum, point) => sum + point.requests, 0);

  return (
    <div className="w-full">
      {/*
        The SVG carries no accessible text, so the same numbers are exposed as a
        table for screen readers and as the fallback when colour or graphics are
        unavailable.
      */}
      <table className="sr-only">
        <caption>Daily API requests over the last {data.length} days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Requests</th>
            <th scope="col">Failed</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <th scope="row">{formatDay(point.date)}</th>
              <td>{point.requests}</td>
              <td>{point.errors}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{total}</td>
            <td>{data.reduce((sum, point) => sum + point.errors, 0)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="h-56 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="usage-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-brand)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--chart-brand)" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* Recessive grid: horizontal only, so it guides the eye without
              competing with the data. */}
            <CartesianGrid
              vertical={false}
              stroke="var(--line)"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
            />

            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              interval={tickInterval}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
              dy={4}
            />
            <YAxis
              tickFormatter={formatCompact}
              tickLine={false}
              axisLine={false}
              width={52}
              tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
              allowDecimals={false}
            />

            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="requests"
              stroke="var(--chart-brand)"
              strokeWidth={2}
              fill="url(#usage-fill)"
              isAnimationActive={!prefersReducedMotion}
              animationDuration={700}
              activeDot={{
                r: 4,
                fill: "var(--chart-brand)",
                stroke: "var(--surface-1)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
