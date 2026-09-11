import { RocketIcon } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateDeploymentDialog } from "@/components/deployments/create-deployment-dialog";
import { DeploymentList } from "@/components/deployments/deployment-list";
import { PageHeader } from "@/components/devflow/page-header";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { listDeployableProjects, listDeployments } from "@/lib/deployments";
import { listDeploymentsSchema } from "@/lib/validations/deployment";

export const metadata: Metadata = {
  title: "Deployments",
};

export default async function DeploymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;

  // A malformed query string falls back to defaults rather than erroring, so a
  // stale shared link still renders the first page.
  const parsed = listDeploymentsSchema.safeParse({
    projectId: params.projectId,
    status: params.status,
    environment: params.environment,
    page: params.page,
  });
  const query = parsed.success ? parsed.data : listDeploymentsSchema.parse({});

  const [{ deployments, total }, projects] = await Promise.all([
    listDeployments(user.id, query),
    listDeployableProjects(user.id),
  ]);

  const deployTrigger = (
    <Button size="sm">
      <RocketIcon aria-hidden="true" />
      New deployment
    </Button>
  );

  return (
    <div>
      <PageHeader
        title="Deployments"
        description="Every release across your projects, with its pipeline, build output and result."
        actions={
          projects.length > 0 ? (
            <CreateDeploymentDialog trigger={deployTrigger} projects={projects} />
          ) : null
        }
      />

      <DeploymentList
        deployments={deployments}
        emptyAction={
          projects.length > 0 ? (
            <CreateDeploymentDialog trigger={deployTrigger} projects={projects} />
          ) : null
        }
      />

      {deployments.length > 0 ? (
        <p className="text-text-tertiary mt-4 text-xs">
          Showing {deployments.length} of {total} {total === 1 ? "deployment" : "deployments"}
        </p>
      ) : null}
    </div>
  );
}
