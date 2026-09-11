/**
 * Analytics time ranges.
 *
 * Deliberately free of database imports: the range selector and the charts are
 * client components, and importing these constants from the query module would
 * pull Prisma — and the Postgres driver's Node built-ins — into the browser
 * bundle, which fails the build outright.
 */

export const ANALYTICS_RANGES = ["24H", "7D", "30D", "90D"] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export type RangeConfig = {
  label: string;
  /** Postgres date_trunc unit for the buckets. */
  unit: "hour" | "day";
  /** Number of buckets the window contains. */
  buckets: number;
};

export const RANGE_CONFIG: Record<AnalyticsRange, RangeConfig> = {
  "24H": { label: "Last 24 hours", unit: "hour", buckets: 24 },
  "7D": { label: "Last 7 days", unit: "day", buckets: 7 },
  "30D": { label: "Last 30 days", unit: "day", buckets: 30 },
  "90D": { label: "Last 90 days", unit: "day", buckets: 90 },
};

/** Falls back to the default window rather than erroring on a bad ?range=. */
export function parseRange(value: unknown): AnalyticsRange {
  return ANALYTICS_RANGES.includes(value as AnalyticsRange) ? (value as AnalyticsRange) : "30D";
}

/** Shapes shared by the query layer and the charts that render them. */
export type TrafficPoint = { bucket: string; requests: number; errors: number };
export type LatencyPoint = { bucket: string; median: number; p95: number };
export type StatusSlice = { klass: "2xx" | "4xx" | "5xx"; label: string; count: number };
export type EndpointRow = {
  endpoint: string;
  method: string;
  path: string;
  requests: number;
  avgDuration: number;
  errorRate: number;
};
