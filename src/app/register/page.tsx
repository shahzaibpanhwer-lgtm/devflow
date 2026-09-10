import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { GithubButton } from "@/components/auth/github-button";
import { RegisterForm } from "@/components/auth/register-form";
import { Separator } from "@/components/ui/separator";
import { isGithubConfigured } from "@/lib/auth.config";
import { safeCallbackUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a DevFlow account and start managing your projects.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const target = safeCallbackUrl(params.callbackUrl);

  return (
    <AuthShell
      title="Create your account"
      description="Start managing projects, deployments and APIs from one workspace."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm callbackUrl={target} />

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-text-tertiary text-xs">or</span>
        <Separator className="flex-1" />
      </div>

      <GithubButton
        configured={isGithubConfigured}
        callbackUrl={target}
        label="Sign up with GitHub"
      />
    </AuthShell>
  );
}
