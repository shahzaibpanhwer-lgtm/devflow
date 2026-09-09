import { UsersIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/devflow/empty-state";
import { PageHeader } from "@/components/devflow/page-header";

export const metadata: Metadata = {
  title: "Team",
};

export default function TeamPage() {
  return (
    <div>
      <PageHeader title="Team" description="Members, roles and invitations for this workspace." />
      <EmptyState
        icon={UsersIcon}
        title="No team members yet"
        description="Invite collaborators and assign them owner, admin, developer or viewer roles."
      />
    </div>
  );
}
