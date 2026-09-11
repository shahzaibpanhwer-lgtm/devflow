import "server-only";

import { TeamRole } from "@prisma/client";

import { AuthError, roleAtLeast } from "@/lib/roles";
import { canChangeRole, canInvite, canRemoveMember, type RuleResult } from "@/lib/team-rules";

// Re-exported so existing importers are unaffected by the split.
export { canChangeRole, canInvite, canRemoveMember, type RuleResult };
import { db } from "@/lib/db";

/**
 * Team membership and the rules governing who may change it.
 *
 * The rules live here rather than in the route handlers so every caller —
 * API, server component, future CLI — is bound by the same ones, and so the
 * reasoning behind each is written down next to the check that enforces it.
 */

export async function getTeamForUser(userId: string) {
  const membership = await db.teamMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          _count: { select: { members: true, projects: true } },
        },
      },
    },
  });

  return membership ? { team: membership.team, viewerRole: membership.role } : null;
}

export function listMembers(teamId: string) {
  return db.teamMember.findMany({
    where: { teamId },
    // Highest privilege first, then longest-serving.
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
}

export type TeamMemberRow = Awaited<ReturnType<typeof listMembers>>[number];

export function listTeamActivity(teamId: string, limit = 12) {
  return db.activity.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      message: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

/** Establishes the caller's role in a team, or throws. */
export async function requireTeamRole(
  teamId: string,
  userId: string,
  required: TeamRole = TeamRole.VIEWER,
): Promise<TeamRole> {
  const membership = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  });

  // A team the caller has no part in is reported as missing, never forbidden,
  // so the endpoint cannot be used to discover which teams exist.
  if (!membership) {
    throw new AuthError("Team not found", 404);
  }

  if (!roleAtLeast(membership.role, required)) {
    throw new AuthError("You do not have permission to do that", 403);
  }

  return membership.role;
}
