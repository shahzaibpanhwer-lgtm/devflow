import { FolderGitIcon, RocketIcon, TerminalIcon, TriangleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ApiUsageChart } from "@/components/dashboard/api-usage-chart";
import {
  ActivityPanel,
  DeploymentsPanel,
  Panel,
  ProjectsPanel,
} from "@/components/dashboard/panels";
import { Greeting } from "@/components/devflow/greeting";
import { StatCard } from "@/components/devflow/stat-card";
import {
  getApiUsageSeries,
  getDashboardStats,
  getDeploymentHealth,
  getProjectOverview,
  getRecentActivity,
  getRecentDeployments,
} from "@/lib/dashboard";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Overview",
};

/** Renders a signed percentage, or an em dash when there is no baseline. */
function formatDelta(change: number | null, suffix = "%"): string | undefined {
  if (change === null) return undefined;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}${suffix}`;
}

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Issued together: they are independent reads, so awaiting them in sequence
  // would add up to six round trips to the page's time-to-first-byte.
  const [stats, usage, activities, deployments, projects, health] = await Promise.all([
    getDashboardStats(user.id),
    getApiUsageSeries(user.id),
    getRecentActivity(user.id),
    getRecentDeployments(user.id),
    getProjectOverview(user.id),
    getDeploymentHealth(user.id),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1.5 pb-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <Greeting name={user.name} />
        </h1>
        <p className="text-text-secondary text-sm">
          Here&rsquo;s what&rsquo;s happening across your projects.
        </p>
      </header>

      <section aria-label="Workspace statistics">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Projects"
            value={stats.projects.toLocaleString()}
            icon={FolderGitIcon}
            emphasis
          />
          <StatCard
            label="Deployments"
            value={stats.deployments.value.toLocaleString()}
            icon={RocketIcon}
            delta={formatDelta(stats.deployments.changePercent)}
            deltaIntent={
              stats.deployments.changePercent === null
                ? "neutral"
                : stats.deployments.changePercent >= 0
                  ? "positive"
                  : "negative"
            }
          />
          <StatCard
            label="API Requests"
            value={stats.apiRequests.value.toLocaleString()}
            icon={TerminalIcon}
            delta={formatDelta(stats.apiRequests.changePercent)}
            deltaIntent={
              stats.apiRequests.changePercent === null
                ? "neutral"
                : stats.apiRequests.changePercent >= 0
                  ? "positive"
                  : "negative"
            }
          />
          <StatCard
            label="Error Rate"
            value={`${stats.errorRate.toFixed(2)}%`}
            icon={TriangleAlertIcon}
            delta={formatDelta(stats.errorRateChange, "pp")}
            /* A rising error rate is bad news, so the intent is inverted. */
            deltaIntent={
              stats.errorRateChange === null
                ? "neutral"
                : stats.errorRateChange > 0
                  ? "negative"
                  : "positive"
            }
          />
        </div>
        <p className="text-text-tertiary mt-2 text-xs">
          Deployments, requests and error rate cover the last 30 days.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="API requests" action={{ label: "Analytics", href: "/dashboard/analytics" }}>
            <ApiUsageChart data={usage} />
          </Panel>
        </div>

        <Panel title="Deployment health">
          <dl className="space-y-3">
            <div className="flex items-baseline justify-between">
              <dt className="text-text-secondary text-sm">Success rate</dt>
              <dd className="font-mono text-2xl font-semibold tabular-nums">
                {health.successRate === null ? "—" : `${health.successRate.toFixed(0)}%`}
              </dd>
            </div>
            <div className="border-line grid grid-cols-3 gap-2 border-t pt-3 text-center">
              {[
                { label: "Succeeded", value: health.succeeded, tone: "text-status-success" },
                { label: "Failed", value: health.failed, tone: "text-status-danger" },
                { label: "Running", value: health.inProgress, tone: "text-status-info" },
              ].map((item) => (
                <div key={item.label}>
                  <dd className={`font-mono text-base font-semibold tabular-nums ${item.tone}`}>
                    {item.value}
                  </dd>
                  <dt className="text-text-tertiary mt-0.5 text-[11px]">{item.label}</dt>
                </div>
              ))}
            </div>
          </dl>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recent activity">
          <ActivityPanel activities={activities} />
        </Panel>

        <Panel
          title="Recent deployments"
          action={{ label: "All deployments", href: "/dashboard/deployments" }}
        >
          <DeploymentsPanel deployments={deployments} />
        </Panel>
      </div>

      <Panel title="Projects" action={{ label: "All projects", href: "/dashboard/projects" }}>
        <ProjectsPanel projects={projects} />
      </Panel>
    </div>
  );
}
