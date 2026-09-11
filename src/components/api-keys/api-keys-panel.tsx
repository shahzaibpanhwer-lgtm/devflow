"use client";

import { KeyRoundIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { CreateKeyDialog } from "@/components/api-keys/create-key-dialog";
import { EmptyState } from "@/components/devflow/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApiResult } from "@/lib/api-response";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  lastFour: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
};

type KeyState = "active" | "revoked" | "expired";

function keyState(key: ApiKeyRow): KeyState {
  if (key.revokedAt) return "revoked";
  if (key.expiresAt && new Date(key.expiresAt).getTime() <= Date.now()) return "expired";
  return "active";
}

const STATE_LABEL: Record<KeyState, string> = {
  active: "Active",
  revoked: "Revoked",
  expired: "Expired",
};

const STATE_CLASS: Record<KeyState, string> = {
  active: "text-status-success",
  revoked: "text-text-tertiary",
  expired: "text-status-warning",
};

export function ApiKeysPanel({
  projectId,
  keys,
  canManage,
}: {
  projectId: string;
  keys: ApiKeyRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [revoking, setRevoking] = useState<ApiKeyRow | null>(null);
  const [pending, setPending] = useState(false);

  async function revoke() {
    if (!revoking) return;
    setPending(true);

    try {
      const response = await fetch(`/api/keys/${revoking.id}`, { method: "DELETE" });
      const result = (await response.json()) as ApiResult<unknown>;

      if (!result.success) {
        toast.error(result.error.message);
        setPending(false);
        return;
      }

      toast.success(`Revoked "${revoking.name}"`);
      setRevoking(null);
      setPending(false);
      router.refresh();
    } catch {
      toast.error("Could not reach the server. Please try again.");
      setPending(false);
    }
  }

  const createTrigger = (
    <Button size="sm">
      <KeyRoundIcon aria-hidden="true" />
      Create key
    </Button>
  );

  if (keys.length === 0) {
    return (
      <EmptyState
        icon={KeyRoundIcon}
        title="No API keys"
        description="Issue a key to call the DevFlow API from a script, a CI pipeline or another service."
        action={
          canManage ? <CreateKeyDialog projectId={projectId} trigger={createTrigger} /> : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <CreateKeyDialog projectId={projectId} trigger={createTrigger} />
        </div>
      ) : null}

      <div className="border-line bg-surface-1 overflow-hidden rounded-lg border">
        <ul className="divide-line divide-y">
          {keys.map((key) => {
            const state = keyState(key);

            return (
              <li key={key.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{key.name}</p>
                  {/* Only the recognisable fragments — never the secret. */}
                  <p className="text-text-tertiary mt-0.5 font-mono text-xs">
                    {key.prefix}
                    <span aria-hidden="true">{"…"}</span>
                    {key.lastFour}
                  </p>
                </div>

                <div className="text-text-tertiary hidden text-xs sm:block">
                  {key.lastUsedAt ? `Used ${relativeTime(new Date(key.lastUsedAt))}` : "Never used"}
                </div>

                <span className={cn("shrink-0 text-xs font-medium", STATE_CLASS[state])}>
                  {STATE_LABEL[state]}
                </span>

                {canManage && state === "active" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevoking(key)}
                    className="shrink-0"
                  >
                    Revoke
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <Dialog open={revoking !== null} onOpenChange={(next) => !next && setRevoking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke {revoking?.name}?</DialogTitle>
            <DialogDescription>
              Any script or service still using this key will start receiving 401 responses
              immediately. This cannot be undone — issue a new key instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRevoking(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void revoke()}
              disabled={pending}
            >
              {pending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
              Revoke key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
