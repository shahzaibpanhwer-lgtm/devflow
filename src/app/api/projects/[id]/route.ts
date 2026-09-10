import { ActivityType } from "@prisma/client";

import { recordActivity } from "@/lib/activity";
import { badRequest, fail, ok, serverError, validationFailed } from "@/lib/api-response";
import { AuthError, PROJECT_PERMISSIONS, requireProjectAccess, requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { getProjectDetail } from "@/lib/projects";
import { updateProjectSchema } from "@/lib/validations/project";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/projects/[id] */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await requireProjectAccess(id, user.id, PROJECT_PERMISSIONS.view);

    const project = await getProjectDetail(id);
    if (!project) {
      return fail("Project not found", 404);
    }

    return ok({ project });
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.message, error.status);
    }
    return serverError(error, "GET /api/projects/[id]");
  }
}

/** PATCH /api/projects/[id] — requires at least the developer role. */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const access = await requireProjectAccess(id, user.id, PROJECT_PERMISSIONS.update);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const parsed = updateProjectSchema.safeParse(payload);
    if (!parsed.success) {
      return validationFailed(parsed.error);
    }

    const input = parsed.data;

    // The slug is intentionally immutable: it is the public URL at /p/[slug],
    // and silently changing it would break links already shared.
    const project = await db.project.update({
      where: { id: access.projectId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.framework !== undefined ? { framework: input.framework } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.productionUrl !== undefined ? { productionUrl: input.productionUrl } : {}),
        ...(input.repositoryUrl !== undefined ? { repositoryUrl: input.repositoryUrl } : {}),
        ...(input.githubRepository !== undefined
          ? { githubRepository: input.githubRepository }
          : {}),
      },
    });

    await recordActivity({
      type: ActivityType.PROJECT_UPDATED,
      message: `Updated project settings for ${project.name}`,
      userId: user.id,
      projectId: project.id,
      teamId: project.teamId,
      metadata: { fields: Object.keys(input) },
    });

    return ok({ project });
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.message, error.status);
    }
    return serverError(error, "PATCH /api/projects/[id]");
  }
}

/** DELETE /api/projects/[id] — requires at least the admin role. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const access = await requireProjectAccess(id, user.id, PROJECT_PERMISSIONS.delete);

    const project = await db.project.findUnique({
      where: { id: access.projectId },
      select: { id: true, name: true, teamId: true },
    });

    if (!project) {
      return fail("Project not found", 404);
    }

    // Deployments, keys, docs and repository rows cascade with the project.
    // The activity entry is written first so it survives the deletion, since
    // Activity.projectId is set to cascade too.
    await recordActivity({
      type: ActivityType.PROJECT_DELETED,
      message: `Deleted project ${project.name}`,
      userId: user.id,
      teamId: project.teamId,
      metadata: { projectName: project.name },
    });

    await db.project.delete({ where: { id: project.id } });

    return ok({ deleted: true, id: project.id });
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.message, error.status);
    }
    return serverError(error, "DELETE /api/projects/[id]");
  }
}
