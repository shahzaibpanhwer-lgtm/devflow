import { ExternalLinkIcon, RocketIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { GithubMark } from "@/components/devflow/github-mark";
import { StatusBadge } from "@/components/devflow/status-badge";
import { relativeTime } from "@/lib/activity";
import type { ProjectSummary } from "@/lib/projects";
import type { ProjectStatus } from "@/lib/status";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <div className="border-line bg-surface-1 hover:border-line-strong group relative flex flex-col rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Stretched link keeps the whole card clickable while leaving the
              action links below independently focusable. */}
          <h3 className="truncate text-sm font-medium">
            <Link
              href={`/dashboard/projects/${project.id}` as Route}
              className="before:absolute before:inset-0 before:content-[''] focus-visible:outline-none"
            >
              {project.name}
            </Link>
          </h3>
          <p className="text-text-tertiary mt-0.5 truncate font-mono text-xs">/{project.slug}</p>
        </div>
        <StatusBadge kind="project" status={project.status as ProjectStatus} />
      </div>

      <p className="text-text-secondary mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-pretty">
        {project.description ?? "No description yet."}
      </p>

      <div className="text-text-tertiary mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        {project.framework ? (
          <span className="border-line bg-surface-2 rounded border px-1.5 py-0.5 font-mono text-[10px]">
            {project.framework}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <RocketIcon className="size-3.5" aria-hidden="true" />
          {project.deploymentCount} {project.deploymentCount === 1 ? "deployment" : "deployments"}
        </span>
        {project.lastDeployedAt ? <span>{relativeTime(project.lastDeployedAt)}</span> : null}
      </div>

      {project.githubRepository || project.productionUrl ? (
        <div className="border-line relative z-10 mt-4 flex items-center gap-3 border-t pt-3">
          {project.githubRepository ? (
            <a
              href={`https://github.com/${project.githubRepository}`}
              target="_blank"
              rel="noreferrer"
              className="text-text-tertiary hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
            >
              <GithubMark className="size-3.5" />
              <span className="max-w-[12rem] truncate">{project.githubRepository}</span>
            </a>
          ) : null}
          {project.productionUrl ? (
            <a
              href={project.productionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-text-tertiary hover:text-foreground ml-auto inline-flex items-center gap-1.5 text-xs transition-colors"
            >
              Live
              <ExternalLinkIcon className="size-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
