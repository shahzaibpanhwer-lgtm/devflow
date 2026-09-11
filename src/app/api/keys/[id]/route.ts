import { ActivityType } from "@prisma/client";

import { recordActivity } from "@/lib/activity";
import { fail, ok, serverError } from "@/lib/api-response";
import { AuthError, PROJECT_PERMISSIONS, requireProjectAccess, requireUser } from "@/lib/authz";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/keys/[id] — revoke a key.
 *
 * The row is kept and stamped with revokedAt rather than deleted, so the
 * audit trail still shows the key existed and when it stopped working.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const key = await db.apiKey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        revokedAt: true,
        project: { select: { id: true, name: true, teamId: true } },
      },
    });

    if (!key) return fail("API key not found", 404);

    // Authorisation follows the parent project, not the key row.
    await requireProjectAccess(key.project.id, user.id, PROJECT_PERMISSIONS.manageKeys);

    if (key.revokedAt) {
      return ok({ revoked: true, id: key.id, alreadyRevoked: true });
    }

    await db.apiKey.update({ where: { id: key.id }, data: { revokedAt: new Date() } });

    await recordActivity({
      type: ActivityType.API_KEY_REVOKED,
      message: `Revoked API key "${key.name}" for ${key.project.name}`,
      userId: user.id,
      projectId: key.project.id,
      teamId: key.project.teamId,
      metadata: { keyName: key.name },
    });

    return ok({ revoked: true, id: key.id });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return serverError(error, "DELETE /api/keys/[id]");
  }
}
