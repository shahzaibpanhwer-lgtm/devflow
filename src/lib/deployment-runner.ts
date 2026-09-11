import "server-only";

import { ActivityType, DeploymentStatus } from "@prisma/client";

import { recordActivity } from "@/lib/activity";
import { db } from "@/lib/db";

/**
 * Simulated build pipeline.
 *
 * DevFlow is not wired to a build provider, so deployments advance through a
 * scripted pipeline rather than reporting real work. Everything it writes is
 * genuine — real rows, real timestamps, real state transitions — but the build
 * itself is theatre, and the log lines say so.
 *
 * Replacing this with a real provider means swapping this module for one that
 * creates a build via that provider's API and updates the same rows from its
 * webhook. Nothing outside this file knows the difference.
 *
 * The stage timers run in-process, which suits a long-lived server. On a
 * platform that freezes between requests the progression would stall
 * mid-pipeline; a durable queue or the provider's own webhooks is the answer
 * there, not a longer timer.
 */

export type LogLine = {
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
};

type Stage = {
  status: DeploymentStatus;
  /** How long this stage appears to take, in milliseconds. */
  durationMs: number;
  lines: string[];
};

function buildStages(version: string, branch: string): Stage[] {
  return [
    {
      status: DeploymentStatus.QUEUED,
      durationMs: 1_200,
      lines: [`Queued deployment ${version}`, `Branch ${branch}`],
    },
    {
      status: DeploymentStatus.BUILDING,
      durationMs: 4_500,
      lines: [
        "Cloning repository",
        "Restoring dependency cache",
        "Installing dependencies with npm ci",
        "added 412 packages in 18s",
        "Running build: next build",
        "Compiled successfully",
      ],
    },
    {
      status: DeploymentStatus.TESTING,
      durationMs: 3_000,
      lines: ["Running test suite", "Test Suites: 12 passed, 12 total", "Tests: 84 passed"],
    },
    {
      status: DeploymentStatus.DEPLOYING,
      durationMs: 2_500,
      lines: ["Uploading build artifacts", "Invalidating edge cache", "Routing traffic"],
    },
  ];
}

function line(level: LogLine["level"], message: string): LogLine {
  return { timestamp: new Date().toISOString(), level, message };
}

async function appendLogs(deploymentId: string, additions: LogLine[]): Promise<void> {
  const current = await db.deployment.findUnique({
    where: { id: deploymentId },
    select: { logs: true },
  });

  const existing = Array.isArray(current?.logs) ? (current.logs as unknown as LogLine[]) : [];

  await db.deployment.update({
    where: { id: deploymentId },
    data: { logs: [...existing, ...additions] as unknown as never },
  });
}

/**
 * Advances a deployment through the pipeline.
 *
 * Deliberately not awaited by the route that starts it: the HTTP response
 * should return as soon as the record exists, and the interface reflects
 * progress by re-reading the row.
 */
export async function runDeployment(params: {
  deploymentId: string;
  userId: string;
  projectId: string;
  projectName: string;
  teamId: string | null;
  version: string;
  branch: string;
  /** Forces the outcome; otherwise most deployments succeed. */
  outcome?: "success" | "failure";
}): Promise<void> {
  const { deploymentId, userId, projectId, projectName, teamId, version, branch } = params;

  const stages = buildStages(version, branch);
  const startedAt = Date.now();

  // Roughly one in eight fails, which keeps the failure path visible in a demo
  // without making the workspace look broken.
  const fails =
    params.outcome === "failure" || (params.outcome !== "success" && Math.random() < 0.12);

  try {
    for (const stage of stages) {
      await db.deployment.update({
        where: { id: deploymentId },
        data: { status: stage.status },
      });

      await appendLogs(
        deploymentId,
        stage.lines.map((message) => line("info", message)),
      );

      await new Promise((resolve) => setTimeout(resolve, stage.durationMs));

      if (fails && stage.status === DeploymentStatus.TESTING) {
        await appendLogs(deploymentId, [
          line("error", "Test Suites: 1 failed, 11 passed, 12 total"),
          line("error", "projects.test.ts: expected 201, received 500"),
          line("error", "Build failed with exit code 1"),
        ]);

        await db.deployment.update({
          where: { id: deploymentId },
          data: {
            status: DeploymentStatus.FAILED,
            durationMs: Date.now() - startedAt,
            completedAt: new Date(),
          },
        });

        await recordActivity({
          type: ActivityType.DEPLOYMENT_FAILED,
          message: `Deployment ${version} failed for ${projectName}`,
          userId,
          projectId,
          teamId,
          deploymentId,
          metadata: { version },
        });

        return;
      }
    }

    await appendLogs(deploymentId, [
      line("success", `Deployment ${version} promoted to production`),
    ]);

    await db.deployment.update({
      where: { id: deploymentId },
      data: {
        status: DeploymentStatus.SUCCESS,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    await recordActivity({
      type: ActivityType.DEPLOYMENT_SUCCEEDED,
      message: `Deployed ${version} to ${projectName}`,
      userId,
      projectId,
      teamId,
      deploymentId,
      metadata: { version },
    });
  } catch (error) {
    // A crash mid-pipeline must not strand the row in a running state, or the
    // interface would show a spinner that never resolves.
    console.error("[deployment] pipeline failed:", error);

    await db.deployment
      .update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.FAILED,
          durationMs: Date.now() - startedAt,
          completedAt: new Date(),
        },
      })
      .catch(() => undefined);
  }
}

/** Next patch version after the project's most recent deployment. */
export async function nextVersion(projectId: string): Promise<string> {
  const latest = await db.deployment.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { version: true },
  });

  const match = latest?.version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return "v1.0.0";

  const [, major, minor, patch] = match;
  return `v${major}.${minor}.${Number(patch) + 1}`;
}
