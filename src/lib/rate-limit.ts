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
 * Whether `key` still has allowance left, without consuming any of it.
 *
 * Sign-in needs the check and the count to be separate steps, because only a
 * *failed* attempt should count towards the limit. Consuming on every check
 * would throttle successful sign-ins just as hard as failed ones, which
 * punishes ordinary use — and brute force is made of failures anyway, so
 * counting only those is both kinder and more precise.
 */
export function checkRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true, remaining: limit, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { allowed: true, remaining: limit - bucket.count, retryAfter: 0 };
}

/**
 * Forgets everything counted against `key`.
 *
 * Called when a sign-in succeeds, so a few mistyped passwords followed by the
 * right one leave no residue. Without this, someone who fumbled their password
 * and then got in would still be most of the way to a lockout for the rest of
 * the window.
 */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
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
