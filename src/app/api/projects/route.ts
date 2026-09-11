import { ActivityType } from "@prisma/client";

import { recordActivity } from "@/lib/activity";
import { authenticateApiKey } from "@/lib/api-keys";
import { badRequest, created, fail, ok, serverError, validationFailed } from "@/lib/api-response";
import { AuthError, requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { getProjectDetail, listProjects, slugExists } from "@/lib/projects";
import { uniqueSlug } from "@/lib/slug";
import { createProjectSchema, listProjectsSchema } from "@/lib/validations/project";

/**
 * GET /api/projects — projects visible to the caller.
 *
 * Accepts either a browser session or an API key. A key is scoped to a single
 * project, so it returns that project alone rather than the issuer's whole
 * workspace — a key handed to a CI job should not widen into an account.
 */
export async function GET(request: Request) {
  try {
    const apiKey = await authenticateApiKey(request);

    if (apiKey) {
      const project = await getProjectDetail(apiKey.projectId);
      if (!project) return fail("Project not found", 404);

      return ok({
        projects: [project],
        pagination: { page: 1, perPage: 1, total: 1, totalPages: 1 },
      });
    }

    const user = await requireUser();

    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = listProjectsSchema.safeParse(params);

    if (!query.success) {
      return validationFailed(query.error);
    }

    const result = await listProjects(user.id, query.data);

    return ok({
      projects: result.projects,
      pagination: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.perPage)),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.message, error.status);
    }
    return serverError(error, "GET /api/projects");
  }
}

/** POST /api/projects — create a project owned by the signed-in user. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const parsed = createProjectSchema.safeParse(payload);
    if (!parsed.success) {
      return validationFailed(parsed.error);
    }

    const input = parsed.data;

    // Slugs are derived from the name, never accepted from the client, so a
    // user cannot claim a reserved or another project's slug.
    const slug = await uniqueSlug(input.name, slugExists);

    // New projects join the team the user already belongs to, so colleagues
    // can see them without a separate sharing step.
    const membership = await db.teamMember.findFirst({
      where: { userId: user.id },
      select: { teamId: true },
      orderBy: { createdAt: "asc" },
    });

    const project = await db.project.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? null,
        framework: input.framework ?? null,
        status: input.status,
        productionUrl: input.productionUrl ?? null,
        repositoryUrl: input.repositoryUrl ?? null,
        githubRepository: input.githubRepository ?? null,
        isPublic: input.isPublic ?? false,
        ownerId: user.id,
        teamId: membership?.teamId ?? null,
      },
    });

    await recordActivity({
      type: ActivityType.PROJECT_CREATED,
      message: `Created project ${project.name}`,
      userId: user.id,
      projectId: project.id,
      teamId: project.teamId,
    });

    return created({ project });
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.message, error.status);
    }
    return serverError(error, "POST /api/projects");
  }
}
