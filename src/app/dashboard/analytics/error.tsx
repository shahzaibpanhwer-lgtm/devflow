"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/devflow/error-state";
import { PageHeader } from "@/components/devflow/page-header";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[analytics] render failed:", error);
  }, [error]);

  return (
    <div>
      <PageHeader title="Analytics" />
      <ErrorState
        title="Could not load analytics"
        description="The aggregation queries failed. This is usually temporary."
        onRetry={reset}
      />
    </div>
  );
}
