import { fail, ok, serverError } from "@/lib/api-response";
import { AuthError, PROJECT_PERMISSIONS, requireProjectAccess, requireUser } from "@/lib/authz";
import { getDeployment } from "@/lib/deployments";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/deployments/[id] — one deployment with its build log.
 *
 * The interface polls this while a deployment is in flight, which is why the
 * payload stays small and the authorisation check runs on every call rather
 * than being cached.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const deployment = await getDeployment(id);
    if (!deployment) {
      return fail("Deployment not found", 404);
    }

    // Access is decided by the parent project, not the deployment row.
    await requireProjectAccess(deployment.project.id, user.id, PROJECT_PERMISSIONS.view);

    return ok({ deployment });
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return serverError(error, "GET /api/deployments/[id]");
  }
}
