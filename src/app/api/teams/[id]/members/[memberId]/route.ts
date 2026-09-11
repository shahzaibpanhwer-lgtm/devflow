import { ActivityType, TeamRole } from "@prisma/client";

import { recordActivity } from "@/lib/activity";
import { badRequest, fail, ok, serverError, validationFailed } from "@/lib/api-response";
import { AuthError, requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { canChangeRole, canRemoveMember, requireTeamRole } from "@/lib/teams";
import { changeRoleSchema } from "@/lib/validations/team";

type RouteContext = { params: Promise<{ id: string; memberId: string }> };

/** Loads the membership being acted on, scoped to the team in the path. */
async function loadTarget(teamId: string, memberId: string) {
  return db.teamMember.findFirst({
    where: { id: memberId, teamId },
    select: {
      id: true,
      role: true,
      userId: true,
      user: { select: { name: true, email: true } },
    },
  });
}

/** PATCH /api/teams/[id]/members/[memberId] — change a member's role. */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id, memberId } = await params;
    const actorRole = await requireTeamRole(id, user.id, TeamRole.VIEWER);

    const target = await loadTarget(id, memberId);
    if (!target) return fail("Member not found", 404);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const parsed = changeRoleSchema.safeParse(payload);
    if (!parsed.success) {
      return validationFailed(parsed.error);
    }

    const verdict = canChangeRole({
      actorRole,
      actorUserId: user.id,
      targetRole: target.role,
      targetUserId: target.userId,
      nextRole: parsed.data.role,
    });

    if (!verdict.allowed) {
      return fail(verdict.reason, 403);
    }

    if (target.role === parsed.data.role) {
      return ok({ member: target, unchanged: true });
    }

    const member = await db.teamMember.update({
      where: { id: target.id },
      data: { role: parsed.data.role },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    await recordActivity({
      type: ActivityType.MEMBER_ROLE_CHANGED,
      message: `Changed ${target.user.name ?? target.user.email}'s role to ${parsed.data.role.toLowerCase()}`,
      userId: user.id,
      teamId: id,
      metadata: { from: target.role, to: parsed.data.role },
    });

    return ok({ member });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return serverError(error, "PATCH /api/teams/[id]/members/[memberId]");
  }
}

/** DELETE /api/teams/[id]/members/[memberId] — remove a member. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id, memberId } = await params;
    const actorRole = await requireTeamRole(id, user.id, TeamRole.VIEWER);

    const target = await loadTarget(id, memberId);
    if (!target) return fail("Member not found", 404);

    const verdict = canRemoveMember({
      actorRole,
      actorUserId: user.id,
      targetRole: target.role,
      targetUserId: target.userId,
    });

    if (!verdict.allowed) {
      return fail(verdict.reason, 403);
    }

    await db.teamMember.delete({ where: { id: target.id } });

    await recordActivity({
      type: ActivityType.MEMBER_REMOVED,
      message: `Removed ${target.user.name ?? target.user.email} from the team`,
      userId: user.id,
      teamId: id,
      metadata: { memberEmail: target.user.email, role: target.role },
    });

    return ok({ removed: true, id: target.id });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return serverError(error, "DELETE /api/teams/[id]/members/[memberId]");
  }
}
