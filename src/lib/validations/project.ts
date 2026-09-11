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

/**
 * The project fields, with no defaults applied.
 *
 * Creation and update are built from this separately. They cannot share one
 * schema through `.partial()`: that makes a field optional but leaves its
 * `.default()` in place, so an absent key still arrives with a value. A patch
 * that only renamed a project was emerging with `status: "DEVELOPMENT"`
 * attached and silently demoting live projects.
 */
const projectFields = {
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be 60 characters or fewer"),
  description: optionalText(280, "Description"),
  framework: optionalText(40, "Framework"),
  status: projectStatusSchema,
  productionUrl: optionalUrl,
  repositoryUrl: optionalUrl,
  githubRepository,
  /** Publishes the project at /p/[slug]. Opt-in, never implied. */
  isPublic: z.boolean().optional(),
};

export const createProjectSchema = z.object({
  ...projectFields,
  // A new project has to start somewhere, so this default is wanted here.
  status: projectStatusSchema.default("DEVELOPMENT"),
});

/**
 * Every field optional, and no defaults — an update must change only what was
 * actually sent. At least one field must be present, since an empty PATCH is a
 * client bug rather than a no-op worth recording as an update.
 */
export const updateProjectSchema = z
  .object({
    ...projectFields,
    status: projectStatusSchema.optional(),
  })
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
