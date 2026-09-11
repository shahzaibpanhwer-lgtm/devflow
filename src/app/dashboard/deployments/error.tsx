"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/devflow/error-state";
import { PageHeader } from "@/components/devflow/page-header";

export default function DeploymentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[deployments] render failed:", error);
  }, [error]);

  return (
    <div>
      <PageHeader title="Deployments" />
      <ErrorState
        title="Could not load deployments"
        description="The deployment history failed to load. This is usually temporary."
        onRetry={reset}
      />
    </div>
  );
}
