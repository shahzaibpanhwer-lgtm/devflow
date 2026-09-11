import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests.
 *
 * These drive a real browser against a production build, because that is the
 * only place the whole stack is exercised together: middleware, server
 * components, route handlers, the database and the session cookie. Unit tests
 * cover the logic; these cover the assembly.
 *
 * The suite needs a running database. Start one with `npm run db:start`.
 */
export default defineConfig({
  testDir: "./e2e",
  // Deliberately serial: the tests share one workspace and one seeded
  // database, so running them in parallel would let them see each other's
  // writes and fail for reasons that have nothing to do with the code.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // A production build, not the dev server: dev-only overlays and slower
    // compilation make for flaky, unrepresentative runs.
    command: "npm run build && npm run start",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
