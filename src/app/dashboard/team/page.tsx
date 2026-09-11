import { UserPlusIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ActivityPanel, Panel } from "@/components/dashboard/panels";
import { EmptyState } from "@/components/devflow/empty-state";
import { PageHeader } from "@/components/devflow/page-header";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { MembersTable } from "@/components/team/members-table";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { getTeamForUser, listMembers, listTeamActivity } from "@/lib/teams";

export const metadata: Metadata = {
  title: "Team",
};

const ROLE_SUMMARY = [
  { role: "Owner", detail: "Full access, including billing and workspace settings" },
  { role: "Admin", detail: "Manages projects, deployments, API keys and members" },
  { role: "Developer", detail: "Creates projects and starts deployments" },
  { role: "Viewer", detail: "Read-only access to everything in the team" },
];

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const membership = await getTeamForUser(user.id);

  if (!membership) {
    return (
      <div>
        <PageHeader
          title="Team"
          description="Members, roles and the activity trail for your workspace."
        />
        <EmptyState
          icon={UsersIcon}
          title="You are not in a team"
          description="Projects you create belong to you alone. Teams group projects and people together, sharing access across a workspace."
        />
      </div>
    );
  }

  const { team, viewerRole } = membership;
  const [members, activity] = await Promise.all([listMembers(team.id), listTeamActivity(team.id)]);

  const canInviteMembers = viewerRole === "OWNER" || viewerRole === "ADMIN";

  return (
    <div>
      <PageHeader
        title={team.name}
        description={
          team.description ?? "Members, roles and the activity trail for your workspace."
        }
        actions={
          canInviteMembers ? (
            <InviteMemberDialog
              teamId={team.id}
              trigger={
                <Button size="sm">
                  <UserPlusIcon aria-hidden="true" />
                  Add member
                </Button>
              }
            />
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section>
            <h2 className="text-text-secondary mb-2 text-xs font-medium tracking-wide uppercase">
              {members.length} {members.length === 1 ? "member" : "members"}
            </h2>
            <MembersTable
              teamId={team.id}
              viewerRole={viewerRole}
              viewerUserId={user.id}
              members={members.map((member) => ({
                id: member.id,
                role: member.role,
                joinedAt: member.createdAt.toISOString(),
                userId: member.user.id,
                name: member.user.name ?? member.user.email,
                email: member.user.email,
              }))}
            />
          </section>

          <Panel title="Team activity">
            <ActivityPanel activities={activity} />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Roles">
            <dl className="space-y-3">
              {ROLE_SUMMARY.map((entry) => (
                <div key={entry.role}>
                  <dt className="text-sm font-medium">{entry.role}</dt>
                  <dd className="text-text-secondary mt-0.5 text-xs text-pretty">{entry.detail}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Workspace">
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-baseline gap-2">
                <dt className="text-text-secondary">Projects</dt>
                <dd className="ml-auto font-mono tabular-nums">{team._count.projects}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-text-secondary">Members</dt>
                <dd className="ml-auto font-mono tabular-nums">{team._count.members}</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="text-text-secondary">Your role</dt>
                <dd className="ml-auto text-xs">
                  {viewerRole.charAt(0) + viewerRole.slice(1).toLowerCase()}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}
