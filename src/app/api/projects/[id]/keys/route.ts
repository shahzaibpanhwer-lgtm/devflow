import { ActivityType } from "@prisma/client";

import { recordActivity } from "@/lib/activity";
import { badRequest, created, fail, ok, serverError, validationFailed } from "@/lib/api-response";
import { AuthError, PROJECT_PERMISSIONS, requireProjectAccess, requireUser } from "@/lib/authz";
import { generateKey, listProjectKeys } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { createApiKeySchema } from "@/lib/validations/api-key";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/projects/[id]/keys — keys for a project, never their secrets. */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireProjectAccess(id, user.id, PROJECT_PERMISSIONS.manageKeys);

    return ok({ keys: await listProjectKeys(id) });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return serverError(error, "GET /api/projects/[id]/keys");
  }
}

/** POST /api/projects/[id]/keys — issue a key. The secret is returned once. */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Issuing credentials is an admin action, not a developer one.
    const access = await requireProjectAccess(id, user.id, PROJECT_PERMISSIONS.manageKeys);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const parsed = createApiKeySchema.safeParse(payload);
    if (!parsed.success) {
      return validationFailed(parsed.error);
    }

    const project = await db.project.findUnique({
      where: { id: access.projectId },
      select: { id: true, name: true, teamId: true },
    });
    if (!project) return fail("Project not found", 404);

    const issued = generateKey();

    const expiresAt = parsed.data.expiresInDays
      ? new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const key = await db.apiKey.create({
      data: {
        projectId: project.id,
        userId: user.id,
        name: parsed.data.name,
        hashedKey: issued.hashedKey,
        prefix: issued.prefix,
        lastFour: issued.lastFour,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastFour: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    await recordActivity({
      type: ActivityType.API_KEY_CREATED,
      message: `Generated an API key for ${project.name}`,
      userId: user.id,
      projectId: project.id,
      teamId: project.teamId,
      metadata: { keyName: key.name },
    });

    /*
     * The only moment the plaintext exists outside the caller's request. It is
     * not stored, not logged, and cannot be retrieved again.
     */
    return created({ key, plaintext: issued.plaintext });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return serverError(error, "POST /api/projects/[id]/keys");
  }
}
