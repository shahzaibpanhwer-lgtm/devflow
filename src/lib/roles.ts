import { TeamRole } from "@prisma/client";

/**
 * The role hierarchy and the errors authorisation raises.
 *
 * Deliberately free of session and database imports. These are pure decisions
 * about who may do what, and keeping them separable means they can be tested
 * directly — without a server runtime, a session, or a database — which is
 * exactly what you want for the rules that stop privilege escalation.
 */

/** Ascending privilege. A role satisfies any requirement at or below its rank. */
const ROLE_RANK: Record<TeamRole, number> = {
  VIEWER: 0,
  DEVELOPER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function roleAtLeast(role: TeamRole, required: TeamRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 | 404,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Minimum role required for each project action. */
export const PROJECT_PERMISSIONS = {
  view: TeamRole.VIEWER,
  update: TeamRole.DEVELOPER,
  deploy: TeamRole.DEVELOPER,
  delete: TeamRole.ADMIN,
  manageKeys: TeamRole.ADMIN,
} as const satisfies Record<string, TeamRole>;
