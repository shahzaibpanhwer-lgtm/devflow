import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { ListProjectsQuery } from "@/lib/validations/project";

/**
 * Project queries.
 *
 * Kept separate from the route handlers so server components and API routes
 * read through exactly the same code, and so the shape returned to clients is
 * defined in one place rather than per endpoint.
 */

/** Columns safe to expose. Notably excludes nothing sensitive today, but the
 *  explicit select stops future columns leaking by accident. */
const projectSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  framework: true,
  status: true,
  productionUrl: true,
  repositoryUrl: true,
  githubRepository: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
  teamId: true,
} satisfies Prisma.ProjectSelect;

export type ProjectSummary = Prisma.ProjectGetPayload<{
  select: typeof projectSelect;
}> & {
  deploymentCount: number;
  lastDeployedAt: Date | null;
};

/**
 * Restricts a query to projects the user may see: those they own, plus those
 * belonging to a team they are a member of.
 */
function visibilityFilter(userId: string): Prisma.ProjectWhereInput {
  return {
    OR: [{ ownerId: userId }, { team: { members: { some: { userId } } } }],
  };
}

export async function listProjects(
  userId: string,
  query: ListProjectsQuery,
): Promise<{ projects: ProjectSummary[]; total: number; page: number; perPage: number }> {
  const where: Prisma.ProjectWhereInput = {
    AND: [
      visibilityFilter(userId),
      query.status ? { status: query.status } : {},
      query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { description: { contains: query.search, mode: "insensitive" } },
              { githubRepository: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  const [rows, total] = await Promise.all([
    db.project.findMany({
      where,
      select: {
        ...projectSelect,
        _count: { select: { deployments: true } },
        deployments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    }),
    db.project.count({ where }),
  ]);

  const projects = rows.map(({ _count, deployments, ...project }) => ({
    ...project,
    deploymentCount: _count.deployments,
    lastDeployedAt: deployments[0]?.createdAt ?? null,
  }));

  return { projects, total, page: query.page, perPage: query.perPage };
}

/** Full project record with the relations the detail page renders. */
export async function getProjectDetail(projectId: string) {
  return db.project.findUnique({
    where: { id: projectId },
    select: {
      ...projectSelect,
      owner: { select: { id: true, name: true, email: true, image: true } },
      team: { select: { id: true, name: true, slug: true } },
      repository: true,
      _count: {
        select: { deployments: true, apiKeys: true, docs: true },
      },
      deployments: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          version: true,
          status: true,
          environment: true,
          durationMs: true,
          commitSha: true,
          commitMessage: true,
          branch: true,
          createdAt: true,
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          type: true,
          message: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
}

export type ProjectDetail = NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>;

/**
 * Public projection for /p/[slug].
 *
 * Filters on isPublic in the query rather than fetching and checking after,
 * so an unpublished project is indistinguishable from one that does not
 * exist — the page cannot be used to confirm a private project's slug.
 * Owner and team data are deliberately not selected.
 */
export async function getPublicProject(slug: string) {
  return db.project.findFirst({
    where: { slug, isPublic: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      framework: true,
      status: true,
      productionUrl: true,
      repositoryUrl: true,
      githubRepository: true,
      createdAt: true,
      repository: {
        select: { language: true, stars: true, forks: true, openIssues: true },
      },
      _count: { select: { deployments: true } },
    },
  });
}

/**
 * Aggregate figures for the public page.
 *
 * Counted over the project's whole history rather than a rolling window: a
 * portfolio page is showing what was built, not how busy last month was.
 */
export async function getPublicProjectStats(projectId: string) {
  const [deployments, succeeded, failed, apiRequests] = await Promise.all([
    db.deployment.count({ where: { projectId } }),
    db.deployment.count({ where: { projectId, status: "SUCCESS" } }),
    db.deployment.count({ where: { projectId, status: "FAILED" } }),
    db.apiRequest.count({ where: { projectId } }),
  ]);

  const finished = succeeded + failed;

  return {
    deployments,
    apiRequests,
    successRate: finished === 0 ? null : (succeeded / finished) * 100,
  };
}

export async function slugExists(slug: string): Promise<boolean> {
  const existing = await db.project.findUnique({ where: { slug }, select: { id: true } });
  return existing !== null;
}
