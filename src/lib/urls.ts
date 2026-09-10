import type { Route } from "next";

/**
 * Sanitises a `?callbackUrl=` parameter before it is used for navigation.
 *
 * Only same-origin absolute paths are accepted. Protocol-relative values such
 * as `//evil.example` are rejected too — the browser treats them as external
 * origins, so allowing them would turn sign-in into an open redirect.
 */
export function safeCallbackUrl(value: string | undefined | null, fallback = "/dashboard"): Route {
  if (value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")) {
    return value as Route;
  }

  return fallback as Route;
}
