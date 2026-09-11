import "server-only";

import { TeamRole } from "@prisma/client";

import { AuthError, roleAtLeast } from "@/lib/authz";
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

/**
 * Rules that hold regardless of who is asking. Returning a reason rather than
 * a boolean means the caller can tell the user *why* rather than just "no".
 */
export type RuleResult = { allowed: true } | { allowed: false; reason: string };

const ALLOWED: RuleResult = { allowed: true };

function denied(reason: string): RuleResult {
  return { allowed: false, reason };
}

export function canChangeRole(params: {
  actorRole: TeamRole;
  actorUserId: string;
  targetRole: TeamRole;
  targetUserId: string;
  nextRole: TeamRole;
}): RuleResult {
  const { actorRole, actorUserId, targetRole, targetUserId, nextRole } = params;

  // Changing your own role is how privilege escalation starts, and an owner
  // demoting themselves can strand a team with no owner at all.
  if (actorUserId === targetUserId) {
    return denied("You cannot change your own role");
  }

  if (!roleAtLeast(actorRole, TeamRole.ADMIN)) {
    return denied("Only admins and owners can change roles");
  }

  // The owner is the account of record for the team; an admin must not be
  // able to demote the person who can remove them.
  if (targetRole === TeamRole.OWNER) {
    return denied("The owner's role cannot be changed");
  }

  // Nobody may grant a role above their own, or an admin could promote a
  // colleague to owner and inherit that authority through them.
  if (!roleAtLeast(actorRole, nextRole)) {
    return denied("You cannot grant a role above your own");
  }

  return ALLOWED;
}

export function canRemoveMember(params: {
  actorRole: TeamRole;
  actorUserId: string;
  targetRole: TeamRole;
  targetUserId: string;
}): RuleResult {
  const { actorRole, actorUserId, targetRole, targetUserId } = params;

  if (actorUserId === targetUserId) {
    return denied("You cannot remove yourself from the team");
  }

  if (!roleAtLeast(actorRole, TeamRole.ADMIN)) {
    return denied("Only admins and owners can remove members");
  }

  if (targetRole === TeamRole.OWNER) {
    return denied("The owner cannot be removed from the team");
  }

  // An admin removing another admin is a lateral move that leaves no trace of
  // who authorised it; only an owner may do it.
  if (targetRole === TeamRole.ADMIN && actorRole !== TeamRole.OWNER) {
    return denied("Only the owner can remove an admin");
  }

  return ALLOWED;
}

export function canInvite(actorRole: TeamRole): RuleResult {
  return roleAtLeast(actorRole, TeamRole.ADMIN)
    ? ALLOWED
    : denied("Only admins and owners can invite members");
}
