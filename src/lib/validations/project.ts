import { z } from "zod";

import { PROJECT_STATUSES } from "@/lib/status";

/**
 * Project payload rules, shared by the API routes and the forms.
 *
 * The server re-validates everything; the client copy exists purely so a user
 * sees a mistake before a round trip, never as the enforcement boundary.
 */

/**
 * Accepts an http(s) URL or an empty string, which is stored as null.
 *
 * The scheme check is not cosmetic: WHATWG URL parsing accepts arbitrary
 * schemes, so a bare `.url()` would happily store `javascript:alert(1)` — and
 * these values are rendered as link hrefs, which would make that stored XSS.
 */
const optionalUrl = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .url("Enter a valid URL (including https://)")
      .refine(
        (value) => {
          try {
            return /^https?:$/.test(new URL(value).protocol);
          } catch {
            return false;
          }
        },
        { message: "URL must start with http:// or https://" },
      ),
  ])
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

const optionalText = (max: number, label: string) =>
  z
    .union([
      z.literal(""),
      z.string().trim().max(max, `${label} must be ${max} characters or fewer`),
    ])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional();

/** "owner/repository", as GitHub itself formats it. */
const githubRepository = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(
        /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
        'Use the "owner/repository" format, e.g. vercel/next.js',
      ),
  ])
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .optional();

export const projectStatusSchema = z.enum(PROJECT_STATUSES);

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be 60 characters or fewer"),
  description: optionalText(280, "Description"),
  framework: optionalText(40, "Framework"),
  status: projectStatusSchema.default("DEVELOPMENT"),
  productionUrl: optionalUrl,
  repositoryUrl: optionalUrl,
  githubRepository,
});

/**
 * Every field optional, but at least one must be present — an empty PATCH is
 * a client bug, not a no-op worth recording as an update.
 */
export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

/** Query parameters for the project list endpoint. */
export const listProjectsSchema = z.object({
  status: projectStatusSchema.optional(),
  search: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(12),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsSchema>;
