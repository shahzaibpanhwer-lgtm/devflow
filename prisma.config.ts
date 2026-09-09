import { existsSync } from "node:fs";
import path from "node:path";

import { defineConfig, env } from "prisma/config";

/**
 * Prisma CLI configuration.
 *
 * From Prisma 7 the connection URL lives here rather than in schema.prisma,
 * and the CLI no longer loads `.env` on your behalf — hence the explicit
 * `loadEnvFile` call below. In deployed environments the variable is already
 * present, so a missing file is not an error.
 */
const envFile = path.join(process.cwd(), ".env");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
