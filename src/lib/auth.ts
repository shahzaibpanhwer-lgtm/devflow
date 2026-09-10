import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

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
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
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
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

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
