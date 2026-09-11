import { TeamRole } from "@prisma/client";

import { roleAtLeast } from "@/lib/roles";

/**
 * Who may change team membership, and why.
 *
 * Free of session and database imports. These rules decide whether an action
 * is permitted given two roles and two user ids — nothing else — so they can
 * be tested directly, without a server runtime or a database. For rules whose
 * job is preventing privilege escalation, that testability is the point.
 *
 * The reasoning behind each rule is recorded beside the check that enforces
 * it, because a bare condition tells a later reader what is blocked but not
 * what would go wrong if it were not.
 */

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
