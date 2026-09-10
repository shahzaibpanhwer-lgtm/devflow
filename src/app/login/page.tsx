import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { GithubButton } from "@/components/auth/github-button";
import { LoginForm } from "@/components/auth/login-form";
import { Separator } from "@/components/ui/separator";
import { isGithubConfigured } from "@/lib/auth.config";
import { safeCallbackUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your DevFlow workspace.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;

  const target = safeCallbackUrl(params.callbackUrl);

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Sign in to continue to your workspace."
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link href="/register" className="text-foreground font-medium hover:underline">
            Create one
          </Link>
        </>
      }
    >
      {params.error ? (
        <div
          role="alert"
          className="border-status-danger/25 bg-status-danger/10 text-status-danger mb-4 rounded-md border px-3 py-2.5 text-sm"
        >
          {params.error === "OAuthAccountNotLinked"
            ? "That email is already registered with a password. Sign in with your password instead."
            : "Sign-in failed. Please try again."}
        </div>
      ) : null}

      <LoginForm callbackUrl={target} />

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-text-tertiary text-xs">or</span>
        <Separator className="flex-1" />
      </div>

      <GithubButton configured={isGithubConfigured} callbackUrl={target} />
    </AuthShell>
  );
}
