import { DeploymentStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Dashboard aggregations.
 *
 * Every figure the overview renders is computed here from real rows. Counts
 * are compared against the immediately preceding window of equal length so a
 * delta means "versus the previous 30 days", not "versus all time".
 */

const WINDOW_DAYS = 30;

/**
 * Midnight UTC, `daysBack` days before today.
 *
 * Every window and every chart bucket is anchored to UTC days. Postgres groups
 * with date_trunc in UTC, so deriving bucket keys from local midnight instead
 * would shift them by the server's offset and silently drop a day's traffic
 * from the chart while the stat tiles still counted it.
 */
function utcDayStart(daysBack: number): Date {
  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - daysBack);
  return day;
}

/**
 * The window is `days` whole calendar days ending with today, and the
 * comparison window is the `days` immediately before it — so the stat tiles
 * and the chart cover exactly the same span and their totals reconcile.
 */
function windowBounds(days = WINDOW_DAYS) {
  return {
    now: new Date(),
    currentStart: utcDayStart(days - 1),
    previousStart: utcDayStart(days * 2 - 1),
  };
}

/** Projects the user owns or can reach through a team. */
function visibleProjects(userId: string): Prisma.ProjectWhereInput {
  return {
    OR: [{ ownerId: userId }, { team: { members: { some: { userId } } } }],
  };
}

export type StatDelta = {
  value: number;
  /** Percentage change against the previous window; null when it had no data. */
  changePercent: number | null;
};

export type DashboardStats = {
  projects: number;
  deployments: StatDelta;
  apiRequests: StatDelta;
  /** Percentage of requests in the window that returned >= 400. */
  errorRate: number;
  errorRateChange: number | null;
};

function percentChange(current: number, previous: number): number | null {
  // A jump from zero has no meaningful percentage; the caller renders "—".
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const { currentStart, previousStart } = windowBounds();
  const scope = { project: visibleProjects(userId) };

  const [
    projects,
    deploymentsCurrent,
    deploymentsPrevious,
    requestsCurrent,
    requestsPrevious,
    errorsCurrent,
    errorsPrevious,
  ] = await Promise.all([
    db.project.count({ where: visibleProjects(userId) }),
    db.deployment.count({ where: { ...scope, createdAt: { gte: currentStart } } }),
    db.deployment.count({
      where: { ...scope, createdAt: { gte: previousStart, lt: currentStart } },
    }),
    db.apiRequest.count({ where: { ...scope, createdAt: { gte: currentStart } } }),
    db.apiRequest.count({
      where: { ...scope, createdAt: { gte: previousStart, lt: currentStart } },
    }),
    db.apiRequest.count({
      where: { ...scope, createdAt: { gte: currentStart }, statusCode: { gte: 400 } },
    }),
    db.apiRequest.count({
      where: {
        ...scope,
        createdAt: { gte: previousStart, lt: currentStart },
        statusCode: { gte: 400 },
      },
    }),
  ]);

  const errorRate = requestsCurrent === 0 ? 0 : (errorsCurrent / requestsCurrent) * 100;
  const previousErrorRate =
    requestsPrevious === 0 ? null : (errorsPrevious / requestsPrevious) * 100;

  return {
    projects,
    deployments: {
      value: deploymentsCurrent,
      changePercent: percentChange(deploymentsCurrent, deploymentsPrevious),
    },
    apiRequests: {
      value: requestsCurrent,
      changePercent: percentChange(requestsCurrent, requestsPrevious),
    },
    errorRate,
    // Error rate compares in percentage points, not relative percent.
    errorRateChange: previousErrorRate === null ? null : errorRate - previousErrorRate,
  };
}

export type UsagePoint = {
  /** ISO date (YYYY-MM-DD) for the bucket. */
  date: string;
  requests: number;
  errors: number;
};

/**
 * Daily request counts for the chart.
 *
 * Grouped in SQL rather than pulled row-by-row — the seed alone holds four
 * thousand requests, and a production workspace would hold far more.
 */
export async function getApiUsageSeries(userId: string, days = WINDOW_DAYS): Promise<UsagePoint[]> {
  // Same anchor as the stat tiles, so the chart total matches the headline.
  const start = utcDayStart(days - 1);

  const rows = await db.$queryRaw<{ day: Date; requests: bigint; errors: bigint }[]>`
    SELECT
      date_trunc('day', r."createdAt") AS day,
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

  const byDay = new Map(
    rows.map((row) => [
      row.day.toISOString().slice(0, 10),
      { requests: Number(row.requests), errors: Number(row.errors) },
    ]),
  );

  // Days with no traffic must still appear, or the x-axis silently compresses
  // and a quiet weekend looks like it never happened.
  const series: UsagePoint[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + offset);
    const key = date.toISOString().slice(0, 10);
    const found = byDay.get(key);
    series.push({ date: key, requests: found?.requests ?? 0, errors: found?.errors ?? 0 });
  }

  return series;
}

export async function getRecentActivity(userId: string, limit = 8) {
  return db.activity.findMany({
    where: {
      OR: [
        { userId },
        { project: visibleProjects(userId) },
        { team: { members: { some: { userId } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      message: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export async function getRecentDeployments(userId: string, limit = 5) {
  return db.deployment.findMany({
    where: { project: visibleProjects(userId) },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      version: true,
      status: true,
      environment: true,
      durationMs: true,
      createdAt: true,
      project: { select: { id: true, name: true } },
    },
  });
}

/** Deployment outcomes in the window, for the success-rate readout. */
export async function getDeploymentHealth(userId: string) {
  const { currentStart } = windowBounds();

  const grouped = await db.deployment.groupBy({
    by: ["status"],
    where: { project: visibleProjects(userId), createdAt: { gte: currentStart } },
    _count: { _all: true },
  });

  const counts = new Map(grouped.map((row) => [row.status, row._count._all]));
  const succeeded = counts.get(DeploymentStatus.SUCCESS) ?? 0;
  const failed = counts.get(DeploymentStatus.FAILED) ?? 0;
  const finished = succeeded + failed;

  return {
    succeeded,
    failed,
    inProgress:
      (counts.get(DeploymentStatus.QUEUED) ?? 0) +
      (counts.get(DeploymentStatus.BUILDING) ?? 0) +
      (counts.get(DeploymentStatus.TESTING) ?? 0) +
      (counts.get(DeploymentStatus.DEPLOYING) ?? 0),
    successRate: finished === 0 ? null : (succeeded / finished) * 100,
  };
}

/** Compact project list for the overview panel. */
export async function getProjectOverview(userId: string, limit = 5) {
  return db.project.findMany({
    where: visibleProjects(userId),
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      framework: true,
      githubRepository: true,
      _count: { select: { deployments: true } },
      repository: { select: { language: true, stars: true, pushedAt: true } },
    },
  });
}
