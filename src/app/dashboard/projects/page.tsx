import { FolderGitIcon, PlusIcon, SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/devflow/empty-state";
import { PageHeader } from "@/components/devflow/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectsFilter } from "@/components/projects/projects-filter";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { listProjects } from "@/lib/projects";
import { listProjectsSchema } from "@/lib/validations/project";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  // Invalid query strings fall back to defaults rather than erroring — a bad
  // ?page=abc in a shared link should still render the first page.
  const parsed = listProjectsSchema.safeParse({
    status: params.status,
    search: params.search,
    page: params.page,
    perPage: params.perPage,
  });
  const query = parsed.success ? parsed.data : listProjectsSchema.parse({});

  const { projects, total } = await listProjects(user.id, query);
  const filtering = Boolean(query.search || query.status);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Every application in your workspace, with its repository, environment and deployment state."
        actions={
          <ProjectFormDialog
            trigger={
              <Button size="sm">
                <PlusIcon aria-hidden="true" />
                New project
              </Button>
            }
          />
        }
      />

      <div className="mb-5">
        <ProjectsFilter />
      </div>

      {projects.length === 0 ? (
        filtering ? (
          <EmptyState
            icon={SearchXIcon}
            title="No matching projects"
            description="No project matches the current search and filter. Try a different term or clear the filter."
          />
        ) : (
          <EmptyState
            icon={FolderGitIcon}
            title="No projects yet"
            description="Create your first project to connect a repository, track deployments and publish a public project page."
            action={
              <ProjectFormDialog
                trigger={
                  <Button size="sm">
                    <PlusIcon aria-hidden="true" />
                    Create project
                  </Button>
                }
              />
            }
          />
        )
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <p className="text-text-tertiary mt-4 text-xs">
            Showing {projects.length} of {total} {total === 1 ? "project" : "projects"}
          </p>
        </>
      )}
    </div>
  );
}
