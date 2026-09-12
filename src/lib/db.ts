import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { Pool } from "pg";

/**
 * Reads that Prisma reports as connection failures rather than query
 * failures. The query never reached the server, so repeating it is safe.
 */
const CONNECTION_ERROR_CODES = new Set([
  "P1017", // server closed the connection
  "P1001", // cannot reach the server
  "P1002", // timed out reaching the server
  "P2010", // raw query failed — the reason is only in the message
]);

/*
 * Retry budget for a read whose connection died.
 *
 * Enough attempts to outlast a pool where every connection has gone stale at
 * once, which is what a burst of concurrent renders after an idle spell can
 * produce. The worst case adds well under two seconds before the error is
 * surfaced, and the common case costs one extra round trip.
 */
const RETRY_ATTEMPTS = 8;
const RETRY_BASE_DELAY_MS = 25;
const RETRY_MAX_DELAY_MS = 250;

/** Operations with no side effects, and therefore safe to repeat. */
const RETRYABLE_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "$queryRaw",
  "$queryRawUnsafe",
]);

/**
 * Transient connection trouble, as opposed to a query the server rejected.
 *
 * Both the code and the message are examined, and neither short-circuits the
 * other. An earlier version returned on the code alone, which silently
 * excluded raw queries: those fail as P2010 — a generic "raw query failed" —
 * with the real reason only in the message. Since the analytics page is built
 * on four raw queries, it was the one page the retry never protected.
 */
function isConnectionError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    CONNECTION_ERROR_CODES.has(error.code) &&
    error.code !== "P2010"
  ) {
    return true;
  }

  /*
   * Situations the adapter reports in the message rather than a code. All
   * transient, and all safe to repeat for a read:
   *
   *   - the socket was closed underneath us
   *   - the pool could not hand one out in time, because a burst of
   *     concurrent renders wanted more connections than it holds
   */
  const message = error instanceof Error ? error.message : String(error);
  return /ConnectionClosed|Server has closed the connection|Connection terminated|timeout exceeded when trying to connect/i.test(
    message,
  );
}

/**
 * Reads a pool setting from the environment, falling back to the default.
 *
 * The defaults below suit a hosted Postgres. The local `prisma dev` server is
 * a different animal: it discards pooled connections far sooner than a hosted
 * database does, and its own start-up notes ask for "the smallest positive"
 * idle timeout. Left at the hosted default it keeps handing back sockets it
 * has already closed, which showed up as intermittent 500s on whichever page
 * happened to ask first after a quiet spell. Rather than pick one number that
 * is wrong for one of the two, each is overridable.
 */
function poolSetting(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number, got "${raw}"`);
  }

  return value;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and provide a PostgreSQL connection string.",
    );
  }

  /*
   * The pool is constructed here rather than left to the adapter, so an
   * `error` listener can be attached. node-postgres emits that event when a
   * pooled connection dies while idle; with no listener Node treats it as an
   * unhandled error, and the client is not reliably evicted — leaving the
   * pool to hand the dead connection out again on the next request.
   */
  const pool = new Pool({
    connectionString,
    /*
     * The adapter is backed by node-postgres, which ignores Prisma's engine
     * parameters in the URL — pool behaviour has to be configured here.
     *
     * idleTimeoutMillis is the balance to strike. Too long and the pool holds
     * connections the server has already hung up on, handing out dead ones.
     * Too short — 10s, as this was — and a burst of page renders spends its
     * time re-establishing connections it just discarded, until acquisition
     * itself times out. Thirty seconds stays ahead of typical proxy timeouts
     * without churning under load.
     *
     * A single dashboard render issues six queries in parallel, so the pool
     * has to absorb several times the number of concurrent requests.
     */
    max: poolSetting("DATABASE_POOL_MAX", 10),
    idleTimeoutMillis: poolSetting("DATABASE_POOL_IDLE_TIMEOUT_MS", 30_000),
    connectionTimeoutMillis: poolSetting("DATABASE_POOL_CONNECTION_TIMEOUT_MS", 15_000),
    keepAlive: true,
  });

  // Logged rather than thrown: a connection dying while idle is routine, and
  // the pool replaces it. Without this handler it would crash the process.
  pool.on("error", (error) => {
    console.error("[db] idle client error, connection discarded:", error.message);
  });

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  /**
   * Retries a read whose connection died underneath it.
   *
   * Even with an aggressive idle timeout a connection can be closed between
   * being handed out and being used — by a proxy, a failover, or a platform
   * recycling idle sockets. Left alone that surfaces as a 500 on a page that
   * would have rendered perfectly on the next attempt, which is what it was
   * doing to the public project page.
   *
   * Only side-effect-free operations are repeated. A create or update that
   * failed this way *might* have committed before the socket dropped, and
   * silently repeating it could write twice — so those still surface the
   * error and let the caller decide.
   */
  return client.$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        const attempts = RETRYABLE_OPERATIONS.has(operation) ? RETRY_ATTEMPTS : 1;
        let lastError: unknown;

        for (let attempt = 0; attempt < attempts; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;
            if (attempt === attempts - 1 || !isConnectionError(error)) throw error;

            /*
             * Short, capped backoff rather than a doubling one.
             *
             * The thing being waited out is not a busy server: a dead socket
             * fails the moment it is used, and the next attempt draws a
             * *different* connection from the pool. So what matters is getting
             * through the stale ones, not pausing politely between tries — and
             * a doubling backoff spends its whole budget sleeping instead.
             *
             * Measured on a local Postgres that drops connections eagerly:
             * four tries at a doubling backoff left roughly one request in
             * twelve failing under concurrent load, because the pool can hold
             * more stale connections than that many tries can cycle past.
             */
            const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        throw lastError;
      },
    },
  });
}

/**
 * Next.js clears the module registry on every hot reload in development, which
 * would otherwise open a new connection pool per reload until Postgres refuses
 * further clients. Caching the instance on `globalThis` keeps a single pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
