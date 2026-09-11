import { z } from "zod";

import { badRequest, ok, validationFailed } from "@/lib/api-response";
import { PROJECT_PERMISSIONS, requireProjectAccess, requireUser } from "@/lib/authz";
import { respondToGithubFailure } from "@/lib/github/respond";
import { disconnectRepository, syncRepository } from "@/lib/github/sync";

type RouteContext = { params: Promise<{ id: string }> };

const connectSchema = z.object({
  fullName: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
      'Use the "owner/repository" format, e.g. vercel/next.js',
    ),
});

/** PUT /api/projects/[id]/repository — connect or refresh the repository. */
export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireProjectAccess(id, user.id, PROJECT_PERMISSIONS.update);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const parsed = connectSchema.safeParse(payload);
    if (!parsed.success) {
      return validationFailed(parsed.error);
    }

    const repository = await syncRepository({
      userId: user.id,
      projectId: id,
      fullName: parsed.data.fullName,
      announce: true,
    });

    // githubId is a BigInt, which JSON.stringify refuses to serialise.
    return ok({ repository: { ...repository, githubId: repository.githubId?.toString() ?? null } });
  } catch (error) {
    return respondToGithubFailure(error, "PUT /api/projects/[id]/repository");
  }
}

/** DELETE /api/projects/[id]/repository — detach the repository. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireProjectAccess(id, user.id, PROJECT_PERMISSIONS.update);

    await disconnectRepository({ userId: user.id, projectId: id });

    return ok({ disconnected: true });
  } catch (error) {
    return respondToGithubFailure(error, "DELETE /api/projects/[id]/repository");
  }
}
