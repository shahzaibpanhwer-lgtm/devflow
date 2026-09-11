import { ok } from "@/lib/api-response";
import { requireUser } from "@/lib/authz";
import { respondToGithubFailure } from "@/lib/github/respond";
import { listUserRepositories } from "@/lib/github/repositories";

/** GET /api/github/repositories — repositories available to connect. */
export async function GET() {
  try {
    const user = await requireUser();
    const repositories = await listUserRepositories(user.id);

    // Only the fields the picker renders; the raw payload is far larger and
    // carries account details the browser has no reason to receive.
    return ok({
      repositories: repositories.map((repository) => ({
        id: repository.id,
        fullName: repository.full_name,
        name: repository.name,
        description: repository.description,
        language: repository.language,
        stars: repository.stargazers_count,
        isPrivate: repository.private,
        isFork: repository.fork,
        pushedAt: repository.pushed_at,
      })),
    });
  } catch (error) {
    return respondToGithubFailure(error, "GET /api/github/repositories");
  }
}
