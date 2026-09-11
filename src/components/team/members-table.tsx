"use client";

import { Loader2Icon, UserMinusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApiResult } from "@/lib/api-response";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { ASSIGNABLE_ROLES, type AssignableRole } from "@/lib/validations/team";

export type MemberRow = {
  id: string;
  role: "OWNER" | "ADMIN" | "DEVELOPER" | "VIEWER";
  joinedAt: string;
  userId: string;
  name: string;
  email: string;
};

const ROLE_LABEL: Record<MemberRow["role"], string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  DEVELOPER: "Developer",
  VIEWER: "Viewer",
};

const ROLE_DESCRIPTION: Record<MemberRow["role"], string> = {
  OWNER: "Full access, including billing and workspace settings",
  ADMIN: "Full workspace management, including keys and members",
  DEVELOPER: "Can create projects and deploy",
  VIEWER: "Read-only access",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function MembersTable({
  teamId,
  members,
  viewerRole,
  viewerUserId,
}: {
  teamId: string;
  members: MemberRow[];
  viewerRole: MemberRow["role"];
  viewerUserId: string;
}) {
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [removing, setRemoving] = useState<MemberRow | null>(null);
  const [removePending, setRemovePending] = useState(false);

  const isManager = viewerRole === "OWNER" || viewerRole === "ADMIN";

  /**
   * Mirrors the server rules so the interface does not offer an action that
   * will be refused. The server enforces them regardless — this only decides
   * what to render.
   */
  function canEdit(member: MemberRow): boolean {
    if (!isManager) return false;
    if (member.userId === viewerUserId) return false;
    if (member.role === "OWNER") return false;
    return true;
  }

  function canRemove(member: MemberRow): boolean {
    if (!canEdit(member)) return false;
    if (member.role === "ADMIN" && viewerRole !== "OWNER") return false;
    return true;
  }

  async function changeRole(member: MemberRow, role: AssignableRole) {
    setPendingRole(member.id);

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const result = (await response.json()) as ApiResult<unknown>;

      if (!result.success) {
        toast.error(result.error.message);
        setPendingRole(null);
        return;
      }

      toast.success(`${member.name} is now ${ROLE_LABEL[role].toLowerCase()}`);
      setPendingRole(null);
      router.refresh();
    } catch {
      toast.error("Could not reach the server. Please try again.");
      setPendingRole(null);
    }
  }

  async function remove() {
    if (!removing) return;
    setRemovePending(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${removing.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as ApiResult<unknown>;

      if (!result.success) {
        toast.error(result.error.message);
        setRemovePending(false);
        return;
      }

      toast.success(`Removed ${removing.name}`);
      setRemoving(null);
      setRemovePending(false);
      router.refresh();
    } catch {
      toast.error("Could not reach the server. Please try again.");
      setRemovePending(false);
    }
  }

  return (
    <>
      <div className="border-line bg-surface-1 overflow-hidden rounded-lg border">
        <ul className="divide-line divide-y">
          {members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-surface-3 text-text-secondary text-[11px] font-medium">
                  {initials(member.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.name}
                  {member.userId === viewerUserId ? (
                    <span className="text-text-tertiary ml-2 text-xs font-normal">You</span>
                  ) : null}
                </p>
                <p className="text-text-tertiary truncate font-mono text-xs">{member.email}</p>
              </div>

              <span className="text-text-tertiary hidden shrink-0 text-xs lg:inline">
                Joined {relativeTime(new Date(member.joinedAt))}
              </span>

              {canEdit(member) ? (
                <Select
                  value={member.role}
                  onValueChange={(value) => void changeRole(member, value as AssignableRole)}
                  disabled={pendingRole === member.id}
                >
                  <SelectTrigger className="w-32 shrink-0" aria-label={`Role for ${member.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span
                  className={cn(
                    "border-line bg-surface-2 shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                    member.role === "OWNER" ? "text-brand-500" : "text-text-secondary",
                  )}
                  title={ROLE_DESCRIPTION[member.role]}
                >
                  {ROLE_LABEL[member.role]}
                </span>
              )}

              {canRemove(member) ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setRemoving(member)}
                  aria-label={`Remove ${member.name}`}
                  className="shrink-0"
                >
                  <UserMinusIcon aria-hidden="true" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={removing !== null} onOpenChange={(next) => !next && setRemoving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}?</DialogTitle>
            <DialogDescription>
              They lose access to every project in this team immediately. Their past activity stays
              in the timeline, and you can add them again later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRemoving(null)}
              disabled={removePending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void remove()}
              disabled={removePending}
            >
              {removePending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
