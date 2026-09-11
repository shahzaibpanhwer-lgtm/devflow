import { TeamRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { PROJECT_PERMISSIONS, roleAtLeast } from "@/lib/roles";
import { canChangeRole, canInvite, canRemoveMember } from "@/lib/team-rules";

/**
 * Authorisation rules.
 *
 * These are the tests that matter most in this suite: every one of them
 * describes something a user must not be able to do. A regression here is a
 * privilege escalation, not a cosmetic bug, so each case is written as the
 * attack it prevents rather than as a property of the function.
 */

const OWNER = { id: "user-owner", role: TeamRole.OWNER };
const ADMIN = { id: "user-admin", role: TeamRole.ADMIN };
const DEVELOPER = { id: "user-dev", role: TeamRole.DEVELOPER };
const VIEWER = { id: "user-viewer", role: TeamRole.VIEWER };

describe("roleAtLeast", () => {
  it("ranks the four roles in ascending privilege", () => {
    expect(roleAtLeast(TeamRole.OWNER, TeamRole.ADMIN)).toBe(true);
    expect(roleAtLeast(TeamRole.ADMIN, TeamRole.DEVELOPER)).toBe(true);
    expect(roleAtLeast(TeamRole.DEVELOPER, TeamRole.VIEWER)).toBe(true);
  });

  it("does not let a lower role satisfy a higher requirement", () => {
    expect(roleAtLeast(TeamRole.VIEWER, TeamRole.DEVELOPER)).toBe(false);
    expect(roleAtLeast(TeamRole.DEVELOPER, TeamRole.ADMIN)).toBe(false);
    expect(roleAtLeast(TeamRole.ADMIN, TeamRole.OWNER)).toBe(false);
  });

  it("treats a role as satisfying its own requirement", () => {
    for (const role of [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.DEVELOPER, TeamRole.VIEWER]) {
      expect(roleAtLeast(role, role)).toBe(true);
    }
  });
});

describe("project permissions", () => {
  it("requires a higher role to delete a project than to update one", () => {
    expect(roleAtLeast(TeamRole.DEVELOPER, PROJECT_PERMISSIONS.update)).toBe(true);
    expect(roleAtLeast(TeamRole.DEVELOPER, PROJECT_PERMISSIONS.delete)).toBe(false);
  });

  it("keeps API keys behind the admin role", () => {
    expect(roleAtLeast(TeamRole.DEVELOPER, PROJECT_PERMISSIONS.manageKeys)).toBe(false);
    expect(roleAtLeast(TeamRole.ADMIN, PROJECT_PERMISSIONS.manageKeys)).toBe(true);
  });

  it("lets a viewer read but nothing more", () => {
    expect(roleAtLeast(TeamRole.VIEWER, PROJECT_PERMISSIONS.view)).toBe(true);
    expect(roleAtLeast(TeamRole.VIEWER, PROJECT_PERMISSIONS.update)).toBe(false);
    expect(roleAtLeast(TeamRole.VIEWER, PROJECT_PERMISSIONS.deploy)).toBe(false);
  });
});

describe("canChangeRole", () => {
  it("refuses anyone changing their own role", () => {
    // Self-promotion is the shortest path to escalation, and an owner
    // demoting themselves can strand a team with no owner at all.
    const result = canChangeRole({
      actorRole: OWNER.role,
      actorUserId: OWNER.id,
      targetRole: OWNER.role,
      targetUserId: OWNER.id,
      nextRole: TeamRole.VIEWER,
    });

    expect(result.allowed).toBe(false);
  });

  it("refuses an admin demoting the owner", () => {
    const result = canChangeRole({
      actorRole: ADMIN.role,
      actorUserId: ADMIN.id,
      targetRole: OWNER.role,
      targetUserId: OWNER.id,
      nextRole: TeamRole.VIEWER,
    });

    expect(result.allowed).toBe(false);
  });

  it("refuses granting a role above the actor's own", () => {
    // Otherwise an admin could promote a colleague to owner and inherit that
    // authority through them.
    const result = canChangeRole({
      actorRole: ADMIN.role,
      actorUserId: ADMIN.id,
      targetRole: VIEWER.role,
      targetUserId: VIEWER.id,
      nextRole: TeamRole.OWNER,
    });

    expect(result.allowed).toBe(false);
  });

  it("refuses a developer changing anyone's role", () => {
    const result = canChangeRole({
      actorRole: DEVELOPER.role,
      actorUserId: DEVELOPER.id,
      targetRole: VIEWER.role,
      targetUserId: VIEWER.id,
      nextRole: TeamRole.ADMIN,
    });

    expect(result.allowed).toBe(false);
  });

  it("allows an admin to move a developer to viewer", () => {
    const result = canChangeRole({
      actorRole: ADMIN.role,
      actorUserId: ADMIN.id,
      targetRole: DEVELOPER.role,
      targetUserId: DEVELOPER.id,
      nextRole: TeamRole.VIEWER,
    });

    expect(result.allowed).toBe(true);
  });

  it("explains a refusal rather than only reporting one", () => {
    const result = canChangeRole({
      actorRole: VIEWER.role,
      actorUserId: VIEWER.id,
      targetRole: DEVELOPER.role,
      targetUserId: DEVELOPER.id,
      nextRole: TeamRole.ADMIN,
    });

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });
});

describe("canRemoveMember", () => {
  it("refuses removing yourself", () => {
    const result = canRemoveMember({
      actorRole: ADMIN.role,
      actorUserId: ADMIN.id,
      targetRole: ADMIN.role,
      targetUserId: ADMIN.id,
    });

    expect(result.allowed).toBe(false);
  });

  it("refuses removing the owner, even as an admin", () => {
    const result = canRemoveMember({
      actorRole: ADMIN.role,
      actorUserId: ADMIN.id,
      targetRole: OWNER.role,
      targetUserId: OWNER.id,
    });

    expect(result.allowed).toBe(false);
  });

  it("refuses an admin removing another admin", () => {
    // A lateral removal leaves no record of who authorised it, so it is
    // reserved for the owner.
    const result = canRemoveMember({
      actorRole: ADMIN.role,
      actorUserId: ADMIN.id,
      targetRole: TeamRole.ADMIN,
      targetUserId: "user-other-admin",
    });

    expect(result.allowed).toBe(false);
  });

  it("allows the owner to remove an admin", () => {
    const result = canRemoveMember({
      actorRole: OWNER.role,
      actorUserId: OWNER.id,
      targetRole: ADMIN.role,
      targetUserId: ADMIN.id,
    });

    expect(result.allowed).toBe(true);
  });

  it("refuses a developer removing a viewer", () => {
    const result = canRemoveMember({
      actorRole: DEVELOPER.role,
      actorUserId: DEVELOPER.id,
      targetRole: VIEWER.role,
      targetUserId: VIEWER.id,
    });

    expect(result.allowed).toBe(false);
  });
});

describe("canInvite", () => {
  it("allows admins and owners only", () => {
    expect(canInvite(TeamRole.OWNER).allowed).toBe(true);
    expect(canInvite(TeamRole.ADMIN).allowed).toBe(true);
    expect(canInvite(TeamRole.DEVELOPER).allowed).toBe(false);
    expect(canInvite(TeamRole.VIEWER).allowed).toBe(false);
  });
});
