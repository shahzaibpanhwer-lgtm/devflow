import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { checkRateLimit, clearRateLimit, clientIdentifier, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations/auth";

/**
 * Failed sign-in attempts allowed per address, per window.
 *
 * Only failures count, so signing in normally never approaches the limit
 * however often you do it. Ten leaves room for genuinely forgetting which
 * password you used while making an online guessing attack pointless.
 */
const SIGN_IN_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

/**
 * Full Auth.js configuration — the edge-safe base plus the pieces that need
 * Node: the Prisma adapter and the credentials provider.
 *
 * Sessions are JWT-backed because the credentials provider cannot use database
 * sessions. The adapter is still present so OAuth sign-ins persist their
 * Account and User rows.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        /*
         * Throttled per address, counting failures only.
         *
         * Without this the endpoint will compare as many passwords as anyone
         * cares to send it, which is the whole of an online guessing attack.
         * The registration and key-creation endpoints were already limited;
         * this one, the most obvious target of the three, was not.
         *
         * Auth.js reports a throw from here with the same code it uses for a
         * server-side failure, so the form cannot word the two differently.
         * That costs nothing in secrecy — anyone who has just sent ten wrong
         * passwords can infer they are being throttled — but it does mean the
         * shared message must not promise a timeframe. It does not.
         */
        const limitKey = `login:${clientIdentifier(request)}`;
        const allowance = checkRateLimit(limitKey, SIGN_IN_RATE_LIMIT.limit);
        if (!allowance.allowed) {
          throw new Error(
            `Too many failed sign-in attempts. Try again in ${allowance.retryAfter} seconds.`,
          );
        }

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          rateLimit(limitKey, SIGN_IN_RATE_LIMIT);
          return null;
        }

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            passwordHash: true,
          },
        });

        // A GitHub-only account has no password to compare against. Run a
        // throwaway hash anyway so the response time does not reveal whether
        // the address exists.
        if (!user?.passwordHash) {
          await bcrypt.compare(
            password,
            "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva",
          );
          rateLimit(limitKey, SIGN_IN_RATE_LIMIT);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          rateLimit(limitKey, SIGN_IN_RATE_LIMIT);
          return null;
        }

        // Cleared on the way in, so earlier fumbles do not count against a
        // session that ended up being legitimate.
        clearRateLimit(limitKey);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
});
