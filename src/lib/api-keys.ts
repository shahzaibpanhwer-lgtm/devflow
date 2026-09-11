import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { db } from "@/lib/db";

/**
 * API key issuing and verification.
 *
 * Only a hash of each key is ever stored. The plaintext is returned once, at
 * creation, and is unrecoverable afterwards — losing it means issuing a new
 * key, which is the correct trade: a store that can show you the secret again
 * is a store that leaks every secret when it is breached.
 */

const KEY_PREFIX = "dfk_live_";
/** 32 bytes of entropy, hex-encoded. */
const SECRET_BYTES = 32;

export type IssuedKey = {
  /** Full secret. Returned once and never persisted. */
  plaintext: string;
  hashedKey: string;
  prefix: string;
  lastFour: string;
};

/**
 * SHA-256 rather than bcrypt.
 *
 * API keys carry 32 bytes of random entropy, so there is no dictionary to
 * attack and no benefit from a slow hash — while a slow hash on every API call
 * would be a denial-of-service surface all of its own. This reasoning does
 * *not* transfer to passwords, which are low-entropy and do use bcrypt.
 */
export function hashKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function generateKey(): IssuedKey {
  const plaintext = `${KEY_PREFIX}${randomBytes(SECRET_BYTES).toString("hex")}`;

  return {
    plaintext,
    hashedKey: hashKey(plaintext),
    // Enough to recognise a key in a list without revealing anything useful.
    prefix: plaintext.slice(0, KEY_PREFIX.length + 4),
    lastFour: plaintext.slice(-4),
  };
}

/** Constant-time comparison, so a mismatch reveals nothing through timing. */
function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type AuthenticatedKey = {
  id: string;
  projectId: string;
  userId: string;
};

/**
 * Resolves an Authorization header to a live API key.
 *
 * Returns null for anything not usable — missing, malformed, unknown, revoked
 * or expired — so callers cannot accidentally distinguish those cases in a
 * response and turn the endpoint into a key oracle.
 */
export async function authenticateApiKey(request: Request): Promise<AuthenticatedKey | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const presented = header.slice("Bearer ".length).trim();
  if (!presented.startsWith(KEY_PREFIX)) return null;

  const hashed = hashKey(presented);

  const key = await db.apiKey.findUnique({
    where: { hashedKey: hashed },
    select: {
      id: true,
      projectId: true,
      userId: true,
      hashedKey: true,
      revokedAt: true,
      expiresAt: true,
    },
  });

  if (!key) return null;
  if (!hashesMatch(key.hashedKey, hashed)) return null;
  if (key.revokedAt) return null;
  if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) return null;

  /*
   * Recording use must never fail the request it is describing, and it is not
   * awaited: an extra write on the hot path would add latency to every
   * authenticated call for a field only ever read by a human.
   */
  void db.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch((error: unknown) => {
      console.error("[api-keys] could not record last use:", error);
    });

  return { id: key.id, projectId: key.projectId, userId: key.userId };
}

/** Keys for a project, without anything secret. */
export function listProjectKeys(projectId: string) {
  return db.apiKey.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastFour: true,
      lastUsedAt: true,
      revokedAt: true,
      expiresAt: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export type ProjectApiKey = Awaited<ReturnType<typeof listProjectKeys>>[number];
