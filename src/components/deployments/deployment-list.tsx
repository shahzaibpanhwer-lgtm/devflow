import { RocketIcon } from "lucide-react";

import { DeploymentRow, type DeploymentRowData } from "@/components/deployments/deployment-row";
import { EmptyState } from "@/components/devflow/empty-state";
import type { DeploymentSummary } from "@/lib/deployments";
import type { DeploymentStatus } from "@/lib/status";
import type { ReactNode } from "react";

/**
 * Renders the deployment table.
 *
 * Dates are serialised to strings here because each row is a client component,
 * and Date instances cannot cross that boundary.
 */
export function DeploymentList({
  deployments,
  emptyAction,
  emptyDescription = "Start a deployment to see its pipeline, build output and result here.",
}: {
  deployments: DeploymentSummary[];
  emptyAction?: ReactNode;
  emptyDescription?: string;
}) {
  if (deployments.length === 0) {
    return (
      <EmptyState
        icon={RocketIcon}
        title="No deployments yet"
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  const rows: DeploymentRowData[] = deployments.map((deployment) => ({
    id: deployment.id,
    version: deployment.version,
    status: deployment.status as DeploymentStatus,
    environment: deployment.environment,
    durationMs: deployment.durationMs,
    commitSha: deployment.commitSha,
    commitMessage: deployment.commitMessage,
    branch: deployment.branch,
    createdAt: deployment.createdAt.toISOString(),
    project: { id: deployment.project.id, name: deployment.project.name },
  }));

  return (
    <div className="border-line bg-surface-1 overflow-hidden rounded-lg border">
      <ul>
        {rows.map((deployment) => (
          <DeploymentRow key={deployment.id} deployment={deployment} />
        ))}
      </ul>
    </div>
  );
}
