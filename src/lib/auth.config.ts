import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

/**
 * Edge-safe half of the Auth.js configuration.
 *
 * Middleware runs on the edge runtime, where neither the Postgres driver nor
 * bcrypt can be loaded. This module therefore contains only what middleware
 * needs — no adapter, no credentials provider — and `src/lib/auth.ts` extends
 * it with the parts that require Node.
 */

/**
 * GitHub is registered only when credentials are configured. Auth.js throws at
 * startup on a provider with a missing client ID, which would take down the
 * whole sign-in page just because OAuth had not been set up yet.
 */
export const isGithubConfigured = Boolean(
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
);

export const authConfig = {
  providers: isGithubConfigured
    ? [
        GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          // Repository scope powers the GitHub integration.
          authorization: { params: { scope: "read:user user:email repo" } },
          /*
           * PKCE alone would cover this — the code verifier is held in a
           * cookie bound to the browser that began the flow, so a code
           * obtained elsewhere cannot be redeemed against this session. State
           * is added anyway: it costs one parameter and one cookie, and it is
           * what the OAuth security guidance asks for by name.
           */
          checks: ["pkce", "state"],
        }),
      ]
    : [],

  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/dashboard",
  },

  session: {
    // Required by the credentials provider, which cannot use database sessions.
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    /**
     * Gate for middleware. Returning false redirects to the sign-in page;
     * returning a Response takes precedence over everything else.
     */
    authorized({ auth, request }) {
      const signedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;

      const isDashboard = pathname.startsWith("/dashboard");
      const isAuthPage = pathname === "/login" || pathname === "/register";

      if (isDashboard) {
        return signedIn;
      }

      // Never leave a signed-in user staring at the login form.
      if (isAuthPage && signedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true;
    },

    jwt({ token, user }) {
      // `user` is only present on the request that established the session.
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    session({ session, token }) {
      if (token.id && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },

  trustHost: true,
} satisfies NextAuthConfig;
