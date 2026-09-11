import { expect, test } from "@playwright/test";

/**
 * Authentication, end to end.
 *
 * Register, sign in, reach a protected route and sign out again — the path
 * every user takes before they can do anything else. Each test uses a fresh
 * email so runs do not collide with one another or with the seeded accounts.
 */

const DEMO = { email: "demo@devflow.app", password: "devflow123" };

/** Unique per run, so a re-run never trips the duplicate-email check. */
function freshEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

test.describe("authentication", () => {
  test("protects the dashboard from anonymous visitors", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login/);
    // The intended destination survives the redirect, so signing in returns
    // the visitor to where they were going.
    expect(page.url()).toContain("callbackUrl");
  });

  test("refuses a wrong password without revealing whether the account exists", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(DEMO.email);
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Scoped to the form: Next renders its own role="alert" route announcer,
    // so an unscoped lookup matches two elements.
    const formError = page.locator('form [role="alert"]');
    await expect(formError).toBeVisible();
    await expect(formError).toContainText(/incorrect email or password/i);

    // Still signed out.
    await expect(page).toHaveURL(/\/login/);
  });

  test("signs in, reaches the dashboard and signs out again", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(DEMO.email);
    await page.getByLabel("Password").fill(DEMO.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();

    // Sign-out redirects to the landing page. Wait for that to settle before
    // navigating again, or the second navigation aborts the first.
    await expect(page).toHaveURL(/localhost:3000\/?$/);

    // Signing out must actually drop the session, not merely navigate away.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("registers a new account and lands signed in", async ({ page }) => {
    const email = freshEmail();

    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E Test User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("correct-horse-battery");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test("rejects a password shorter than the server requires", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E Test User");
    await page.getByLabel("Email").fill(freshEmail());
    await page.getByLabel("Password").fill("short12");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/at least 8 characters/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });

  test("refuses an email that is already registered", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Name").fill("Impostor");
    await page.getByLabel("Email").fill(DEMO.email);
    await page.getByLabel("Password").fill("correct-horse-battery");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.locator('form [role="alert"]')).toContainText(/already exists/i);
  });
});
