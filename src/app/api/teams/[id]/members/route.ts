import { ActivityType, TeamRole } from "@prisma/client";

import { recordActivity } from "@/lib/activity";
import { badRequest, created, fail, ok, serverError, validationFailed } from "@/lib/api-response";
import { AuthError, requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { canInvite, listMembers, requireTeamRole } from "@/lib/teams";
import { inviteMemberSchema } from "@/lib/validations/team";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/teams/[id]/members — anyone in the team may see who is in it. */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireTeamRole(id, user.id, TeamRole.VIEWER);

    return ok({ members: await listMembers(id) });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return serverError(error, "GET /api/teams/[id]/members");
  }
}

/**
 * POST /api/teams/[id]/members — add someone to the team by email.
 *
 * DevFlow has no outbound email, so this adds an existing account rather than
 * sending an invitation. Pretending to send one would be worse than saying so:
 * the caller would wait for a message that never arrives.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const actorRole = await requireTeamRole(id, user.id, TeamRole.VIEWER);

    const permitted = canInvite(actorRole);
    if (!permitted.allowed) {
      return fail(permitted.reason, 403);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const parsed = inviteMemberSchema.safeParse(payload);
    if (!parsed.success) {
      return validationFailed(parsed.error);
    }

    const invitee = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, name: true, email: true },
    });

    if (!invitee) {
      return fail(
        "No DevFlow account uses that email. Ask them to register first, then add them.",
        404,
        { code: "USER_NOT_FOUND" },
      );
    }

    const existing = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId: id, userId: invitee.id } },
      select: { id: true },
    });

    if (existing) {
      return fail("That person is already in this team", 409, { code: "ALREADY_MEMBER" });
    }

    const member = await db.teamMember.create({
      data: { teamId: id, userId: invitee.id, role: parsed.data.role },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    await recordActivity({
      type: ActivityType.MEMBER_INVITED,
      message: `Added ${invitee.name ?? invitee.email} to the team as ${parsed.data.role.toLowerCase()}`,
      userId: user.id,
      teamId: id,
      metadata: { memberEmail: invitee.email, role: parsed.data.role },
    });

    return created({ member });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return serverError(error, "POST /api/teams/[id]/members");
  }
}
