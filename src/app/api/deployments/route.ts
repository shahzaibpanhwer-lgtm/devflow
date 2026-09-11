import { ActivityType } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { recordActivity } from "@/lib/activity";
import { badRequest, created, fail, ok, serverError, validationFailed } from "@/lib/api-response";
import { AuthError, PROJECT_PERMISSIONS, requireProjectAccess, requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { nextVersion, runDeployment } from "@/lib/deployment-runner";
import { listDeployments } from "@/lib/deployments";
import { clientIdentifier, rateLimit } from "@/lib/rate-limit";
import { createDeploymentSchema, listDeploymentsSchema } from "@/lib/validations/deployment";

/** GET /api/deployments — deployments visible to the signed-in user. */
export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = listDeploymentsSchema.safeParse(params);
    if (!query.success) {
      return validationFailed(query.error);
    }

    const result = await listDeployments(user.id, query.data);

    return ok({
      deployments: result.deployments,
      pagination: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.perPage)),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return serverError(error, "GET /api/deployments");
  }
}

/** Deploying is expensive, so it is capped per client. */
const RATE_LIMIT = { limit: 10, windowMs: 5 * 60 * 1000 };

/** POST /api/deployments — start a deployment for a project. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const limit = rateLimit(`deploy:${clientIdentifier(request)}`, RATE_LIMIT);
    if (!limit.allowed) {
      return fail(`Too many deployments started. Try again in ${limit.retryAfter} seconds.`, 429, {
        code: "RATE_LIMITED",
      });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const parsed = createDeploymentSchema.safeParse(payload);
    if (!parsed.success) {
      return validationFailed(parsed.error);
    }

    const input = parsed.data;

    // Deploying requires the developer role, checked before anything is written.
    await requireProjectAccess(input.projectId, user.id, PROJECT_PERMISSIONS.deploy);

    const project = await db.project.findUnique({
      where: { id: input.projectId },
      select: {
        id: true,
        name: true,
        teamId: true,
        repository: { select: { defaultBranch: true } },
      },
    });

    if (!project) {
      return fail("Project not found", 404);
    }

    const version = input.version ?? (await nextVersion(project.id));
    const branch = input.branch ?? project.repository?.defaultBranch ?? "main";

    const deployment = await db.deployment.create({
      data: {
        projectId: project.id,
        version,
        environment: input.environment,
        status: "QUEUED",
        branch,
        commitSha: randomBytes(20).toString("hex"),
        commitMessage: input.commitMessage ?? "Manual deployment from DevFlow",
        startedAt: new Date(),
        logs: [],
      },
    });

    await recordActivity({
      type: ActivityType.DEPLOYMENT_CREATED,
      message: `Started deployment ${version} for ${project.name}`,
      userId: user.id,
      projectId: project.id,
      teamId: project.teamId,
      deploymentId: deployment.id,
      metadata: { version, environment: input.environment },
    });

    /*
     * Intentionally not awaited: the response returns as soon as the record
     * exists, and the pipeline advances the row behind it. A rejection here
     * cannot surface to this request, so it is logged rather than dropped.
     */
    void runDeployment({
      deploymentId: deployment.id,
      userId: user.id,
      projectId: project.id,
      projectName: project.name,
      teamId: project.teamId,
      version,
      branch,
    }).catch((error: unknown) => {
      console.error("[api] deployment pipeline rejected:", error);
    });

    return created({ deployment });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return serverError(error, "POST /api/deployments");
  }
}
