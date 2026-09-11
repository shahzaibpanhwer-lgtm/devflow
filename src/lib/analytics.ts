import { Prisma } from "@prisma/client";

import {
  RANGE_CONFIG,
  type AnalyticsRange,
  type EndpointRow,
  type LatencyPoint,
  type StatusSlice,
  type TrafficPoint,
} from "@/lib/analytics-range";
import { db } from "@/lib/db";

/**
 * Analytics aggregations.
 *
 * Every figure is computed in SQL over the ApiRequest, Deployment and Activity
 * tables. Bucketing happens in Postgres rather than in JavaScript: a ninety-day
 * window already spans thousands of rows, and pulling them over to group them
 * in memory would not survive a real workload.
 */

/**
 * Window boundaries, aligned to the bucket unit.
 *
 * Aligning to whole hours or whole UTC days keeps the first and last buckets
 * full-width; an unaligned window makes the edges look like traffic dips that
 * never happened.
 */
function bounds(range: AnalyticsRange) {
  const config = RANGE_CONFIG[range];
  const now = new Date();

  const end =
    config.unit === "hour"
      ? new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()),
        )
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const start = new Date(end);
  const previousStart = new Date(end);

  if (config.unit === "hour") {
    start.setUTCHours(start.getUTCHours() - (config.buckets - 1));
    previousStart.setUTCHours(previousStart.getUTCHours() - (config.buckets * 2 - 1));
  } else {
    start.setUTCDate(start.getUTCDate() - (config.buckets - 1));
    previousStart.setUTCDate(previousStart.getUTCDate() - (config.buckets * 2 - 1));
  }

  return { start, previousStart, config };
}

/** Restricts every query to projects the user owns or reaches through a team. */
function visibleProjects(userId: string): Prisma.ProjectWhereInput {
  return { OR: [{ ownerId: userId }, { team: { members: { some: { userId } } } }] };
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export type AnalyticsSummary = {
  requests: { value: number; change: number | null };
  responseTime: { value: number; change: number | null };
  errorRate: { value: number; change: number | null };
  deployments: { value: number; change: number | null };
  activeUsers: { value: number; change: number | null };
};

export async function getAnalyticsSummary(
  userId: string,
  range: AnalyticsRange,
): Promise<AnalyticsSummary> {
  const { start, previousStart } = bounds(range);
  const scope = { project: visibleProjects(userId) };

  const currentWindow = { gte: start };
  const previousWindow = { gte: previousStart, lt: start };

  const [
    requests,
    requestsPrev,
    errors,
    errorsPrev,
    latency,
    latencyPrev,
    deployments,
    deploymentsPrev,
    activeUsers,
    activeUsersPrev,
  ] = await Promise.all([
    db.apiRequest.count({ where: { ...scope, createdAt: currentWindow } }),
    db.apiRequest.count({ where: { ...scope, createdAt: previousWindow } }),
    db.apiRequest.count({
      where: { ...scope, createdAt: currentWindow, statusCode: { gte: 400 } },
    }),
    db.apiRequest.count({
      where: { ...scope, createdAt: previousWindow, statusCode: { gte: 400 } },
    }),
    db.apiRequest.aggregate({
      where: { ...scope, createdAt: currentWindow },
      _avg: { durationMs: true },
    }),
    db.apiRequest.aggregate({
      where: { ...scope, createdAt: previousWindow },
      _avg: { durationMs: true },
    }),
    db.deployment.count({ where: { ...scope, createdAt: currentWindow } }),
    db.deployment.count({ where: { ...scope, createdAt: previousWindow } }),
    db.activity.findMany({
      where: { createdAt: currentWindow, project: visibleProjects(userId) },
      distinct: ["userId"],
      select: { userId: true },
    }),
    db.activity.findMany({
      where: { createdAt: previousWindow, project: visibleProjects(userId) },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  const errorRate = requests === 0 ? 0 : (errors / requests) * 100;
  const errorRatePrev = requestsPrev === 0 ? 0 : (errorsPrev / requestsPrev) * 100;

  return {
    requests: { value: requests, change: changePercent(requests, requestsPrev) },
    responseTime: {
      value: Math.round(latency._avg.durationMs ?? 0),
      change: changePercent(
        Math.round(latency._avg.durationMs ?? 0),
        Math.round(latencyPrev._avg.durationMs ?? 0),
      ),
    },
    // Error rate compares in percentage points, not relative percent.
    errorRate: {
      value: errorRate,
      change: requestsPrev === 0 ? null : errorRate - errorRatePrev,
    },
    deployments: { value: deployments, change: changePercent(deployments, deploymentsPrev) },
    activeUsers: {
      value: activeUsers.length,
      change: changePercent(activeUsers.length, activeUsersPrev.length),
    },
  };
}

/** Fills gaps so quiet buckets render as zero instead of collapsing the axis. */
function fillBuckets<T extends { bucket: string }>(
  rows: Map<string, Omit<T, "bucket">>,
  range: AnalyticsRange,
  empty: Omit<T, "bucket">,
): T[] {
  const { start, config } = bounds(range);
  const series: T[] = [];

  for (let index = 0; index < config.buckets; index += 1) {
    const cursor = new Date(start);
    if (config.unit === "hour") {
      cursor.setUTCHours(cursor.getUTCHours() + index);
    } else {
      cursor.setUTCDate(cursor.getUTCDate() + index);
    }

    const key = cursor.toISOString();
    series.push({ bucket: key, ...(rows.get(key) ?? empty) } as T);
  }

  return series;
}

export async function getTrafficSeries(
  userId: string,
  range: AnalyticsRange,
): Promise<TrafficPoint[]> {
  const { start, config } = bounds(range);

  const rows = await db.$queryRaw<{ bucket: Date; requests: bigint; errors: bigint }[]>`
    SELECT
      date_trunc(${config.unit}, r."createdAt") AS bucket,
      COUNT(*) AS requests,
      COUNT(*) FILTER (WHERE r."statusCode" >= 400) AS errors
    FROM api_requests r
    JOIN projects p ON p.id = r."projectId"
    LEFT JOIN team_members tm ON tm."teamId" = p."teamId" AND tm."userId" = ${userId}
    WHERE r."createdAt" >= ${start}
      AND (p."ownerId" = ${userId} OR tm."userId" IS NOT NULL)
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const byBucket = new Map(
    rows.map((row) => [
      row.bucket.toISOString(),
      { requests: Number(row.requests), errors: Number(row.errors) },
    ]),
  );

  return fillBuckets<TrafficPoint>(byBucket, range, { requests: 0, errors: 0 });
}

/**
 * Median and 95th percentile latency per bucket.
 *
 * Percentiles are computed by Postgres rather than averaged in the
 * application: an average hides the slow tail that actually bothers users,
 * which is the entire reason for showing p95 beside the median.
 */
export async function getLatencySeries(
  userId: string,
  range: AnalyticsRange,
): Promise<LatencyPoint[]> {
  const { start, config } = bounds(range);

  const rows = await db.$queryRaw<{ bucket: Date; median: number; p95: number }[]>`
    SELECT
      date_trunc(${config.unit}, r."createdAt") AS bucket,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY r."durationMs") AS median,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY r."durationMs") AS p95
    FROM api_requests r
    JOIN projects p ON p.id = r."projectId"
    LEFT JOIN team_members tm ON tm."teamId" = p."teamId" AND tm."userId" = ${userId}
    WHERE r."createdAt" >= ${start}
      AND (p."ownerId" = ${userId} OR tm."userId" IS NOT NULL)
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const byBucket = new Map(
    rows.map((row) => [
      row.bucket.toISOString(),
      { median: Math.round(Number(row.median)), p95: Math.round(Number(row.p95)) },
    ]),
  );

  return fillBuckets<LatencyPoint>(byBucket, range, { median: 0, p95: 0 });
}

export async function getStatusBreakdown(
  userId: string,
  range: AnalyticsRange,
): Promise<StatusSlice[]> {
  const { start } = bounds(range);

  const rows = await db.$queryRaw<{ klass: string; count: bigint }[]>`
    SELECT
      CASE
        WHEN r."statusCode" >= 500 THEN '5xx'
        WHEN r."statusCode" >= 400 THEN '4xx'
        ELSE '2xx'
      END AS klass,
      COUNT(*) AS count
    FROM api_requests r
    JOIN projects p ON p.id = r."projectId"
    LEFT JOIN team_members tm ON tm."teamId" = p."teamId" AND tm."userId" = ${userId}
    WHERE r."createdAt" >= ${start}
      AND (p."ownerId" = ${userId} OR tm."userId" IS NOT NULL)
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const counts = new Map(rows.map((row) => [row.klass, Number(row.count)]));

  return [
    { klass: "2xx", label: "Success", count: counts.get("2xx") ?? 0 },
    { klass: "4xx", label: "Client error", count: counts.get("4xx") ?? 0 },
    { klass: "5xx", label: "Server error", count: counts.get("5xx") ?? 0 },
  ];
}

export async function getTopEndpoints(
  userId: string,
  range: AnalyticsRange,
  limit = 6,
): Promise<EndpointRow[]> {
  const { start } = bounds(range);

  const rows = await db.$queryRaw<
    { method: string; path: string; requests: bigint; avg: number; errors: bigint }[]
  >`
    SELECT
      r."method" AS method,
      r."path" AS path,
      COUNT(*) AS requests,
      AVG(r."durationMs") AS avg,
      COUNT(*) FILTER (WHERE r."statusCode" >= 400) AS errors
    FROM api_requests r
    JOIN projects p ON p.id = r."projectId"
    LEFT JOIN team_members tm ON tm."teamId" = p."teamId" AND tm."userId" = ${userId}
    WHERE r."createdAt" >= ${start}
      AND (p."ownerId" = ${userId} OR tm."userId" IS NOT NULL)
    GROUP BY 1, 2
    ORDER BY 3 DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    endpoint: `${row.method} ${row.path}`,
    method: row.method,
    path: row.path,
    requests: Number(row.requests),
    avgDuration: Math.round(Number(row.avg)),
    errorRate: Number(row.requests) === 0 ? 0 : (Number(row.errors) / Number(row.requests)) * 100,
  }));
}
