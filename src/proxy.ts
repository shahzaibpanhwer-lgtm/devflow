import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

/**
 * Route protection, so an unauthenticated request never reaches a dashboard
 * segment at all. Next 16 replaced the `middleware` file convention with
 * `proxy`; the behaviour is unchanged.
 *
 * Only the edge-safe half of the Auth.js configuration is used here — the
 * Prisma adapter and bcrypt cannot be loaded in the edge runtime.
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    /*
     * Everything except Auth.js's own endpoints, Next internals and static
     * assets. The `authorized` callback decides what actually needs a session.
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
