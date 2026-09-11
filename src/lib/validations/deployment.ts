import { z } from "zod";

import { DEPLOYMENT_STATUSES } from "@/lib/status";

export const deploymentEnvironments = ["PRODUCTION", "PREVIEW", "DEVELOPMENT"] as const;

export const createDeploymentSchema = z.object({
  projectId: z.string({ error: "Choose a project to deploy" }).min(1, "Choose a project to deploy"),
  /** Semantic-ish version tag, e.g. v1.4.2. Generated when omitted. */
  version: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .max(30, "Version must be 30 characters or fewer")
        .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores"),
    ])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  environment: z.enum(deploymentEnvironments).default("PRODUCTION"),
  branch: z
    .union([z.literal(""), z.string().trim().max(80)])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
  commitMessage: z
    .union([z.literal(""), z.string().trim().max(140)])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional(),
});

export const listDeploymentsSchema = z.object({
  projectId: z.string().optional(),
  status: z.enum(DEPLOYMENT_STATUSES).optional(),
  environment: z.enum(deploymentEnvironments).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateDeploymentInput = z.infer<typeof createDeploymentSchema>;
export type ListDeploymentsQuery = z.infer<typeof listDeploymentsSchema>;
