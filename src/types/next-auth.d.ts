import type { DefaultSession } from "next-auth";

/**
 * Auth.js does not carry the user id on the session by default. The jwt and
 * session callbacks in auth.config.ts put it there, so the type is widened to
 * match — otherwise every consumer would have to cast.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
