import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import {
  badRequest,
  conflict,
  created,
  serverError,
  tooManyRequests,
  validationFailed,
} from "@/lib/api-response";
import { db } from "@/lib/db";
import { clientIdentifier, rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";

/** Registration is a write that creates accounts, so it is kept deliberately slow. */
const RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`register:${clientIdentifier(request)}`, RATE_LIMIT);
    if (!limit.allowed) {
      return tooManyRequests(
        `Too many sign-up attempts. Try again in ${limit.retryAfter} seconds.`,
      );
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
      return validationFailed(parsed.error);
    }

    const { name, email, password } = parsed.data;

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const user = await db.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true, createdAt: true },
      });

      return created({ user });
    } catch (error) {
      // P2002 is the unique constraint on User.email. Relying on the database
      // rather than a prior lookup removes the race between check and insert.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return conflict("An account with that email already exists");
      }
      throw error;
    }
  } catch (error) {
    return serverError(error, "POST /api/auth/register");
  }
}
