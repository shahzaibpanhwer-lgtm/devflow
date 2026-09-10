import { auth } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

/**
 * Resolves the signed-in user from the Auth.js session.
 *
 * Returns null when there is no session. Route protection lives in middleware,
 * so callers inside /dashboard can treat null as "should not happen" and
 * redirect defensively rather than rendering a signed-out state.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.email) {
    return null;
  }

  return {
    id: user.id,
    // GitHub accounts without a display name fall back to the local part of
    // the address so the interface never renders an empty avatar or greeting.
    name: user.name ?? user.email.split("@")[0] ?? "there",
    email: user.email,
    image: user.image ?? null,
  };
}
