"use client";

import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  /** Wired to a route segment's `reset()` or a local refetch. */
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  description = "The request failed. This is usually temporary — try again in a moment.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "border-status-danger/25 bg-status-danger/5 flex flex-col items-center justify-center rounded-lg border px-6 py-14 text-center",
        className,
      )}
    >
      <div className="border-status-danger/30 bg-status-danger/10 text-status-danger mb-4 flex size-10 items-center justify-center rounded-lg border">
        <TriangleAlertIcon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-text-secondary mt-1.5 max-w-sm text-sm text-pretty">{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCwIcon aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
