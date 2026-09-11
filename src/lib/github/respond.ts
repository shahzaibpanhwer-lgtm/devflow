import { fail, serverError, type ApiFailure } from "@/lib/api-response";
import { AuthError } from "@/lib/authz";
import { describeGitHubError, GitHubError } from "@/lib/github/errors";
import type { NextResponse } from "next/server";

/**
 * Maps the failures a GitHub-backed route can produce onto the shared response
 * envelope, so every one of them answers in the same shape with a message fit
 * to show a user.
 */
export function respondToGithubFailure(error: unknown, context: string): NextResponse<ApiFailure> {
  if (error instanceof AuthError) {
    return fail(error.message, error.status);
  }

  if (error instanceof GitHubError) {
    return fail(describeGitHubError(error), error.status, {
      code: `GITHUB_${error.kind.toUpperCase()}`,
      ...(error.retryAfter !== undefined ? { fields: {} } : {}),
    });
  }

  return serverError(error, context);
}
