/**
 * Status vocabularies shared by projects and deployments.
 *
 * These mirror the Prisma enums introduced in the database phase; keeping the
 * presentation metadata here means a status renders identically everywhere it
 * appears without each component re-deriving colours or labels.
 */

export const PROJECT_STATUSES = ["DEVELOPMENT", "PRODUCTION", "PAUSED", "ARCHIVED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const DEPLOYMENT_STATUSES = [
  "QUEUED",
  "BUILDING",
  "TESTING",
  "DEPLOYING",
  "SUCCESS",
  "FAILED",
] as const;
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

type StatusMeta = {
  label: string;
  tone: StatusTone;
  /** True while the status represents work still in flight. */
  pulsing?: boolean;
};

export const PROJECT_STATUS_META: Record<ProjectStatus, StatusMeta> = {
  DEVELOPMENT: { label: "Development", tone: "info" },
  PRODUCTION: { label: "Production", tone: "success" },
  PAUSED: { label: "Paused", tone: "warning" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export const DEPLOYMENT_STATUS_META: Record<DeploymentStatus, StatusMeta> = {
  QUEUED: { label: "Queued", tone: "neutral" },
  BUILDING: { label: "Building", tone: "warning", pulsing: true },
  TESTING: { label: "Testing", tone: "warning", pulsing: true },
  DEPLOYING: { label: "Deploying", tone: "info", pulsing: true },
  SUCCESS: { label: "Success", tone: "success" },
  FAILED: { label: "Failed", tone: "danger" },
};

/** Ordered lifecycle used by the deployment timeline. */
export const DEPLOYMENT_PIPELINE = [
  "QUEUED",
  "BUILDING",
  "TESTING",
  "DEPLOYING",
  "SUCCESS",
] as const satisfies readonly DeploymentStatus[];
