"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
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
import type { ApiResult } from "@/lib/api-response";

type DeleteProjectDialogProps = {
  trigger: ReactNode;
  projectId: string;
  projectName: string;
  /** Where to land after a successful delete. */
  redirectTo?: string;
};

export function DeleteProjectDialog({
  trigger,
  projectId,
  projectName,
  redirectTo,
}: DeleteProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Deleting cascades to deployments, keys and docs, so the project name must
  // be typed out before the button unlocks.
  const confirmed = confirmation === projectName;

  async function handleDelete() {
    if (!confirmed) return;

    setPending(true);
    setError(null);

    let result: ApiResult<unknown>;
    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      result = (await response.json()) as ApiResult<unknown>;
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPending(false);
      return;
    }

    if (!result.success) {
      setError(result.error.message);
      setPending(false);
      return;
    }

    toast.success(`Deleted ${projectName}`);
    setOpen(false);
    setPending(false);

    if (redirectTo) {
      router.push("/dashboard/projects");
    }
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setConfirmation("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {projectName}?</DialogTitle>
          <DialogDescription>
            This permanently removes the project along with its deployments, API keys and
            documentation. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div
            role="alert"
            className="border-status-danger/25 bg-status-danger/10 text-status-danger rounded-md border px-3 py-2.5 text-sm"
          >
            {error}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="confirm-name">
            Type <span className="text-foreground font-mono">{projectName}</span> to confirm
          </Label>
          <Input
            id="confirm-name"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            placeholder={projectName}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!confirmed || pending}
          >
            {pending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
