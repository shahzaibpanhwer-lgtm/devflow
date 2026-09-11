import "server-only";

import { ActivityType } from "@prisma/client";

import { recordActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { getRepository } from "@/lib/github/repositories";

/**
 * Copies the current GitHub metadata for a repository onto a project.
 *
 * The stored row is a cache, refreshed on demand — the project page reads it
 * so a rate-limited or unreachable GitHub degrades to slightly stale numbers
 * rather than an empty panel.
 */
export async function syncRepository(params: {
  userId: string;
  projectId: string;
  fullName: string;
  /** Records an activity entry the first time a repository is attached. */
  announce?: boolean;
}) {
  const { userId, projectId, fullName, announce = false } = params;

  const repository = await getRepository(userId, fullName);

  const data = {
    githubId: BigInt(repository.id),
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description,
    url: repository.html_url,
    defaultBranch: repository.default_branch,
    language: repository.language,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    openIssues: repository.open_issues_count,
    isPrivate: repository.private,
    pushedAt: repository.pushed_at ? new Date(repository.pushed_at) : null,
    lastSyncedAt: new Date(),
  };

  const [saved, project] = await db.$transaction([
    db.repository.upsert({
      where: { projectId },
      create: { projectId, ...data },
      update: data,
    }),
    // Keep the project's own handle in step, so the card and public page agree
    // with the synced repository without a second lookup.
    db.project.update({
      where: { id: projectId },
      data: {
        githubRepository: repository.full_name,
        repositoryUrl: repository.html_url,
      },
      select: { id: true, name: true, teamId: true },
    }),
  ]);

  if (announce) {
    await recordActivity({
      type: ActivityType.REPOSITORY_CONNECTED,
      message: `Connected ${repository.full_name} to ${project.name}`,
      userId,
      projectId,
      teamId: project.teamId,
      metadata: { repository: repository.full_name },
    });
  }

  return saved;
}

export async function disconnectRepository(params: { userId: string; projectId: string }) {
  const { userId, projectId } = params;

  const existing = await db.repository.findUnique({
    where: { projectId },
    select: { fullName: true },
  });

  const [, project] = await db.$transaction([
    db.repository.deleteMany({ where: { projectId } }),
    db.project.update({
      where: { id: projectId },
      data: { githubRepository: null, repositoryUrl: null },
      select: { id: true, name: true, teamId: true },
    }),
  ]);

  await recordActivity({
    type: ActivityType.REPOSITORY_DISCONNECTED,
    message: `Disconnected ${existing?.fullName ?? "repository"} from ${project.name}`,
    userId,
    projectId,
    teamId: project.teamId,
  });
}
