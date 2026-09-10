import { z } from "zod";

/**
 * Shared between the API routes and the forms, so the browser and the server
 * enforce exactly the same rules. The server still re-validates every payload
 * — client-side checks are a convenience, never the boundary.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .email("Enter a valid email address")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  // bcrypt silently truncates beyond 72 bytes, so reject longer input outright.
  .max(72, "Password must be 72 characters or fewer");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
