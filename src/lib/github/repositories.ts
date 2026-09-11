import "server-only";

import { githubRequest } from "@/lib/github/client";
import type {
  GithubBranch,
  GithubCommit,
  GithubIssue,
  GithubPullRequest,
  GithubRepository,
} from "@/lib/github/types";

/** Repositories the signed-in user can push to, most recently updated first. */
export async function listUserRepositories(
  userId: string,
  { perPage = 100 }: { perPage?: number } = {},
): Promise<GithubRepository[]> {
  const repositories = await githubRequest<GithubRepository[]>(userId, "/user/repos", {
    searchParams: {
      per_page: perPage,
      sort: "updated",
      affiliation: "owner,collaborator,organization_member",
    },
    // Short cache: the picker should notice a repository created moments ago.
    revalidate: 60,
  });

  return repositories.filter((repository) => !repository.archived);
}

export function getRepository(userId: string, fullName: string): Promise<GithubRepository> {
  return githubRequest<GithubRepository>(userId, `/repos/${fullName}`, { revalidate: 300 });
}

export function getBranches(userId: string, fullName: string): Promise<GithubBranch[]> {
  return githubRequest<GithubBranch[]>(userId, `/repos/${fullName}/branches`, {
    searchParams: { per_page: 20 },
    revalidate: 300,
  });
}

export function getCommits(
  userId: string,
  fullName: string,
  { limit = 5 }: { limit?: number } = {},
): Promise<GithubCommit[]> {
  return githubRequest<GithubCommit[]>(userId, `/repos/${fullName}/commits`, {
    searchParams: { per_page: limit },
    revalidate: 120,
  });
}

export function getPullRequests(
  userId: string,
  fullName: string,
  { limit = 5 }: { limit?: number } = {},
): Promise<GithubPullRequest[]> {
  return githubRequest<GithubPullRequest[]>(userId, `/repos/${fullName}/pulls`, {
    searchParams: { per_page: limit, state: "open", sort: "updated", direction: "desc" },
    revalidate: 120,
  });
}

/**
 * Open issues, excluding pull requests.
 *
 * GitHub's issues endpoint returns pull requests too — they are issues
 * internally — so anything carrying a `pull_request` key is dropped, otherwise
 * the issue count on screen would not match the one on GitHub.
 */
export async function getIssues(
  userId: string,
  fullName: string,
  { limit = 5 }: { limit?: number } = {},
): Promise<GithubIssue[]> {
  const issues = await githubRequest<GithubIssue[]>(userId, `/repos/${fullName}/issues`, {
    searchParams: { per_page: limit + 10, state: "open", sort: "updated", direction: "desc" },
    revalidate: 120,
  });

  return issues.filter((issue) => issue.pull_request === undefined).slice(0, limit);
}
