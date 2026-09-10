import {
  ActivityIcon,
  BookTextIcon,
  ChartNoAxesColumnIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  PencilIcon,
  RocketIcon,
  TerminalIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EmptyState } from "@/components/devflow/empty-state";
import { GithubMark } from "@/components/devflow/github-mark";
import { StatusBadge } from "@/components/devflow/status-badge";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/activity";
import { getProjectAccess, PROJECT_PERMISSIONS, roleAtLeast } from "@/lib/authz";
import { getCurrentUser } from "@/lib/current-user";
import { getProjectDetail, type ProjectDetail } from "@/lib/projects";
import type { DeploymentStatus, ProjectStatus } from "@/lib/status";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: "Project" };

  // Metadata must respect the same visibility rules as the page itself.
  const access = await getProjectAccess(id, user.id);
  if (!access) return { title: "Project" };

  const project = await getProjectDetail(id);
  return { title: project?.name ?? "Project" };
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function OverviewPanel({ project }: { project: ProjectDetail }) {
  const latest = project.deployments[0];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <section className="border-line bg-surface-1 rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Current deployment</h2>
          {latest ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <StatusBadge kind="deployment" status={latest.status as DeploymentStatus} />
              <span className="font-mono text-sm font-medium">{latest.version}</span>
              <span className="text-text-tertiary font-mono text-xs">
                {latest.commitSha?.slice(0, 7) ?? "—"}
              </span>
              <span className="text-text-secondary min-w-0 flex-1 truncate text-xs">
                {latest.commitMessage ?? ""}
              </span>
              <span className="text-text-tertiary text-xs">{relativeTime(latest.createdAt)}</span>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">This project has not been deployed yet.</p>
          )}
        </section>

        <section className="border-line bg-surface-1 rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Recent deployments</h2>
          {project.deployments.length === 0 ? (
            <p className="text-text-secondary text-sm">No deployments recorded.</p>
          ) : (
            <ul className="divide-line divide-y">
              {project.deployments.map((deployment) => (
                <li key={deployment.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                  <StatusBadge kind="deployment" status={deployment.status as DeploymentStatus} />
                  <span className="font-mono text-xs font-medium">{deployment.version}</span>
                  <span className="text-text-tertiary hidden font-mono text-[11px] sm:inline">
                    {deployment.branch ?? "main"}
                  </span>
                  <span className="text-text-tertiary ml-auto shrink-0 font-mono text-[11px]">
                    {formatDuration(deployment.durationMs)}
                  </span>
                  <span className="text-text-tertiary hidden shrink-0 text-[11px] sm:inline">
                    {relativeTime(deployment.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-line bg-surface-1 rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Recent activity</h2>
          {project.activities.length === 0 ? (
            <p className="text-text-secondary text-sm">Nothing has happened yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {project.activities.map((activity) => (
                <li key={activity.id} className="flex items-start gap-2.5 text-sm">
                  <span
                    className="bg-brand-500 mt-1.5 size-1.5 shrink-0 rounded-full"
                    aria-hidden="true"
                  />
                  <span className="text-text-secondary min-w-0 flex-1">
                    {activity.message}
                    <span className="text-text-tertiary block text-xs">
                      {activity.user.name ?? activity.user.email} ·{" "}
                      {relativeTime(activity.createdAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-5">
        <section className="border-line bg-surface-1 rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Statistics</h2>
          <dl className="space-y-2.5 text-sm">
            {[
              { label: "Deployments", value: project._count.deployments, icon: RocketIcon },
              { label: "API keys", value: project._count.apiKeys, icon: KeyRoundIcon },
              { label: "Documents", value: project._count.docs, icon: BookTextIcon },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <stat.icon className="text-text-tertiary size-3.5" aria-hidden="true" />
                <dt className="text-text-secondary">{stat.label}</dt>
                <dd className="ml-auto font-mono tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-line bg-surface-1 rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Environment</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-baseline gap-2">
              <dt className="text-text-secondary shrink-0">Framework</dt>
              <dd className="ml-auto truncate font-mono text-xs">{project.framework ?? "—"}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-text-secondary shrink-0">Slug</dt>
              <dd className="ml-auto truncate font-mono text-xs">/{project.slug}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-text-secondary shrink-0">Team</dt>
              <dd className="ml-auto truncate text-xs">{project.team?.name ?? "Personal"}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-text-secondary shrink-0">Created</dt>
              <dd className="ml-auto truncate text-xs">{relativeTime(project.createdAt)}</dd>
            </div>
          </dl>
        </section>

        {project.repository ? (
          <section className="border-line bg-surface-1 rounded-lg border p-4">
            <h2 className="mb-3 text-sm font-medium">Repository</h2>
            <a
              href={project.repository.url}
              target="_blank"
              rel="noreferrer"
              className="text-text-secondary hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs transition-colors"
            >
              <GithubMark className="size-3.5" />
              <span className="truncate">{project.repository.fullName}</span>
            </a>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Stars", value: project.repository.stars },
                { label: "Forks", value: project.repository.forks },
                { label: "Issues", value: project.repository.openIssues },
              ].map((stat) => (
                <div key={stat.label}>
                  <dd className="font-mono text-sm font-semibold tabular-nums">{stat.value}</dd>
                  <dt className="text-text-tertiary text-[10px]">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // A project the user cannot see is reported as missing rather than
  // forbidden, so the page never confirms that it exists.
  const access = await getProjectAccess(id, user.id);
  if (!access) notFound();

  const project = await getProjectDetail(id);
  if (!project) notFound();

  const canEdit = roleAtLeast(access.effectiveRole, PROJECT_PERMISSIONS.update);
  const canDelete = roleAtLeast(access.effectiveRole, PROJECT_PERMISSIONS.delete);

  return (
    <div>
      <header className="flex flex-col gap-4 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {project.name}
            </h1>
            <StatusBadge kind="project" status={project.status as ProjectStatus} />
          </div>
          {project.description ? (
            <p className="text-text-secondary max-w-2xl text-sm text-pretty">
              {project.description}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {project.githubRepository ? (
              <a
                href={`https://github.com/${project.githubRepository}`}
                target="_blank"
                rel="noreferrer"
                className="text-text-tertiary hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs transition-colors"
              >
                <GithubMark className="size-3.5" />
                {project.githubRepository}
              </a>
            ) : null}
            {project.productionUrl ? (
              <a
                href={project.productionUrl}
                target="_blank"
                rel="noreferrer"
                className="text-text-tertiary hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
              >
                {project.productionUrl.replace(/^https?:\/\//, "")}
                <ExternalLinkIcon className="size-3" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canEdit ? (
            <ProjectFormDialog
              project={{
                id: project.id,
                name: project.name,
                description: project.description ?? "",
                framework: project.framework ?? "",
                status: project.status as ProjectStatus,
                productionUrl: project.productionUrl ?? "",
                repositoryUrl: project.repositoryUrl ?? "",
                githubRepository: project.githubRepository ?? "",
              }}
              trigger={
                <Button variant="outline" size="sm">
                  <PencilIcon aria-hidden="true" />
                  Edit
                </Button>
              }
            />
          ) : null}
          {canDelete ? (
            <DeleteProjectDialog
              projectId={project.id}
              projectName={project.name}
              redirectTo="/dashboard/projects"
              trigger={
                <Button variant="destructive" size="sm">
                  <Trash2Icon aria-hidden="true" />
                  Delete
                </Button>
              }
            />
          ) : null}
        </div>
      </header>

      <ProjectTabs
        panels={{
          overview: <OverviewPanel project={project} />,
          deployments: (
            <EmptyState
              icon={RocketIcon}
              title="Deployment management arrives next"
              description="The full deployment timeline, build logs and the ability to trigger a release are built in the deployments phase. Recent deployments already appear on the Overview tab."
            />
          ),
          analytics: (
            <EmptyState
              icon={ChartNoAxesColumnIcon}
              title="Per-project analytics not built yet"
              description="Request volume, latency and error rates for this project arrive in the analytics phase."
            />
          ),
          api: (
            <EmptyState
              icon={TerminalIcon}
              title="API keys not built yet"
              description="Issuing and revoking keys scoped to this project arrives in the API keys phase."
            />
          ),
          team: (
            <EmptyState
              icon={UsersIcon}
              title="Project members not built yet"
              description={`This project belongs to ${project.team?.name ?? "your personal workspace"}. Per-project member management arrives in the team phase.`}
            />
          ),
          docs: (
            <EmptyState
              icon={ActivityIcon}
              title="Documentation not built yet"
              description={`${project._count.docs} document${project._count.docs === 1 ? "" : "s"} recorded. The documentation reader and editor arrive in the documentation phase.`}
            />
          ),
        }}
      />
    </div>
  );
}
