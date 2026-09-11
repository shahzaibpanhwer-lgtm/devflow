import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/devflow/page-header";
import { GithubConnectionCard } from "@/components/github/github-connection-card";
import { isGithubConfigured } from "@/lib/auth.config";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Only whether a token exists is read here — never the token itself, which
  // has no reason to leave the server.
  const githubAccount = await db.account.findFirst({
    where: { userId: user.id, provider: "github" },
    select: { access_token: true, providerAccountId: true },
  });

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Account preferences, workspace configuration and connected integrations."
      />

      <div className="space-y-5">
        <section className="border-line bg-surface-1 rounded-lg border p-4">
          <h2 className="text-sm font-medium">Account</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-baseline gap-3">
              <dt className="text-text-secondary w-24 shrink-0">Name</dt>
              <dd className="truncate">{user.name}</dd>
            </div>
            <div className="flex items-baseline gap-3">
              <dt className="text-text-secondary w-24 shrink-0">Email</dt>
              <dd className="truncate font-mono text-xs">{user.email}</dd>
            </div>
          </dl>
        </section>

        <GithubConnectionCard
          configured={isGithubConfigured}
          connected={Boolean(githubAccount?.access_token)}
          accountLogin={githubAccount?.providerAccountId ?? null}
        />
      </div>
    </div>
  );
}
