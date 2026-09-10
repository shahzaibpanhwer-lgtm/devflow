"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/devflow/error-state";
import { PageHeader } from "@/components/devflow/page-header";

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[projects] render failed:", error);
  }, [error]);

  return (
    <div>
      <PageHeader title="Projects" />
      <ErrorState
        title="Could not load projects"
        description="The project list failed to load. This is usually temporary."
        onRetry={reset}
      />
    </div>
  );
}
