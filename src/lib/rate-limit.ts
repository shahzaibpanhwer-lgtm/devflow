/**
 * Fixed-window rate limiter backed by an in-process map.
 *
 * This is deliberately simple. It protects a single server instance against
 * scripted abuse of the sensitive endpoints (registration, sign-in, key
 * creation) without adding infrastructure. It is *not* a distributed limiter:
 * on a multi-instance deployment each instance keeps its own counters, so a
 * shared store such as Redis or Upstash should be swapped in behind this same
 * interface before relying on it in production.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** Drops expired buckets so the map cannot grow without bound. */
function evictExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

let lastEviction = 0;
const EVICTION_INTERVAL_MS = 60_000;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds the caller should wait before retrying. */
  retryAfter: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  if (now - lastEviction > EVICTION_INTERVAL_MS) {
    evictExpired(now);
    lastEviction = now;
  }

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfter: 0 };
}

/**
 * Best-effort client address. Behind a proxy the first entry of
 * `x-forwarded-for` is the original client; falling back to a constant means a
 * missing header degrades to a global limit rather than no limit at all.
 */
export function clientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}
