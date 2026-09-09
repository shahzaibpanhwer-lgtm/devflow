import { FolderGitIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/devflow/empty-state";
import { PageHeader } from "@/components/devflow/page-header";

export const metadata: Metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return (
    <div>
      <PageHeader
        title="Projects"
        description="Every application in your workspace, with its repository, environment and deployment state."
      />
      <EmptyState
        icon={FolderGitIcon}
        title="No projects yet"
        description="Create your first project to connect a repository, track deployments and expose a public project page."
      />
    </div>
  );
}
