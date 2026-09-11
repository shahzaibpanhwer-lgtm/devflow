"use client";

import { Loader2Icon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApiResult } from "@/lib/api-response";
import { ASSIGNABLE_ROLES, type AssignableRole } from "@/lib/validations/team";

const ROLE_LABEL: Record<AssignableRole, string> = {
  ADMIN: "Admin",
  DEVELOPER: "Developer",
  VIEWER: "Viewer",
};

const ROLE_HINT: Record<AssignableRole, string> = {
  ADMIN: "Manages projects, API keys and members",
  DEVELOPER: "Creates projects and deploys",
  VIEWER: "Read-only access",
};

export function InviteMemberDialog({ trigger, teamId }: { trigger: ReactNode; teamId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<AssignableRole>("DEVELOPER");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(form.get("email") ?? ""), role }),
      });
      const result = (await response.json()) as ApiResult<unknown>;

      if (!result.success) {
        setError(result.error.message);
        setPending(false);
        return;
      }

      toast.success("Member added to the team");
      setOpen(false);
      setPending(false);
      setRole("DEVELOPER");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a team member</DialogTitle>
          <DialogDescription>
            {/* Stated plainly rather than implying an email is on its way. */}
            The person needs a DevFlow account already. Adding them grants access immediately, and
            no invitation email is sent.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error ? (
            <div
              role="alert"
              className="border-status-danger/25 bg-status-danger/10 text-status-danger rounded-md border px-3 py-2.5 text-sm"
            >
              {error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="colleague@example.com"
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as AssignableRole)}>
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {ROLE_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-text-tertiary text-xs">{ROLE_HINT[role]}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              ) : (
                <UserPlusIcon aria-hidden="true" />
              )}
              Add member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
