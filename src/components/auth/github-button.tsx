"use client";

import { Loader2Icon } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

import { GithubMark } from "@/components/devflow/github-mark";
import { Button } from "@/components/ui/button";

type GithubButtonProps = {
  /** False when GITHUB_CLIENT_ID / SECRET are not configured on the server. */
  configured: boolean;
  callbackUrl: string;
  label?: string;
};

export function GithubButton({
  configured,
  callbackUrl,
  label = "Continue with GitHub",
}: GithubButtonProps) {
  const [pending, setPending] = useState(false);

  if (!configured) {
    // Rendering a button that cannot work would be a dead control, so the
    // reason is stated plainly instead.
    return (
      <div className="border-line bg-surface-1 text-text-tertiary rounded-md border border-dashed px-3 py-2.5 text-center text-xs">
        GitHub sign-in is unavailable — <code className="font-mono">GITHUB_CLIENT_ID</code> and{" "}
        <code className="font-mono">GITHUB_CLIENT_SECRET</code> are not configured.
      </div>
    );
  }

  async function handleClick() {
    setPending(true);
    try {
      await signIn("github", { callbackUrl });
    } catch {
      setPending(false);
      toast.error("Could not reach GitHub. Please try again.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <GithubMark />}
      {label}
    </Button>
  );
}
