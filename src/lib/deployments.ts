import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { LogLine } from "@/lib/deployment-runner";
import type { ListDeploymentsQuery } from "@/lib/validations/deployment";

/**
 * Deployment queries, shared by the route handlers and the server components
 * that render the deployments page.
 */

const deploymentSelect = {
  id: true,
  version: true,
  status: true,
  environment: true,
  durationMs: true,
  commitSha: true,
  commitMessage: true,
  branch: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  project: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.DeploymentSelect;

export type DeploymentSummary = Prisma.DeploymentGetPayload<{
  select: typeof deploymentSelect;
}>;

/** Deployments belonging to projects the user owns or reaches through a team. */
function visibilityFilter(userId: string): Prisma.DeploymentWhereInput {
  return {
    project: {
      OR: [{ ownerId: userId }, { team: { members: { some: { userId } } } }],
    },
  };
}

export async function listDeployments(userId: string, query: ListDeploymentsQuery) {
  const where: Prisma.DeploymentWhereInput = {
    AND: [
      visibilityFilter(userId),
      query.projectId ? { projectId: query.projectId } : {},
      query.status ? { status: query.status } : {},
      query.environment ? { environment: query.environment } : {},
    ],
  };

  const [deployments, total] = await Promise.all([
    db.deployment.findMany({
      where,
      select: deploymentSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
    }),
    db.deployment.count({ where }),
  ]);

  return { deployments, total, page: query.page, perPage: query.perPage };
}

/** Full record including logs, for the expanded row and detail view. */
export async function getDeployment(deploymentId: string) {
  const deployment = await db.deployment.findUnique({
    where: { id: deploymentId },
    select: {
      ...deploymentSelect,
      logs: true,
      project: { select: { id: true, name: true, slug: true, ownerId: true, teamId: true } },
    },
  });

  if (!deployment) return null;

  return {
    ...deployment,
    // Logs are stored as JSON; normalise to an array so callers never have to
    // defend against a null or a malformed value.
    logs: Array.isArray(deployment.logs) ? (deployment.logs as unknown as LogLine[]) : [],
  };
}

export type DeploymentDetail = NonNullable<Awaited<ReturnType<typeof getDeployment>>>;

/** Projects the user may deploy, for the create dialog. */
export function listDeployableProjects(userId: string) {
  return db.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { team: { members: { some: { userId } } } }],
      status: { not: "ARCHIVED" },
    },
    select: { id: true, name: true, slug: true },
    orderBy: { updatedAt: "desc" },
  });
}
