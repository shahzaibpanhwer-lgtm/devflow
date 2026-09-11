"use client";

import { Loader2Icon } from "lucide-react";
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
import { deploymentEnvironments } from "@/lib/validations/deployment";

type DeployableProject = { id: string; name: string };

export function CreateDeploymentDialog({
  trigger,
  projects,
  defaultProjectId,
}: {
  trigger: ReactNode;
  projects: DeployableProject[];
  /** Preselects a project when launched from a project page. */
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [environment, setEnvironment] =
    useState<(typeof deploymentEnvironments)[number]>("PRODUCTION");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!projectId) {
      setError("Choose a project to deploy.");
      return;
    }

    setPending(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          environment,
          version: String(form.get("version") ?? ""),
          branch: String(form.get("branch") ?? ""),
          commitMessage: String(form.get("commitMessage") ?? ""),
        }),
      });
      const result = (await response.json()) as ApiResult<unknown>;

      if (!result.success) {
        setError(result.error.message);
        setPending(false);
        return;
      }

      toast.success("Deployment started");
      setOpen(false);
      setPending(false);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a deployment</DialogTitle>
          <DialogDescription>
            Runs DevFlow&rsquo;s simulated build pipeline and records the result. Leave the version
            blank to increment the project&rsquo;s last one.
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
            <Label htmlFor="deploy-project">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="deploy-project" className="w-full">
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="deploy-version">Version</Label>
              <Input id="deploy-version" name="version" placeholder="auto" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deploy-environment">Environment</Label>
              <Select
                value={environment}
                onValueChange={(value) =>
                  setEnvironment(value as (typeof deploymentEnvironments)[number])
                }
              >
                <SelectTrigger id="deploy-environment" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deploymentEnvironments.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value.charAt(0) + value.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deploy-branch">Branch</Label>
            <Input id="deploy-branch" name="branch" placeholder="main" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deploy-message">Commit message</Label>
            <Input
              id="deploy-message"
              name="commitMessage"
              placeholder="Manual deployment from DevFlow"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || projects.length === 0}>
              {pending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
              Deploy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
