import { z } from "zod";

import { emailSchema } from "@/lib/validations/auth";

/** Roles an existing member can be moved to. OWNER is handled separately. */
export const ASSIGNABLE_ROLES = ["ADMIN", "DEVELOPER", "VIEWER"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(ASSIGNABLE_ROLES).default("DEVELOPER"),
});

export const changeRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
