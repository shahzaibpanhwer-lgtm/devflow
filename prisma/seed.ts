/**
 * Development seed.
 *
 * Produces a workspace that looks like it has been in use for a quarter: a
 * team with four roles, four projects at different lifecycle stages, a
 * deployment history, issued API keys, documentation, an activity trail and
 * ninety days of API traffic for the analytics charts to aggregate.
 *
 * The script is idempotent — it clears the tables it owns before inserting, so
 * it can be run repeatedly without duplicating rows.
 *
 * Run with: npm run db:seed
 */

import { PrismaPg } from "@prisma/adapter-pg";
import {
  ActivityType,
  DeploymentEnvironment,
  DeploymentStatus,
  PrismaClient,
  ProjectStatus,
  TeamRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";

// Run directly with `node prisma/seed.ts`, which does not load .env for us.
const envFile = path.join(process.cwd(), ".env");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Provide it in .env before seeding.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Deterministic pseudo-random generator so reseeding produces stable data. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = createRandom(20260909);

function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) {
    throw new Error("pick() called with an empty array");
  }
  return item;
}

function daysAgo(days: number, hour = 12): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

function commitSha(): string {
  return randomBytes(20).toString("hex");
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const COMMIT_MESSAGES = [
  "feat: add lead scoring pipeline",
  "fix: refresh token rotation on expiry",
  "refactor: extract billing service",
  "perf: memoise dashboard aggregate query",
  "chore: bump dependencies",
  "feat: paginate activity timeline",
  "fix: handle empty repository response",
  "style: tighten table density",
  "test: cover project authorisation rules",
  "feat: add webhook retry queue",
] as const;

const API_PATHS = [
  { method: "GET", path: "/api/projects" },
  { method: "POST", path: "/api/projects" },
  { method: "GET", path: "/api/projects/:id" },
  { method: "PATCH", path: "/api/projects/:id" },
  { method: "DELETE", path: "/api/projects/:id" },
  { method: "GET", path: "/api/deployments" },
  { method: "POST", path: "/api/deployments" },
  { method: "GET", path: "/api/analytics/summary" },
  { method: "GET", path: "/api/keys" },
  { method: "GET", path: "/api/team/members" },
] as const;

const USER_AGENTS = [
  "DevFlow-CLI/1.4.2",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "curl/8.6.0",
  "node-fetch/3.3.2",
] as const;

/** Builds a realistic, clearly simulated build log for one deployment. */
function buildLogs(version: string, success: boolean) {
  const base = [
    { level: "info", message: `Cloning repository at ${version}` },
    { level: "info", message: "Installing dependencies with npm ci" },
    { level: "info", message: "added 412 packages in 18s" },
    { level: "info", message: "Running build: next build" },
    { level: "info", message: "Compiled successfully in 12.6s" },
    { level: "info", message: "Collecting page data" },
    { level: "info", message: "Generating static pages (12/12)" },
  ];

  const tail = success
    ? [
        { level: "info", message: "Uploading build artifacts" },
        { level: "success", message: "Deployment promoted to production" },
      ]
    : [
        { level: "error", message: "Type error: Property 'slug' does not exist on type 'Project'" },
        { level: "error", message: "Build failed with exit code 1" },
      ];

  const start = Date.now() - base.length * 1000;
  return [...base, ...tail].map((line, index) => ({
    timestamp: new Date(start + index * 1000).toISOString(),
    level: line.level,
    message: line.message,
  }));
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("Clearing existing data …");

  // Ordered so that child rows never outlive their parents. Cascades would
  // handle most of this, but being explicit keeps the intent readable.
  await db.apiRequest.deleteMany();
  await db.activity.deleteMany();
  await db.documentation.deleteMany();
  await db.apiKey.deleteMany();
  await db.deployment.deleteMany();
  await db.repository.deleteMany();
  await db.project.deleteMany();
  await db.teamMember.deleteMany();
  await db.team.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.verificationToken.deleteMany();
  await db.user.deleteMany();

  console.log("Creating users …");

  const passwordHash = await bcrypt.hash("devflow123", 12);

  const owner = await db.user.create({
    data: {
      name: "Shahzaib Panhwer",
      email: "demo@devflow.app",
      passwordHash,
      emailVerified: daysAgo(120),
      createdAt: daysAgo(120),
    },
  });

  const admin = await db.user.create({
    data: {
      name: "Amara Khan",
      email: "amara@devflow.app",
      passwordHash,
      emailVerified: daysAgo(96),
      createdAt: daysAgo(96),
    },
  });

  const developer = await db.user.create({
    data: {
      name: "Tobias Meyer",
      email: "tobias@devflow.app",
      passwordHash,
      emailVerified: daysAgo(74),
      createdAt: daysAgo(74),
    },
  });

  const viewer = await db.user.create({
    data: {
      name: "Rin Watanabe",
      email: "rin@devflow.app",
      passwordHash,
      emailVerified: daysAgo(41),
      createdAt: daysAgo(41),
    },
  });

  console.log("Creating team …");

  const team = await db.team.create({
    data: {
      name: "Northwind Labs",
      slug: "northwind-labs",
      description: "Product engineering team building internal developer tooling.",
      createdAt: daysAgo(118),
      members: {
        create: [
          { userId: owner.id, role: TeamRole.OWNER, createdAt: daysAgo(118) },
          { userId: admin.id, role: TeamRole.ADMIN, createdAt: daysAgo(95) },
          { userId: developer.id, role: TeamRole.DEVELOPER, createdAt: daysAgo(73) },
          { userId: viewer.id, role: TeamRole.VIEWER, createdAt: daysAgo(40) },
        ],
      },
    },
  });

  console.log("Creating projects …");

  const projectSpecs = [
    {
      name: "LeadFinder",
      slug: "leadfinder",
      description: "CRM and lead management platform with automated enrichment and scoring.",
      framework: "Next.js",
      status: ProjectStatus.PRODUCTION,
      productionUrl: "https://leadfinder.app",
      githubRepository: "northwind-labs/leadfinder",
      language: "TypeScript",
      stars: 1284,
      forks: 96,
      openIssues: 12,
      createdDaysAgo: 112,
      deployments: 42,
    },
    {
      name: "Atlas Analytics",
      slug: "atlas-analytics",
      description: "Self-hosted product analytics with a SQL-first query builder.",
      framework: "Next.js",
      status: ProjectStatus.PRODUCTION,
      productionUrl: "https://atlas-analytics.io",
      githubRepository: "northwind-labs/atlas-analytics",
      language: "TypeScript",
      stars: 642,
      forks: 41,
      openIssues: 7,
      createdDaysAgo: 84,
      deployments: 27,
    },
    {
      name: "Relay Gateway",
      slug: "relay-gateway",
      description: "Webhook delivery service with retries, signing and replay.",
      framework: "Node.js",
      status: ProjectStatus.DEVELOPMENT,
      productionUrl: null,
      githubRepository: "northwind-labs/relay-gateway",
      language: "Go",
      stars: 188,
      forks: 14,
      openIssues: 23,
      createdDaysAgo: 46,
      deployments: 16,
    },
    {
      name: "Beacon Status",
      slug: "beacon-status",
      description: "Public status pages and uptime monitoring for internal services.",
      framework: "Astro",
      status: ProjectStatus.PAUSED,
      productionUrl: "https://status.northwind.dev",
      githubRepository: "northwind-labs/beacon-status",
      language: "TypeScript",
      stars: 97,
      forks: 6,
      openIssues: 3,
      createdDaysAgo: 61,
      deployments: 9,
    },
  ] as const;

  const projects = [];

  for (const spec of projectSpecs) {
    const project = await db.project.create({
      data: {
        name: spec.name,
        slug: spec.slug,
        description: spec.description,
        framework: spec.framework,
        status: spec.status,
        productionUrl: spec.productionUrl,
        repositoryUrl: `https://github.com/${spec.githubRepository}`,
        githubRepository: spec.githubRepository,
        ownerId: owner.id,
        teamId: team.id,
        createdAt: daysAgo(spec.createdDaysAgo),
        repository: {
          create: {
            name: spec.slug,
            fullName: spec.githubRepository,
            description: spec.description,
            url: `https://github.com/${spec.githubRepository}`,
            defaultBranch: "main",
            language: spec.language,
            stars: spec.stars,
            forks: spec.forks,
            openIssues: spec.openIssues,
            isPrivate: false,
            pushedAt: daysAgo(randomInt(0, 4)),
            lastSyncedAt: daysAgo(0),
            createdAt: daysAgo(spec.createdDaysAgo),
          },
        },
      },
    });

    projects.push({ project, spec });
  }

  console.log("Creating deployments …");

  const activityRows: {
    type: ActivityType;
    message: string;
    userId: string;
    projectId: string;
    teamId: string;
    deploymentId?: string;
    metadata?: Record<string, string>;
    createdAt: Date;
  }[] = [];

  for (const { project, spec } of projects) {
    for (let index = 0; index < spec.deployments; index += 1) {
      // Newest deployment first, spaced back through the project's lifetime.
      const age = Math.round((index / spec.deployments) * spec.createdDaysAgo);
      const isNewest = index === 0;
      const failed = !isNewest && random() < 0.14;

      const major = 1;
      const minor = Math.floor((spec.deployments - index) / 10);
      const patch = (spec.deployments - index) % 10;
      const version = `v${major}.${minor}.${patch}`;

      let status: DeploymentStatus;
      if (isNewest && spec.status === ProjectStatus.DEVELOPMENT) {
        status = DeploymentStatus.BUILDING;
      } else if (failed) {
        status = DeploymentStatus.FAILED;
      } else {
        status = DeploymentStatus.SUCCESS;
      }

      const running = status === DeploymentStatus.BUILDING;
      const durationMs = running ? null : randomInt(42_000, 220_000);
      const startedAt = daysAgo(age, randomInt(8, 20));

      const deployment = await db.deployment.create({
        data: {
          projectId: project.id,
          version,
          environment:
            index % 3 === 1 ? DeploymentEnvironment.PREVIEW : DeploymentEnvironment.PRODUCTION,
          status,
          durationMs,
          commitSha: commitSha(),
          commitMessage: pick(COMMIT_MESSAGES),
          branch: index % 3 === 1 ? `feature/${pick(["auth", "billing", "search"])}` : "main",
          logs: running ? buildLogs(version, true).slice(0, 4) : buildLogs(version, !failed),
          startedAt,
          completedAt: running ? null : new Date(startedAt.getTime() + (durationMs ?? 0)),
          createdAt: startedAt,
        },
      });

      if (index < 3) {
        activityRows.push({
          type: failed ? ActivityType.DEPLOYMENT_FAILED : ActivityType.DEPLOYMENT_SUCCEEDED,
          message: failed
            ? `Deployment ${version} failed for ${project.name}`
            : `Deployed ${version} to ${project.name}`,
          userId: pick([owner.id, admin.id, developer.id]),
          projectId: project.id,
          teamId: team.id,
          deploymentId: deployment.id,
          metadata: { version },
          createdAt: startedAt,
        });
      }
    }
  }

  console.log("Creating API keys …");

  for (const { project, spec } of projects.slice(0, 3)) {
    const secret = `dfk_live_${randomBytes(24).toString("hex")}`;
    const hashedKey = createHash("sha256").update(secret).digest("hex");

    await db.apiKey.create({
      data: {
        projectId: project.id,
        userId: owner.id,
        name: `${spec.name} production`,
        hashedKey,
        prefix: secret.slice(0, 12),
        lastFour: secret.slice(-4),
        lastUsedAt: daysAgo(randomInt(0, 3)),
        createdAt: daysAgo(spec.createdDaysAgo - 2),
      },
    });

    activityRows.push({
      type: ActivityType.API_KEY_CREATED,
      message: `Generated an API key for ${project.name}`,
      userId: owner.id,
      projectId: project.id,
      teamId: team.id,
      createdAt: daysAgo(spec.createdDaysAgo - 2),
    });
  }

  console.log("Creating documentation …");

  const docSpecs = [
    {
      title: "Introduction",
      slug: "introduction",
      category: "Getting started",
      content:
        "# Introduction\n\nThe DevFlow API is a REST interface over your workspace. Every response is JSON and follows a predictable envelope.\n",
    },
    {
      title: "Authentication",
      slug: "authentication",
      category: "Getting started",
      content:
        '# Authentication\n\nAuthenticate with a project API key passed as a bearer token.\n\n```bash\ncurl -H "Authorization: Bearer dfk_live_…" https://devflow.app/api/projects\n```\n',
    },
    {
      title: "Errors",
      slug: "errors",
      category: "Reference",
      content:
        "# Errors\n\nFailed requests return `success: false` and a human-readable message. Raw database errors are never exposed.\n",
    },
  ] as const;

  const firstProject = projects[0];
  if (firstProject) {
    for (const [position, doc] of docSpecs.entries()) {
      await db.documentation.create({
        data: {
          projectId: firstProject.project.id,
          title: doc.title,
          slug: doc.slug,
          category: doc.category,
          content: doc.content,
          position,
          createdAt: daysAgo(firstProject.spec.createdDaysAgo - 5),
        },
      });
    }
  }

  console.log("Creating activity trail …");

  for (const { project, spec } of projects) {
    activityRows.push(
      {
        type: ActivityType.PROJECT_CREATED,
        message: `Created project ${project.name}`,
        userId: owner.id,
        projectId: project.id,
        teamId: team.id,
        createdAt: daysAgo(spec.createdDaysAgo),
      },
      {
        type: ActivityType.REPOSITORY_CONNECTED,
        message: `Connected ${spec.githubRepository} to ${project.name}`,
        userId: owner.id,
        projectId: project.id,
        teamId: team.id,
        createdAt: daysAgo(spec.createdDaysAgo - 1),
      },
    );
  }

  activityRows.push(
    {
      type: ActivityType.MEMBER_INVITED,
      message: "Invited Amara Khan to Northwind Labs",
      userId: owner.id,
      projectId: projects[0]!.project.id,
      teamId: team.id,
      createdAt: daysAgo(95),
    },
    {
      type: ActivityType.MEMBER_ROLE_CHANGED,
      message: "Changed Tobias Meyer's role to Developer",
      userId: admin.id,
      projectId: projects[0]!.project.id,
      teamId: team.id,
      createdAt: daysAgo(73),
    },
  );

  await db.activity.createMany({
    data: activityRows.map((row) => ({
      type: row.type,
      message: row.message,
      userId: row.userId,
      projectId: row.projectId,
      teamId: row.teamId,
      deploymentId: row.deploymentId ?? null,
      metadata: row.metadata ?? undefined,
      createdAt: row.createdAt,
    })),
  });

  console.log("Creating 90 days of API traffic …");

  const requests: {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    projectId: string;
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
  }[] = [];

  for (let day = 89; day >= 0; day -= 1) {
    // Traffic trends upward over the quarter and dips at weekends.
    const date = daysAgo(day);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const growth = 1 + (89 - day) / 120;
    const volume = Math.round(randomInt(28, 46) * growth * (weekend ? 0.55 : 1));

    for (let index = 0; index < volume; index += 1) {
      const endpoint = pick(API_PATHS);
      const roll = random();

      // ~2.5% of requests fail, weighted towards client errors.
      let statusCode = endpoint.method === "POST" ? 201 : 200;
      if (roll > 0.985) {
        statusCode = 500;
      } else if (roll > 0.972) {
        statusCode = 404;
      } else if (roll > 0.962) {
        statusCode = 401;
      }

      const target = pick(projects).project;

      requests.push({
        method: endpoint.method,
        path: endpoint.path,
        statusCode,
        durationMs: statusCode >= 500 ? randomInt(400, 1400) : randomInt(28, 260),
        projectId: target.id,
        ipAddress: `192.0.2.${randomInt(1, 254)}`,
        userAgent: pick(USER_AGENTS),
        createdAt: new Date(date.getTime() + randomInt(0, 86_399) * 1000),
      });
    }
  }

  // Chunked so a single statement never carries thousands of rows.
  const CHUNK = 1000;
  for (let index = 0; index < requests.length; index += CHUNK) {
    await db.apiRequest.createMany({ data: requests.slice(index, index + CHUNK) });
  }

  const counts = {
    users: await db.user.count(),
    teams: await db.team.count(),
    projects: await db.project.count(),
    repositories: await db.repository.count(),
    deployments: await db.deployment.count(),
    apiKeys: await db.apiKey.count(),
    docs: await db.documentation.count(),
    activities: await db.activity.count(),
    apiRequests: await db.apiRequest.count(),
  };

  console.log("\nSeed complete:");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(14)} ${count}`);
  }
  console.log("\nSign in with demo@devflow.app / devflow123");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
