import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit, clearRateLimit, clientIdentifier, rateLimit } from "@/lib/rate-limit";

/**
 * The limiter keeps its counters in a module-level map, so every test uses its
 * own key rather than trying to reset shared state between them.
 */
let counter = 0;
function freshKey(): string {
  counter += 1;
  return `test-key-${counter}-${Math.random().toString(36).slice(2)}`;
}

const LIMIT = { limit: 3, windowMs: 60_000 };

describe("rateLimit", () => {
  it("allows up to the limit and then refuses", () => {
    const key = freshKey();

    expect(rateLimit(key, LIMIT).allowed).toBe(true);
    expect(rateLimit(key, LIMIT).allowed).toBe(true);
    expect(rateLimit(key, LIMIT).allowed).toBe(true);

    const refused = rateLimit(key, LIMIT);
    expect(refused.allowed).toBe(false);
    expect(refused.remaining).toBe(0);
    expect(refused.retryAfter).toBeGreaterThan(0);
  });

  it("counts each key separately", () => {
    const a = freshKey();
    const b = freshKey();

    rateLimit(a, LIMIT);
    rateLimit(a, LIMIT);
    rateLimit(a, LIMIT);

    expect(rateLimit(a, LIMIT).allowed).toBe(false);
    expect(rateLimit(b, LIMIT).allowed).toBe(true);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /*
   * The property the sign-in path depends on. If checking consumed allowance,
   * signing in successfully would count against the limit and ordinary use
   * would lock itself out.
   */
  it("does not consume allowance", () => {
    const key = freshKey();

    for (let i = 0; i < 50; i += 1) {
      expect(checkRateLimit(key, LIMIT.limit).allowed).toBe(true);
    }

    expect(rateLimit(key, LIMIT).allowed).toBe(true);
  });

  it("reports refusal once the limit is reached", () => {
    const key = freshKey();

    rateLimit(key, LIMIT);
    rateLimit(key, LIMIT);
    expect(checkRateLimit(key, LIMIT.limit).allowed).toBe(true);

    rateLimit(key, LIMIT);
    const blocked = checkRateLimit(key, LIMIT.limit);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it("allows again once the window has passed", () => {
    const key = freshKey();

    rateLimit(key, LIMIT);
    rateLimit(key, LIMIT);
    rateLimit(key, LIMIT);
    expect(checkRateLimit(key, LIMIT.limit).allowed).toBe(false);

    vi.advanceTimersByTime(LIMIT.windowMs + 1);

    expect(checkRateLimit(key, LIMIT.limit).allowed).toBe(true);
  });
});

describe("clearRateLimit", () => {
  it("forgets what was counted, so a success wipes earlier failures", () => {
    const key = freshKey();

    rateLimit(key, LIMIT);
    rateLimit(key, LIMIT);
    rateLimit(key, LIMIT);
    expect(checkRateLimit(key, LIMIT.limit).allowed).toBe(false);

    clearRateLimit(key);

    expect(checkRateLimit(key, LIMIT.limit).allowed).toBe(true);
    expect(rateLimit(key, LIMIT).remaining).toBe(LIMIT.limit - 1);
  });
});

describe("clientIdentifier", () => {
  it("takes the original client from x-forwarded-for", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" },
    });

    expect(clientIdentifier(request)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("http://localhost/", {
      headers: { "x-real-ip": "203.0.113.9" },
    });

    expect(clientIdentifier(request)).toBe("203.0.113.9");
  });

  /*
   * A missing header has to collapse to one shared bucket rather than to a
   * unique one. Returning something unique per request would hand every
   * caller a fresh allowance and silently disable the limiter.
   */
  it("degrades to a single shared bucket when no address header is present", () => {
    const a = clientIdentifier(new Request("http://localhost/"));
    const b = clientIdentifier(new Request("http://localhost/other"));

    expect(a).toBe("unknown");
    expect(b).toBe(a);
  });
});
