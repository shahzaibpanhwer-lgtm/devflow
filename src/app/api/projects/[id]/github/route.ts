import { fail, ok } from "@/lib/api-response";
import { PROJECT_PERMISSIONS, requireProjectAccess, requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { describeGitHubError, GitHubError } from "@/lib/github/errors";
import { respondToGithubFailure } from "@/lib/github/respond";
import { getCommits, getIssues, getPullRequests } from "@/lib/github/repositories";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * One section of the response: either the items, or why they are missing.
 *
 * A bare `null` would be ambiguous — the caller could not tell an empty
 * repository from an unreachable GitHub — so a failed section carries its
 * reason instead.
 */
type Section<T> =
  { items: T[]; error: null } | { items: null; error: { message: string; code: string } };

function toSection<T>(
  result: PromiseSettledResult<unknown>,
  map: (value: unknown) => T[],
): Section<T> {
  if (result.status === "fulfilled") {
    return { items: map(result.value), error: null };
  }

  const reason = result.reason;
  if (reason instanceof GitHubError) {
    return {
      items: null,
      error: { message: describeGitHubError(reason), code: `GITHUB_${reason.kind.toUpperCase()}` },
    };
  }

  console.error("[api] GET /api/projects/[id]/github section failed:", reason);
  return {
    items: null,
    error: { message: "This section could not be loaded.", code: "INTERNAL_ERROR" },
  };
}

/**
 * GET /api/projects/[id]/github — live repository activity.
 *
 * The three calls are settled independently: a rate limit on issues should not
 * discard the commits the request already retrieved.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireProjectAccess(id, user.id, PROJECT_PERMISSIONS.view);

    const project = await db.project.findUnique({
      where: { id },
      select: { githubRepository: true },
    });

    if (!project?.githubRepository) {
      return fail("This project has no repository connected", 409, { code: "NO_REPOSITORY" });
    }

    const fullName = project.githubRepository;

    const [commits, pullRequests, issues] = await Promise.allSettled([
      getCommits(user.id, fullName),
      getPullRequests(user.id, fullName),
      getIssues(user.id, fullName),
    ]);

    return ok({
      repository: fullName,
      commits: toSection(commits, (value) =>
        (value as Awaited<ReturnType<typeof getCommits>>).map((commit) => ({
          sha: commit.sha,
          url: commit.html_url,
          message: commit.commit.message.split("\n")[0] ?? "",
          author: commit.author?.login ?? commit.commit.author?.name ?? "unknown",
          date: commit.commit.author?.date ?? null,
        })),
      ),
      pullRequests: toSection(pullRequests, (value) =>
        (value as Awaited<ReturnType<typeof getPullRequests>>).map((pull) => ({
          number: pull.number,
          title: pull.title,
          url: pull.html_url,
          draft: pull.draft,
          author: pull.user?.login ?? "unknown",
          createdAt: pull.created_at,
        })),
      ),
      issues: toSection(issues, (value) =>
        (value as Awaited<ReturnType<typeof getIssues>>).map((issue) => ({
          number: issue.number,
          title: issue.title,
          url: issue.html_url,
          comments: issue.comments,
          author: issue.user?.login ?? "unknown",
          createdAt: issue.created_at,
        })),
      ),
    });
  } catch (error) {
    return respondToGithubFailure(error, "GET /api/projects/[id]/github");
  }
}
