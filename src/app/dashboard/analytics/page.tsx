import { ActivityIcon, GaugeIcon, RocketIcon, TerminalIcon, TriangleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EndpointTable } from "@/components/analytics/endpoint-table";
import { LatencyChart } from "@/components/analytics/latency-chart";
import { RangeFilter } from "@/components/analytics/range-filter";
import { StatusBreakdown } from "@/components/analytics/status-breakdown";
import { TrafficChart } from "@/components/analytics/traffic-chart";
import { Panel } from "@/components/dashboard/panels";
import { PageHeader } from "@/components/devflow/page-header";
import { StatCard } from "@/components/devflow/stat-card";
import {
  getAnalyticsSummary,
  getLatencySeries,
  getStatusBreakdown,
  getTopEndpoints,
  getTrafficSeries,
} from "@/lib/analytics";
import { RANGE_CONFIG, parseRange } from "@/lib/analytics-range";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Analytics",
};

function formatDelta(change: number | null, suffix = "%"): string | undefined {
  if (change === null) return undefined;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}${suffix}`;
}

/** Whether a rise in this metric is good news. Latency and errors invert. */
function intent(change: number | null, higherIsBetter: boolean) {
  if (change === null || change === 0) return "neutral" as const;
  const good = higherIsBetter ? change > 0 : change < 0;
  return good ? ("positive" as const) : ("negative" as const);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const range = parseRange(params.range);

  // Five independent reads, issued together — in sequence they would stack up
  // on the page's time to first byte.
  const [summary, traffic, latency, status, endpoints] = await Promise.all([
    getAnalyticsSummary(user.id, range),
    getTrafficSeries(user.id, range),
    getLatencySeries(user.id, range),
    getStatusBreakdown(user.id, range),
    getTopEndpoints(user.id, range),
  ]);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Request volume, latency, errors and release cadence across your workspace."
        actions={<RangeFilter current={range} />}
      />

      <section aria-label="Summary statistics" className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="API Requests"
            value={summary.requests.value.toLocaleString()}
            icon={TerminalIcon}
            delta={formatDelta(summary.requests.change)}
            deltaIntent={intent(summary.requests.change, true)}
            emphasis
          />
          <StatCard
            label="Response Time"
            value={`${summary.responseTime.value}ms`}
            icon={GaugeIcon}
            delta={formatDelta(summary.responseTime.change)}
            deltaIntent={intent(summary.responseTime.change, false)}
          />
          <StatCard
            label="Error Rate"
            value={`${summary.errorRate.value.toFixed(2)}%`}
            icon={TriangleAlertIcon}
            delta={formatDelta(summary.errorRate.change, "pp")}
            deltaIntent={intent(summary.errorRate.change, false)}
          />
          <StatCard
            label="Deployments"
            value={summary.deployments.value.toLocaleString()}
            icon={RocketIcon}
            delta={formatDelta(summary.deployments.change)}
            deltaIntent={intent(summary.deployments.change, true)}
          />
          <StatCard
            label="Active Users"
            value={summary.activeUsers.value.toLocaleString()}
            icon={ActivityIcon}
            delta={formatDelta(summary.activeUsers.change)}
            deltaIntent={intent(summary.activeUsers.change, true)}
          />
        </div>
        <p className="text-text-tertiary mt-2 text-xs">
          {RANGE_CONFIG[range].label}, compared with the {RANGE_CONFIG[range].buckets}{" "}
          {RANGE_CONFIG[range].unit === "hour" ? "hours" : "days"} before it. Active users counts
          people who took an action in your projects.
        </p>
      </section>

      <div className="space-y-4">
        <Panel title="Request volume">
          <TrafficChart data={traffic} range={range} />
        </Panel>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Panel title="Response time">
              <LatencyChart data={latency} range={range} />
            </Panel>
          </div>

          <Panel title="Response status">
            <StatusBreakdown slices={status} />
          </Panel>
        </div>

        <Panel title="Busiest endpoints">
          <EndpointTable endpoints={endpoints} />
        </Panel>
      </div>
    </div>
  );
}
