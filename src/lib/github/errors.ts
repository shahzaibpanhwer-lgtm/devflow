/**
 * GitHub failures, classified.
 *
 * Callers need to tell these apart to react sensibly: a revoked token needs a
 * reconnect prompt, a rate limit needs a retry time, and a missing repository
 * is not an error worth alarming anyone about.
 */
export type GitHubErrorKind =
  | "not_configured"
  | "not_connected"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "network"
  | "unknown";

export class GitHubError extends Error {
  constructor(
    readonly kind: GitHubErrorKind,
    message: string,
    /** Seconds until the rate limit resets; only set when kind is rate_limited. */
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }

  /** HTTP status to surface for this failure. */
  get status(): number {
    switch (this.kind) {
      case "not_configured":
      case "not_connected":
        return 409;
      case "unauthorized":
        return 401;
      case "forbidden":
        return 403;
      case "not_found":
        return 404;
      case "rate_limited":
        return 429;
      default:
        return 502;
    }
  }
}

/** Message shown to the user for each failure kind. */
export function describeGitHubError(error: GitHubError): string {
  switch (error.kind) {
    case "not_configured":
      return "GitHub is not configured on this server. GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required.";
    case "not_connected":
      return "Connect your GitHub account to use this feature.";
    case "unauthorized":
      return "Your GitHub authorisation has expired. Reconnect your account to continue.";
    case "forbidden":
      return "Your GitHub account does not have access to that resource.";
    case "not_found":
      return "That repository could not be found. It may be private or renamed.";
    case "rate_limited":
      return error.retryAfter
        ? `GitHub's rate limit was reached. Try again in about ${Math.ceil(error.retryAfter / 60)} minutes.`
        : "GitHub's rate limit was reached. Try again shortly.";
    case "network":
      return "Could not reach GitHub. Check your connection and try again.";
    default:
      return "GitHub returned an unexpected response. Please try again.";
  }
}
