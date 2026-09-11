import { TeamRole } from "@prisma/client";

import { auth } from "@/lib/auth";
import { AuthError, PROJECT_PERMISSIONS, roleAtLeast } from "@/lib/roles";

// Re-exported so existing importers are unaffected by the split.
export { AuthError, PROJECT_PERMISSIONS, roleAtLeast };
import { db } from "@/lib/db";

/**
 * Server-side authorisation.
 *
 * Nothing here trusts the client. Route handlers and server components call
 * these helpers to establish *both* that a caller is signed in and that they
 * hold a role permitting the action — the UI hiding a button is a courtesy,
 * never the boundary.
 */

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

/** Resolves the signed-in user or throws a 401-shaped error. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.email) {
    throw new AuthError("You must be signed in to do that", 401);
  }

  return { id: user.id, email: user.email, name: user.name ?? null };
}

export type ProjectAccess = {
  projectId: string;
  /** True when the caller owns the project record outright. */
  isOwner: boolean;
  /** The caller's role in the project's team, if it belongs to one. */
  teamRole: TeamRole | null;
  /** Effective role, combining direct ownership and team membership. */
  effectiveRole: TeamRole;
};

/**
 * Establishes what a user may do with a project.
 *
 * Returns null when the project does not exist *or* the user has no
 * relationship to it. Both cases are reported to the caller as 404 so the
 * endpoint never confirms the existence of a project the user cannot see.
 */
export async function getProjectAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccess | null> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
      teamId: true,
    },
  });

  if (!project) {
    return null;
  }

  const isOwner = project.ownerId === userId;

  const membership = project.teamId
    ? await db.teamMember.findUnique({
        where: { teamId_userId: { teamId: project.teamId, userId } },
        select: { role: true },
      })
    : null;

  if (!isOwner && !membership) {
    return null;
  }

  // Owning the record confers full rights regardless of team role.
  const effectiveRole = isOwner ? TeamRole.OWNER : (membership?.role ?? TeamRole.VIEWER);

  return {
    projectId: project.id,
    isOwner,
    teamRole: membership?.role ?? null,
    effectiveRole,
  };
}

/**
 * Asserts the caller may act on a project at the required privilege level.
 * Throws AuthError(404) when they cannot see it, AuthError(403) when they can
 * see it but lack the role.
 */
export async function requireProjectAccess(
  projectId: string,
  userId: string,
  required: TeamRole = TeamRole.VIEWER,
): Promise<ProjectAccess> {
  const access = await getProjectAccess(projectId, userId);

  if (!access) {
    throw new AuthError("Project not found", 404);
  }

  if (!roleAtLeast(access.effectiveRole, required)) {
    throw new AuthError("You do not have permission to do that", 403);
  }

  return access;
}
