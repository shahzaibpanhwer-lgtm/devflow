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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult } from "@/lib/api-response";
import { PROJECT_STATUSES, PROJECT_STATUS_META, type ProjectStatus } from "@/lib/status";
import { createProjectSchema } from "@/lib/validations/project";

type ProjectValues = {
  id?: string;
  name: string;
  description: string;
  framework: string;
  status: ProjectStatus;
  productionUrl: string;
  repositoryUrl: string;
  githubRepository: string;
  isPublic: boolean;
};

const EMPTY: ProjectValues = {
  name: "",
  description: "",
  framework: "",
  status: "DEVELOPMENT",
  productionUrl: "",
  repositoryUrl: "",
  githubRepository: "",
  isPublic: false,
};

type FieldErrors = Partial<Record<keyof ProjectValues, string>>;

type ProjectFormDialogProps = {
  trigger: ReactNode;
  /** Present when editing; absent when creating. */
  project?: ProjectValues;
};

export function ProjectFormDialog({ trigger, project }: ProjectFormDialogProps) {
  const router = useRouter();
  const editing = Boolean(project?.id);

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "DEVELOPMENT");
  const [isPublic, setIsPublic] = useState(project?.isPublic ?? false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const initial = project ?? EMPTY;

  function reset() {
    setFormError(null);
    setFieldErrors({});
    setStatus(project?.status ?? "DEVELOPMENT");
    setIsPublic(project?.isPublic ?? false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      framework: String(form.get("framework") ?? ""),
      status,
      productionUrl: String(form.get("productionUrl") ?? ""),
      repositoryUrl: String(form.get("repositoryUrl") ?? ""),
      githubRepository: String(form.get("githubRepository") ?? ""),
      isPublic,
    };

    const parsed = createProjectSchema.safeParse(values);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          errors[key as keyof ProjectValues] ??= issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setPending(true);

    let result: ApiResult<unknown>;
    try {
      const response = await fetch(editing ? `/api/projects/${project?.id}` : "/api/projects", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      result = (await response.json()) as ApiResult<unknown>;
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
      setPending(false);
      return;
    }

    if (!result.success) {
      if (result.error.fields) {
        const errors: FieldErrors = {};
        for (const [key, messages] of Object.entries(result.error.fields)) {
          if (messages[0]) errors[key as keyof ProjectValues] = messages[0];
        }
        setFieldErrors(errors);
      }
      setFormError(result.error.message);
      setPending(false);
      return;
    }

    toast.success(editing ? "Project updated" : "Project created");
    setOpen(false);
    setPending(false);
    reset();
    router.refresh();
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit project" : "Create project"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the project's details. Its public URL will not change."
              : "Projects group deployments, API keys and documentation together."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {formError ? (
            <div
              role="alert"
              className="border-status-danger/25 bg-status-danger/10 text-status-danger rounded-md border px-3 py-2.5 text-sm"
            >
              {formError}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initial.name}
              placeholder="LeadFinder"
              required
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name ? (
              <p id="name-error" className="text-status-danger text-xs">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={initial.description}
              placeholder="What does this project do?"
              aria-invalid={Boolean(fieldErrors.description)}
            />
            {fieldErrors.description ? (
              <p className="text-status-danger text-xs">{fieldErrors.description}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="framework">Framework</Label>
              <Input
                id="framework"
                name="framework"
                defaultValue={initial.framework}
                placeholder="Next.js"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PROJECT_STATUS_META[value].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="githubRepository">GitHub repository</Label>
            <Input
              id="githubRepository"
              name="githubRepository"
              defaultValue={initial.githubRepository}
              placeholder="owner/repository"
              aria-invalid={Boolean(fieldErrors.githubRepository)}
              aria-describedby={fieldErrors.githubRepository ? "repo-error" : undefined}
            />
            {fieldErrors.githubRepository ? (
              <p id="repo-error" className="text-status-danger text-xs">
                {fieldErrors.githubRepository}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="productionUrl">Production URL</Label>
            <Input
              id="productionUrl"
              name="productionUrl"
              type="url"
              defaultValue={initial.productionUrl}
              placeholder="https://example.com"
              aria-invalid={Boolean(fieldErrors.productionUrl)}
              aria-describedby={fieldErrors.productionUrl ? "prod-error" : undefined}
            />
            {fieldErrors.productionUrl ? (
              <p id="prod-error" className="text-status-danger text-xs">
                {fieldErrors.productionUrl}
              </p>
            ) : null}
          </div>

          <div className="border-line flex items-start justify-between gap-4 rounded-md border p-3">
            <div className="min-w-0">
              <Label htmlFor="project-public" className="text-sm">
                Public project page
              </Label>
              <p className="text-text-tertiary mt-0.5 text-xs text-pretty">
                Publishes a read-only page at /p/{"{slug}"} that anyone can open. Off by default.
              </p>
            </div>
            <Switch
              id="project-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              aria-label="Publish a public project page"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
              {editing ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
