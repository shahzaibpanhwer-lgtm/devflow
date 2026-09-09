import { ChartNoAxesColumnIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/devflow/empty-state";
import { PageHeader } from "@/components/devflow/page-header";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="API traffic, latency, error rates and deployment frequency across the workspace."
      />
      <EmptyState
        icon={ChartNoAxesColumnIcon}
        title="Not enough data yet"
        description="Analytics start populating once your projects begin receiving API requests and deployments."
      />
    </div>
  );
}
