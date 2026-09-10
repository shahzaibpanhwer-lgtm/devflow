import {
  ActivityIcon,
  FolderGitIcon,
  RocketIcon,
  TerminalIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/devflow/empty-state";
import { Greeting } from "@/components/devflow/greeting";
import { StatCard } from "@/components/devflow/stat-card";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <header className="space-y-1.5 pb-2">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          <Greeting name={user?.name} />
        </h1>
        <p className="text-text-secondary text-sm">
          Here&rsquo;s what&rsquo;s happening across your projects.
        </p>
      </header>

      <section aria-label="Workspace statistics">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Projects" value="0" icon={FolderGitIcon} emphasis />
          <StatCard label="Deployments" value="0" icon={RocketIcon} />
          <StatCard label="API Requests" value="0" icon={TerminalIcon} />
          <StatCard label="Error Rate" value="0.00%" icon={TriangleAlertIcon} />
        </div>
      </section>

      <section aria-label="Recent activity" className="space-y-3">
        <h2 className="text-sm font-medium">Recent activity</h2>
        <EmptyState
          icon={ActivityIcon}
          title="No activity yet"
          description="Once you create a project and ship your first deployment, everything that happens across the workspace shows up here."
        />
      </section>
    </div>
  );
}
