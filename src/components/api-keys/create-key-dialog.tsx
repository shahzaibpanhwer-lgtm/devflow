"use client";

import { CheckIcon, CopyIcon, KeyRoundIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react";
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

const EXPIRY_OPTIONS = [
  { value: "never", label: "No expiry" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
] as const;

type CreatedKey = { name: string; plaintext: string };

export function CreateKeyDialog({ trigger, projectId }: { trigger: ReactNode; projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<string>("never");
  const [issued, setIssued] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setError(null);
    setIssued(null);
    setCopied(false);
    setExpiry("never");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/projects/${projectId}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          expiresInDays: expiry === "never" ? null : Number(expiry),
        }),
      });
      const result = (await response.json()) as ApiResult<{
        key: { name: string };
        plaintext: string;
      }>;

      if (!result.success) {
        setError(result.error.message);
        setPending(false);
        return;
      }

      // Held in component state only, and only until the dialog closes.
      setIssued({ name: result.data.key.name, plaintext: result.data.plaintext });
      setPending(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  async function copyKey() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.plaintext);
      setCopied(true);
      toast.success("Key copied to clipboard");
    } catch {
      toast.error("Could not copy. Select the key and copy it manually.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {issued ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy your API key now</DialogTitle>
              <DialogDescription>
                This is the only time the key will be shown. DevFlow stores a hash of it, so it
                cannot be retrieved again — if you lose it, issue a new one.
              </DialogDescription>
            </DialogHeader>

            <div className="border-status-warning/25 bg-status-warning/10 text-status-warning flex items-start gap-2 rounded-md border px-3 py-2 text-xs">
              <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>Treat this like a password. Anyone holding it can call the API as you.</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="issued-key">{issued.name}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="issued-key"
                  readOnly
                  value={issued.plaintext}
                  onFocus={(event) => event.currentTarget.select()}
                  className="font-mono text-xs"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => void copyKey()}>
                  {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
                  <span className="sr-only">Copy key</span>
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create an API key</DialogTitle>
              <DialogDescription>
                Keys authenticate requests to the DevFlow API on behalf of this project.
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
                <Label htmlFor="key-name">Name</Label>
                <Input id="key-name" name="name" placeholder="CI pipeline" required />
                <p className="text-text-tertiary text-xs">
                  Something you will recognise when revoking it later.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="key-expiry">Expires</Label>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger id="key-expiry" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? (
                    <Loader2Icon className="animate-spin" aria-hidden="true" />
                  ) : (
                    <KeyRoundIcon aria-hidden="true" />
                  )}
                  Create key
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
