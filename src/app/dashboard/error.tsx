"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/devflow/error-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] render failed:", error);
  }, [error]);

  return (
    <ErrorState
      title="Could not load your dashboard"
      description="The workspace summary failed to load. This is usually temporary."
      onRetry={reset}
    />
  );
}
