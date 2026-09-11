import {
  CircleDotIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  GitPullRequestIcon,
  StarIcon,
  UnplugIcon,
} from "lucide-react";

import { GithubMark } from "@/components/devflow/github-mark";
import { ConnectRepositoryDialog } from "@/components/github/connect-repository-dialog";
import { DisconnectRepositoryButton } from "@/components/github/disconnect-repository-button";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/time";
import { describeGitHubError, GitHubError } from "@/lib/github/errors";
import { getCommits, getIssues, getPullRequests } from "@/lib/github/repositories";

const NOT_CONNECTED_NOTE = "Connect your GitHub account in Settings to see live activity here.";

type RepositoryRecord = {
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  isPrivate: boolean;
  defaultBranch: string;
  pushedAt: Date | null;
  lastSyncedAt: Date | null;
};

/**
 * Renders one GitHub section, or the reason it is empty.
 *
 * Each section is fetched independently and settled on its own, so a rate
 * limit on issues still leaves the commits visible rather than blanking the
 * whole panel.
 */
function Section({
  title,
  icon: Icon,
  error,
  children,
}: {
  title: string;
  icon: typeof StarIcon;
  error: unknown;
  children: React.ReactNode;
}) {
  return (
    <section className="border-line bg-surface-1 rounded-lg border p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Icon className="text-text-tertiary size-3.5" aria-hidden="true" />
        {title}
      </h3>
      {error ? (
        <p className="text-status-warning text-xs">
          {error instanceof GitHubError
            ? describeGitHubError(error)
            : "This section could not be loaded."}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

export async function RepositoryPanel({
  userId,
  projectId,
  repository,
  canEdit,
  githubConnected,
}: {
  userId: string;
  projectId: string;
  repository: RepositoryRecord | null;
  canEdit: boolean;
  /** False when GitHub OAuth is unconfigured or the user has not linked it. */
  githubConnected: boolean;
}) {
  if (!repository) {
    return (
      <div className="border-line bg-surface-1 flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
        <div className="border-line bg-surface-2 text-text-secondary mb-4 flex size-10 items-center justify-center rounded-lg border">
          <GithubMark className="size-5" />
        </div>
        <h3 className="text-sm font-medium">No repository connected</h3>
        <p className="text-text-secondary mt-1.5 max-w-sm text-sm text-pretty">
          Connect a GitHub repository to track commits, pull requests and open issues alongside this
          project.
        </p>
        {canEdit ? (
          <ConnectRepositoryDialog
            projectId={projectId}
            trigger={
              <Button size="sm" className="mt-5">
                <GithubMark className="size-3.5" />
                Connect repository
              </Button>
            }
          />
        ) : null}
      </div>
    );
  }

  // Without a linked account every call would fail identically, so the live
  // sections are skipped rather than firing three requests to render three
  // copies of the same error. Stored repository details still render.
  const [commits, pullRequests, issues] = githubConnected
    ? await Promise.allSettled([
        getCommits(userId, repository.fullName),
        getPullRequests(userId, repository.fullName),
        getIssues(userId, repository.fullName),
      ])
    : ([null, null, null] as const);

  const commitError = commits?.status === "rejected" ? commits.reason : null;
  const pullError = pullRequests?.status === "rejected" ? pullRequests.reason : null;
  const issueError = issues?.status === "rejected" ? issues.reason : null;

  return (
    <div className="space-y-5">
      <section className="border-line bg-surface-1 rounded-lg border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <a
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-500 inline-flex items-center gap-2 font-mono text-sm font-medium transition-colors"
            >
              <GithubMark className="size-4" />
              {repository.fullName}
            </a>
            {repository.description ? (
              <p className="text-text-secondary mt-1.5 max-w-xl text-sm text-pretty">
                {repository.description}
              </p>
            ) : null}
          </div>
          {canEdit ? (
            <div className="flex items-center gap-2">
              <ConnectRepositoryDialog
                projectId={projectId}
                trigger={
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                }
              />
              <DisconnectRepositoryButton
                projectId={projectId}
                repositoryName={repository.fullName}
                trigger={
                  <Button variant="ghost" size="sm">
                    <UnplugIcon aria-hidden="true" />
                    Disconnect
                  </Button>
                }
              />
            </div>
          ) : null}
        </div>

        <dl className="border-line mt-4 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-5">
          {[
            { label: "Stars", value: repository.stars, icon: StarIcon },
            { label: "Forks", value: repository.forks, icon: GitBranchIcon },
            { label: "Open issues", value: repository.openIssues, icon: CircleDotIcon },
          ].map((stat) => (
            <div key={stat.label}>
              <dd className="font-mono text-base font-semibold tabular-nums">{stat.value}</dd>
              <dt className="text-text-tertiary mt-0.5 text-[11px]">{stat.label}</dt>
            </div>
          ))}
          <div>
            <dd className="truncate font-mono text-sm">{repository.language ?? "—"}</dd>
            <dt className="text-text-tertiary mt-0.5 text-[11px]">Language</dt>
          </div>
          <div>
            <dd className="truncate font-mono text-sm">{repository.defaultBranch}</dd>
            <dt className="text-text-tertiary mt-0.5 text-[11px]">Default branch</dt>
          </div>
        </dl>

        {repository.lastSyncedAt ? (
          <p className="text-text-tertiary mt-3 text-[11px]">
            Synced {relativeTime(repository.lastSyncedAt)}
            {repository.pushedAt ? ` · last push ${relativeTime(repository.pushedAt)}` : ""}
          </p>
        ) : null}
      </section>

      <Section title="Recent commits" icon={GitCommitHorizontalIcon} error={commitError}>
        {commits?.status === "fulfilled" && commits.value.length > 0 ? (
          <ul className="divide-line divide-y">
            {commits.value.map((commit) => (
              <li key={commit.sha} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <a
                  href={commit.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-text-tertiary hover:text-foreground shrink-0 font-mono text-[11px] transition-colors"
                >
                  {commit.sha.slice(0, 7)}
                </a>
                <span className="min-w-0 flex-1 truncate text-xs">
                  {commit.commit.message.split("\n")[0]}
                </span>
                <span className="text-text-tertiary hidden shrink-0 text-[11px] sm:inline">
                  {commit.author?.login ?? commit.commit.author?.name ?? "unknown"}
                </span>
                {commit.commit.author?.date ? (
                  <span className="text-text-tertiary shrink-0 text-[11px]">
                    {relativeTime(new Date(commit.commit.author.date))}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-secondary text-xs">
            {githubConnected ? "No commits found." : NOT_CONNECTED_NOTE}
          </p>
        )}
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Open pull requests" icon={GitPullRequestIcon} error={pullError}>
          {pullRequests?.status === "fulfilled" && pullRequests.value.length > 0 ? (
            <ul className="space-y-2">
              {pullRequests.value.map((pull) => (
                <li key={pull.number} className="flex items-start gap-2 text-xs">
                  <span className="text-text-tertiary shrink-0 font-mono">#{pull.number}</span>
                  <a
                    href={pull.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand-500 min-w-0 flex-1 truncate transition-colors"
                  >
                    {pull.title}
                  </a>
                  {pull.draft ? (
                    <span className="text-text-tertiary shrink-0 text-[10px]">draft</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary text-xs">
              {githubConnected ? "No open pull requests." : NOT_CONNECTED_NOTE}
            </p>
          )}
        </Section>

        <Section title="Open issues" icon={CircleDotIcon} error={issueError}>
          {issues?.status === "fulfilled" && issues.value.length > 0 ? (
            <ul className="space-y-2">
              {issues.value.map((issue) => (
                <li key={issue.number} className="flex items-start gap-2 text-xs">
                  <span className="text-text-tertiary shrink-0 font-mono">#{issue.number}</span>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand-500 min-w-0 flex-1 truncate transition-colors"
                  >
                    {issue.title}
                  </a>
                  {issue.comments > 0 ? (
                    <span className="text-text-tertiary shrink-0 text-[10px]">
                      {issue.comments}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary text-xs">
              {githubConnected ? "No open issues." : NOT_CONNECTED_NOTE}
            </p>
          )}
        </Section>
      </div>
    </div>
  );
}
