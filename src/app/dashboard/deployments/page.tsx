import { RocketIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/devflow/empty-state";
import { PageHeader } from "@/components/devflow/page-header";

export const metadata: Metadata = {
  title: "Deployments",
};

export default function DeploymentsPage() {
  return (
    <div>
      <PageHeader
        title="Deployments"
        description="Track every release from queue through build, test and production."
      />
      <EmptyState
        icon={RocketIcon}
        title="No deployments yet"
        description="Deployments appear here as soon as you ship a project. Each one keeps its build logs and timeline."
      />
    </div>
  );
}
