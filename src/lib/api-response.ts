import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Every DevFlow API route answers with the same envelope, so clients never
 * have to guess at the shape of a response:
 *
 *   success -> { success: true,  data: … }
 *   failure -> { success: false, error: { message, code?, fields? } }
 */

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    message: string;
    code?: string;
    /** Field-level validation messages, keyed by field name. */
    fields?: Record<string, string[]>;
  };
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function fail(
  message: string,
  status: number,
  options?: { code?: string; fields?: Record<string, string[]> },
): NextResponse<ApiFailure> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...(options?.code ? { code: options.code } : {}),
        ...(options?.fields ? { fields: options.fields } : {}),
      },
    },
    { status },
  );
}

export const badRequest = (message = "Invalid request", fields?: Record<string, string[]>) =>
  fail(message, 400, { code: "BAD_REQUEST", fields });

export const unauthorized = (message = "You must be signed in to do that") =>
  fail(message, 401, { code: "UNAUTHORIZED" });

export const forbidden = (message = "You do not have access to this resource") =>
  fail(message, 403, { code: "FORBIDDEN" });

export const notFound = (message = "Not found") => fail(message, 404, { code: "NOT_FOUND" });

export const conflict = (message: string) => fail(message, 409, { code: "CONFLICT" });

export const tooManyRequests = (message = "Too many requests. Try again shortly.") =>
  fail(message, 429, { code: "RATE_LIMITED" });

/**
 * Last line of defence for unexpected failures. The real error is logged
 * server-side; the client only ever sees a generic message, so database
 * errors and stack traces never leak into a response.
 */
export function serverError(error: unknown, context: string): NextResponse<ApiFailure> {
  console.error(`[api] ${context}:`, error);
  return fail("Something went wrong. Please try again.", 500, { code: "INTERNAL_ERROR" });
}

/** Turns a Zod failure into a 400 carrying per-field messages. */
export function validationFailed(error: ZodError): NextResponse<ApiFailure> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    const existing = fields[key];
    if (existing) {
      existing.push(issue.message);
    } else {
      fields[key] = [issue.message];
    }
  }

  return badRequest("Please correct the highlighted fields", fields);
}
