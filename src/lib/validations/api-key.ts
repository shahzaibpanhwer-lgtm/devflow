import { z } from "zod";

export const createApiKeySchema = z.object({
  name: z
    .string({ error: "Name the key so you can recognise it later" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be 60 characters or fewer"),
  /** Days until the key expires; omitted means it does not expire. */
  expiresInDays: z.coerce.number().int().min(1).max(365).nullable().optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
