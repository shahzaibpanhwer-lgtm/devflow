import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Error text Postgres drivers use when the far end hung up on a pooled
 * connection that looked alive. The query never reached the database, so
 * replaying it once is safe — no statement can be applied twice.
 */
const CLOSED_CONNECTION_PATTERNS = [
  "Server has closed the connection",
  "Connection terminated",
  "ConnectionClosed",
  "connection closed",
  "ECONNRESET",
];

function isClosedConnection(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return CLOSED_CONNECTION_PATTERNS.some((pattern) => message.includes(pattern));
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and provide a PostgreSQL connection string.",
    );
  }

  const adapter = new PrismaPg({
    connectionString,
    /*
     * The adapter is backed by node-postgres, which ignores Prisma's engine
     * parameters (connection_limit, pool_timeout, socket_timeout and friends)
     * when they appear in the connection URL — pool behaviour has to be set
     * here. Retiring idle connections quickly keeps the pool ahead of servers
     * and proxies that hang up on them.
     */
    max: 10,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });

  const base = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  /*
   * Retry when a pooled connection turns out to be dead.
   *
   * A pool cannot know the other end hung up until it tries to use a
   * connection, so the first query after the server starts can fail on a
   * socket that was already gone — and because the pool may hold several such
   * connections, an immediate retry can draw another one. Backing off briefly
   * gives the pool time to discard the broken clients and dial fresh ones.
   *
   * Only closed-connection failures are retried, and such a query never
   * reached the database, so replaying it cannot apply a statement twice.
   */
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        const delays = [0, 60, 200];
        let lastError: unknown;

        for (const delay of delays) {
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
          try {
            return await query(args);
          } catch (error) {
            if (!isClosedConnection(error)) throw error;
            lastError = error;
          }
        }

        throw lastError;
      },
    },
  });
}

type DatabaseClient = ReturnType<typeof createClient>;

/**
 * Next.js clears the module registry on every hot reload in development, which
 * would otherwise open a new connection pool per reload until Postgres refuses
 * further clients. Caching the instance on `globalThis` keeps a single pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: DatabaseClient | undefined;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
