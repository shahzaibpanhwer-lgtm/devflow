"use client";

import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { GithubMark } from "@/components/devflow/github-mark";
import { Button } from "@/components/ui/button";

type GithubConnectionCardProps = {
  /** GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are present on the server. */
  configured: boolean;
  /** This user has a stored GitHub access token. */
  connected: boolean;
  /** GitHub login of the connected account, when known. */
  accountLogin: string | null;
};

export function GithubConnectionCard({
  configured,
  connected,
  accountLogin,
}: GithubConnectionCardProps) {
  const [pending, setPending] = useState(false);

  async function connect() {
    setPending(true);
    try {
      await signIn("github", { callbackUrl: "/dashboard/settings" });
    } catch {
      setPending(false);
      toast.error("Could not reach GitHub. Please try again.");
    }
  }

  return (
    <section className="border-line bg-surface-1 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <GithubMark className="size-4" />
            GitHub
          </h2>
          <p className="text-text-secondary mt-1.5 max-w-md text-sm text-pretty">
            Connect your account to link repositories to projects and see commits, pull requests and
            issues without leaving DevFlow.
          </p>
        </div>

        {!configured ? null : connected ? (
          <span className="text-status-success inline-flex shrink-0 items-center gap-1.5 text-sm">
            <CheckCircle2Icon className="size-4" aria-hidden="true" />
            Connected
          </span>
        ) : (
          <Button size="sm" onClick={connect} disabled={pending} className="shrink-0">
            {pending ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <GithubMark className="size-3.5" />
            )}
            Connect GitHub
          </Button>
        )}
      </div>

      {!configured ? (
        /*
         * Stating the missing variables outright is more useful than a dead
         * button — this is the one thing a reader can act on.
         */
        <div className="border-line bg-surface-2 text-text-secondary mt-4 rounded-md border border-dashed p-3 text-xs">
          <p>GitHub integration is not configured on this server. To enable it, set:</p>
          <ul className="mt-2 space-y-1 font-mono">
            <li>GITHUB_CLIENT_ID</li>
            <li>GITHUB_CLIENT_SECRET</li>
          </ul>
          <p className="mt-2">
            Create an OAuth App at github.com/settings/developers with the callback URL{" "}
            <span className="font-mono">/api/auth/callback/github</span>.
          </p>
        </div>
      ) : connected && accountLogin ? (
        <p className="text-text-tertiary mt-3 font-mono text-xs">Signed in as {accountLogin}</p>
      ) : null}
    </section>
  );
}
