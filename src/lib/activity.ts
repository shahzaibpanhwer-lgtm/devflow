import type { ActivityType, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

type RecordActivityInput = {
  type: ActivityType;
  message: string;
  userId: string;
  projectId?: string | null;
  teamId?: string | null;
  deploymentId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Appends an entry to the activity timeline.
 *
 * Deliberately non-throwing: an audit-trail write must never be the reason a
 * user's action appears to fail. Failures are logged for investigation while
 * the originating request succeeds.
 */
export async function recordActivity(input: RecordActivityInput): Promise<void> {
  try {
    await db.activity.create({
      data: {
        type: input.type,
        message: input.message,
        userId: input.userId,
        projectId: input.projectId ?? null,
        teamId: input.teamId ?? null,
        deploymentId: input.deploymentId ?? null,
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      },
    });
  } catch (error) {
    console.error("[activity] failed to record entry:", error);
  }
}
