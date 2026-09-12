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

import {
  AXIS_TICK,
  GRID_PROPS,
  TooltipRow,
  TooltipShell,
  formatBucket,
  formatBucketLong,
  formatCompact,
  tickInterval,
} from "@/components/analytics/chart-primitives";
import { ChartMount } from "@/components/charts/chart-mount";
import type { AnalyticsRange, TrafficPoint } from "@/lib/analytics-range";

/**
 * Request volume over time.
 *
 * A single measure, so one series and no legend — the panel heading names it.
 * Failed requests are reported in the tooltip rather than plotted: at a few
 * percent of traffic they would sit flat on the axis, and giving them their
 * own scale to lift them off it would make this a dual-axis chart.
 */
/**
 * Declared at module scope rather than inside the chart: a component created
 * during render is a new type on every pass, so React remounts it and loses
 * its state. `range` is passed as a prop, and Recharts clones this element to
 * add the ones it injects.
 */
type TooltipProps = {
  active?: boolean;
  payload?: { payload: TrafficPoint }[];
  label?: string | number;
  range: AnalyticsRange;
};

function ChartTooltip({ active, payload, label, range }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <TooltipShell title={formatBucketLong(String(label), range)}>
      <TooltipRow
        color="var(--chart-brand)"
        label="Requests"
        value={point.requests.toLocaleString()}
      />
      {point.errors > 0 ? (
        <TooltipRow label="Failed" value={point.errors.toLocaleString()} />
      ) : null}
    </TooltipShell>
  );
}

export function TrafficChart({ data, range }: { data: TrafficPoint[]; range: AnalyticsRange }) {
  const prefersReducedMotion = useReducedMotion();
  const total = data.reduce((sum, point) => sum + point.requests, 0);
  const totalErrors = data.reduce((sum, point) => sum + point.errors, 0);

  return (
    <div className="w-full">
      {/*
        The wrapper carries sr-only, not the table. A table auto-sizes to its
        content and ignores the 1px width the utility sets, so putting it on
        the table left the document scrolling sideways on narrow screens even
        though nothing was visible.
      */}
      <div className="sr-only">
        <table>
          <caption>Requests per bucket, {range}</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Requests</th>
              <th scope="col">Failed</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.bucket}>
                <th scope="row">{formatBucketLong(point.bucket, range)}</th>
                <td>{point.requests}</td>
                <td>{point.errors}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td>{total}</td>
              <td>{totalErrors}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <ChartMount height="h-64 w-full">
        <div className="h-full w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-brand)" stopOpacity={0.26} />
                  <stop offset="100%" stopColor="var(--chart-brand)" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid {...GRID_PROPS} />

              <XAxis
                dataKey="bucket"
                tickFormatter={(value: string) => formatBucket(value, range)}
                interval={tickInterval(data.length)}
                tickLine={false}
                axisLine={false}
                tick={AXIS_TICK}
                dy={4}
              />
              <YAxis
                tickFormatter={formatCompact}
                tickLine={false}
                axisLine={false}
                width={48}
                tick={AXIS_TICK}
                allowDecimals={false}
              />

              <Tooltip
                content={<ChartTooltip range={range} />}
                cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
              />

              <Area
                type="monotone"
                dataKey="requests"
                stroke="var(--chart-brand)"
                strokeWidth={2}
                fill="url(#traffic-fill)"
                isAnimationActive={!prefersReducedMotion}
                animationDuration={650}
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
      </ChartMount>
    </div>
  );
}
