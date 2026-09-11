import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit and integration tests.
 *
 * Runs in the node environment: everything under test is server-side logic —
 * authorisation rules, validation schemas, hashing and slug generation.
 * Browser behaviour is covered by Playwright instead, where it can be
 * exercised for real rather than simulated.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/db.ts", "src/test/**", "src/**/*.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws on import by design. That guard protects real
      // builds and has nothing to enforce in a node test run.
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
});
