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
import type { ApiResult } from "@/lib/api-response";

export function DisconnectRepositoryButton({
  trigger,
  projectId,
  repositoryName,
}: {
  trigger: ReactNode;
  projectId: string;
  repositoryName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function disconnect() {
    setPending(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/repository`, {
        method: "DELETE",
      });
      const result = (await response.json()) as ApiResult<unknown>;

      if (!result.success) {
        toast.error(result.error.message);
        setPending(false);
        return;
      }

      toast.success(`Disconnected ${repositoryName}`);
      setOpen(false);
      setPending(false);
      router.refresh();
    } catch {
      toast.error("Could not reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disconnect {repositoryName}?</DialogTitle>
          <DialogDescription>
            The project keeps its deployments and settings. Only the synced repository details are
            removed, and you can reconnect at any time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={disconnect} disabled={pending}>
            {pending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
            Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
