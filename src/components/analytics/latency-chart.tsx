"use client";

import { useReducedMotion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
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
  tickInterval,
} from "@/components/analytics/chart-primitives";
import { ChartMount } from "@/components/charts/chart-mount";
import type { AnalyticsRange, LatencyPoint } from "@/lib/analytics-range";

/**
 * Response time: median against the 95th percentile.
 *
 * Both series share one scale and one unit, so they belong on one chart. The
 * pair exists because an average hides the slow tail that actually frustrates
 * users — the gap between the two lines is the point of the chart.
 *
 * Two series means a legend is mandatory, so identity never rests on colour
 * alone. The two hues are the first two slots of the validated categorical
 * order.
 */

const SERIES = [
  { key: "median", label: "Median", color: "var(--chart-1)" },
  { key: "p95", label: "95th percentile", color: "var(--chart-2)" },
] as const;

/** Module scope, for the same reason as the traffic chart's tooltip. */
type TooltipProps = {
  active?: boolean;
  payload?: { payload: LatencyPoint }[];
  label?: string | number;
  range: AnalyticsRange;
};

function ChartTooltip({ active, payload, label, range }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <TooltipShell title={formatBucketLong(String(label), range)}>
      <TooltipRow color="var(--chart-1)" label="Median" value={`${point.median} ms`} />
      <TooltipRow color="var(--chart-2)" label="95th percentile" value={`${point.p95} ms`} />
    </TooltipShell>
  );
}

export function LatencyChart({ data, range }: { data: LatencyPoint[]; range: AnalyticsRange }) {
  const prefersReducedMotion = useReducedMotion();

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
          <caption>Median and 95th percentile response time in milliseconds, {range}</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Median (ms)</th>
              <th scope="col">95th percentile (ms)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.bucket}>
                <th scope="row">{formatBucketLong(point.bucket, range)}</th>
                <td>{point.median}</td>
                <td>{point.p95}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* The legend is real markup, not a chart-drawn one, so it is readable
          by assistive technology and keeps its contrast in both themes. */}
      <ul className="mb-2 flex flex-wrap items-center gap-4" aria-hidden="true">
        {SERIES.map((series) => (
          <li key={series.key} className="text-text-secondary flex items-center gap-1.5 text-xs">
            <span
              className="size-2 rounded-[2px]"
              style={{ backgroundColor: series.color }}
              aria-hidden="true"
            />
            {series.label}
          </li>
        ))}
      </ul>

      <ChartMount height="h-56 w-full">
        <div className="h-full w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
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
                tickFormatter={(value: number) => `${value}`}
                tickLine={false}
                axisLine={false}
                width={48}
                tick={AXIS_TICK}
                allowDecimals={false}
                unit=""
              />

              <Tooltip
                content={<ChartTooltip range={range} />}
                cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
              />

              {SERIES.map((series) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={650}
                  activeDot={{ r: 4, stroke: "var(--surface-1)", strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartMount>
    </div>
  );
}
