import { ActivityIcon, ArrowRightIcon, FolderGitIcon, RocketIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { GithubMark } from "@/components/devflow/github-mark";
import { StatusBadge } from "@/components/devflow/status-badge";
import { relativeTime } from "@/lib/activity";
import type { getProjectOverview, getRecentActivity, getRecentDeployments } from "@/lib/dashboard";
import type { DeploymentStatus, ProjectStatus } from "@/lib/status";

type Activities = Awaited<ReturnType<typeof getRecentActivity>>;
type Deployments = Awaited<ReturnType<typeof getRecentDeployments>>;
type Projects = Awaited<ReturnType<typeof getProjectOverview>>;

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href: Route };
  children: ReactNode;
}) {
  return (
    <section className="border-line bg-surface-1 rounded-lg border">
      <header className="border-line flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {action ? (
          <Link
            href={action.href}
            className="text-text-tertiary hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
          >
            {action.label}
            <ArrowRightIcon className="size-3" aria-hidden="true" />
          </Link>
        ) : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function PanelEmpty({ icon: Icon, message }: { icon: typeof ActivityIcon; message: string }) {
  return (
    <div className="text-text-tertiary flex flex-col items-center gap-2 py-8 text-center">
      <Icon className="size-5" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function ActivityPanel({ activities }: { activities: Activities }) {
  if (activities.length === 0) {
    return <PanelEmpty icon={ActivityIcon} message="No activity recorded yet." />;
  }

  return (
    <ol className="space-y-3">
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-start gap-2.5">
          <span className="bg-brand-500 mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm">{activity.message}</p>
            <p className="text-text-tertiary mt-0.5 text-xs">
              {activity.user.name ?? activity.user.email}
              {activity.project ? ` · ${activity.project.name}` : ""} ·{" "}
              <time dateTime={activity.createdAt.toISOString()}>
                {relativeTime(activity.createdAt)}
              </time>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "running";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function DeploymentsPanel({ deployments }: { deployments: Deployments }) {
  if (deployments.length === 0) {
    return <PanelEmpty icon={RocketIcon} message="Nothing has been deployed yet." />;
  }

  return (
    <ul className="divide-line divide-y">
      {deployments.map((deployment) => (
        <li key={deployment.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <StatusBadge kind="deployment" status={deployment.status as DeploymentStatus} />
          <span className="font-mono text-xs font-medium">{deployment.version}</span>
          <Link
            href={`/dashboard/projects/${deployment.project.id}` as Route}
            className="text-text-secondary hover:text-foreground min-w-0 truncate text-xs transition-colors"
          >
            {deployment.project.name}
          </Link>
          <span className="text-text-tertiary ml-auto shrink-0 font-mono text-[11px]">
            {formatDuration(deployment.durationMs)}
          </span>
          <span className="text-text-tertiary hidden shrink-0 text-[11px] sm:inline">
            {relativeTime(deployment.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ProjectsPanel({ projects }: { projects: Projects }) {
  if (projects.length === 0) {
    return <PanelEmpty icon={FolderGitIcon} message="No projects yet." />;
  }

  return (
    <ul className="divide-line divide-y">
      {projects.map((project) => (
        <li key={project.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <Link
              href={`/dashboard/projects/${project.id}` as Route}
              className="hover:text-brand-500 truncate text-sm font-medium transition-colors"
            >
              {project.name}
            </Link>
            <p className="text-text-tertiary mt-0.5 flex items-center gap-2 truncate text-xs">
              {project.githubRepository ? (
                <span className="inline-flex items-center gap-1 truncate font-mono">
                  <GithubMark className="size-3" />
                  {project.githubRepository}
                </span>
              ) : (
                <span>{project.framework ?? "No repository"}</span>
              )}
            </p>
          </div>
          <span className="text-text-tertiary shrink-0 font-mono text-[11px] tabular-nums">
            {project._count.deployments}
          </span>
          <StatusBadge kind="project" status={project.status as ProjectStatus} />
        </li>
      ))}
    </ul>
  );
}
