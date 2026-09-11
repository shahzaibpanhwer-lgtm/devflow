"use client";

import { Loader2Icon, LockIcon, SearchIcon, StarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/devflow/error-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResult } from "@/lib/api-response";

type Repository = {
  id: number;
  fullName: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  isPrivate: boolean;
  isFork: boolean;
  pushedAt: string | null;
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; repositories: Repository[] }
  | { status: "error"; message: string };

export function ConnectRepositoryDialog({
  trigger,
  projectId,
}: {
  trigger: ReactNode;
  projectId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [search, setSearch] = useState("");
  const [connecting, setConnecting] = useState<string | null>(null);

  /**
   * Repositories are loaded when the dialog is opened rather than on mount:
   * the list costs a GitHub API call against a rate-limited quota, and most
   * page views never open it. Driven from the open event rather than an
   * effect, so opening the dialog is the only thing that triggers a fetch.
   */
  async function loadRepositories() {
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/github/repositories");
      const result = (await response.json()) as ApiResult<{ repositories: Repository[] }>;

      setState(
        result.success
          ? { status: "ready", repositories: result.data.repositories }
          : { status: "error", message: result.error.message },
      );
    } catch {
      setState({ status: "error", message: "Could not reach the server. Please try again." });
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && state.status === "idle") {
      void loadRepositories();
    }
  }

  const filtered = useMemo(() => {
    if (state.status !== "ready") return [];
    const term = search.trim().toLowerCase();
    if (!term) return state.repositories;
    return state.repositories.filter(
      (repository) =>
        repository.fullName.toLowerCase().includes(term) ||
        (repository.description?.toLowerCase().includes(term) ?? false),
    );
  }, [state, search]);

  async function connect(fullName: string) {
    setConnecting(fullName);

    try {
      const response = await fetch(`/api/projects/${projectId}/repository`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      const result = (await response.json()) as ApiResult<unknown>;

      if (!result.success) {
        toast.error(result.error.message);
        setConnecting(null);
        return;
      }

      toast.success(`Connected ${fullName}`);
      setOpen(false);
      setConnecting(null);
      router.refresh();
    } catch {
      toast.error("Could not reach the server. Please try again.");
      setConnecting(null);
    }
  }

  const showSearch = state.status === "ready" && state.repositories.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect a repository</DialogTitle>
          <DialogDescription>
            Link a GitHub repository to sync its stars, language, commits and open issues.
          </DialogDescription>
        </DialogHeader>

        {showSearch ? (
          <div className="relative">
            <SearchIcon
              className="text-text-tertiary pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search repositories..."
              aria-label="Search repositories"
              className="pl-8"
            />
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {state.status === "loading" || state.status === "idle" ? (
            <ul className="space-y-2" aria-label="Loading repositories">
              {Array.from({ length: 5 }).map((_, index) => (
                <li key={index} className="border-line rounded-md border p-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="mt-2 h-3 w-full" />
                </li>
              ))}
            </ul>
          ) : null}

          {state.status === "error" ? (
            <ErrorState
              title="Could not load repositories"
              description={state.message}
              onRetry={() => void loadRepositories()}
            />
          ) : null}

          {state.status === "ready" && state.repositories.length === 0 ? (
            <p className="text-text-secondary py-10 text-center text-sm">
              No repositories found on your GitHub account.
            </p>
          ) : null}

          {state.status === "ready" && state.repositories.length > 0 && filtered.length === 0 ? (
            <p className="text-text-secondary py-10 text-center text-sm">
              No repository matches that search.
            </p>
          ) : null}

          {filtered.length > 0 ? (
            <ul className="space-y-2">
              {filtered.map((repository) => (
                <li key={repository.id}>
                  <button
                    type="button"
                    onClick={() => void connect(repository.fullName)}
                    disabled={connecting !== null}
                    className="border-line hover:border-line-strong hover:bg-surface-2 focus-visible:ring-ring/50 flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors focus-visible:ring-3 focus-visible:outline-none disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-mono text-sm">{repository.fullName}</span>
                        {repository.isPrivate ? (
                          <LockIcon
                            className="text-text-tertiary size-3 shrink-0"
                            aria-label="Private repository"
                          />
                        ) : null}
                      </span>
                      {repository.description ? (
                        <span className="text-text-secondary mt-0.5 line-clamp-1 block text-xs">
                          {repository.description}
                        </span>
                      ) : null}
                      <span className="text-text-tertiary mt-1 flex items-center gap-3 text-[11px]">
                        {repository.language ? <span>{repository.language}</span> : null}
                        <span className="inline-flex items-center gap-1">
                          <StarIcon className="size-3" aria-hidden="true" />
                          {repository.stars}
                        </span>
                        {repository.isFork ? <span>fork</span> : null}
                      </span>
                    </span>
                    {connecting === repository.fullName ? (
                      <Loader2Icon
                        className="mt-1 size-4 shrink-0 animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="border-line flex justify-end border-t pt-3">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
