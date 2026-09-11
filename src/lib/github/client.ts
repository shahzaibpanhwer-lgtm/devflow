import "server-only";

import { isGithubConfigured } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { GitHubError } from "@/lib/github/errors";

/**
 * Thin typed wrapper over the GitHub REST API.
 *
 * Imports "server-only" so a stray client import fails the build rather than
 * shipping an access token to the browser. Tokens are read from the Account
 * row at call time and never returned to callers.
 */

const GITHUB_API = "https://api.github.com";
const USER_AGENT = "DevFlow";

/** Returns the stored OAuth access token, or throws a classified error. */
async function accessTokenFor(userId: string): Promise<string> {
  if (!isGithubConfigured) {
    throw new GitHubError("not_configured", "GitHub OAuth is not configured");
  }

  const account = await db.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    throw new GitHubError("not_connected", "No GitHub account connected");
  }

  return account.access_token;
}

/** Whether this user has a usable GitHub connection, without throwing. */
export async function hasGithubConnection(userId: string): Promise<boolean> {
  if (!isGithubConfigured) return false;

  const account = await db.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  return Boolean(account?.access_token);
}

type RequestOptions = {
  /** Seconds to cache the response for. Zero disables caching. */
  revalidate?: number;
  searchParams?: Record<string, string | number | undefined>;
};

/**
 * Issues an authenticated request and maps failures onto GitHubError.
 *
 * Rate limiting is detected by the documented combination of a 403/429 with
 * x-ratelimit-remaining at zero — GitHub uses 403 for both "forbidden" and
 * "rate limited", and treating the latter as a permissions problem would send
 * the user off to check their repository access for no reason.
 */
export async function githubRequest<T>(
  userId: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = await accessTokenFor(userId);

  const url = new URL(`${GITHUB_API}${path}`);
  for (const [key, value] of Object.entries(options.searchParams ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": USER_AGENT,
      },
      next: { revalidate: options.revalidate ?? 300 },
    });
  } catch (error) {
    throw new GitHubError("network", `Could not reach GitHub: ${String(error)}`);
  }

  if (response.ok) {
    return (await response.json()) as T;
  }

  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");

  if ((response.status === 403 || response.status === 429) && remaining === "0") {
    const resetAt = reset ? Number(reset) * 1000 : null;
    const retryAfter = resetAt ? Math.max(0, Math.round((resetAt - Date.now()) / 1000)) : undefined;
    throw new GitHubError("rate_limited", "GitHub rate limit exceeded", retryAfter);
  }

  switch (response.status) {
    case 401:
      throw new GitHubError("unauthorized", "GitHub rejected the stored token");
    case 403:
      throw new GitHubError("forbidden", "GitHub denied access to this resource");
    case 404:
      throw new GitHubError("not_found", "GitHub resource not found");
    default:
      throw new GitHubError("unknown", `GitHub responded with ${response.status}`);
  }
}
