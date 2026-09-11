import { expect, test, type Page } from "@playwright/test";

/**
 * Project lifecycle, end to end.
 *
 * Create, read, update and delete through the interface a user actually
 * touches — dialogs, toasts and redirects included — rather than through the
 * API those dialogs call.
 *
 * Every project this suite creates is named with a unique suffix and deleted
 * by the final test, so a run leaves the seeded workspace as it found it.
 */

const DEMO = { email: "demo@devflow.app", password: "devflow123" };

/** Distinct per run, so a failed run never blocks the next one on the slug. */
const RUN_ID = `${Date.now().toString(36)}`;
const PROJECT_NAME = `E2E Project ${RUN_ID}`;
const RENAMED = `E2E Renamed ${RUN_ID}`;

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEMO.email);
  await page.getByLabel("Password").fill(DEMO.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe.configure({ mode: "serial" });

test.describe("project lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("creates a project", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await page.getByRole("button", { name: "New project" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel("Name").fill(PROJECT_NAME);
    await dialog.getByLabel("Description").fill("Created by the end-to-end suite");
    await dialog.getByLabel("Framework").fill("Next.js");
    await dialog.getByRole("button", { name: "Create project" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText(PROJECT_NAME)).toBeVisible();
  });

  test("rejects a project name that is too short", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await page.getByRole("button", { name: "New project" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill("X");
    await dialog.getByRole("button", { name: "Create project" }).click();

    await expect(dialog.getByText(/at least 2 characters/i)).toBeVisible();
    // The dialog stays open so the mistake can be corrected in place.
    await expect(dialog).toBeVisible();
  });

  test("finds the project by search", async ({ page }) => {
    await page.goto("/dashboard/projects");
    await page.getByLabel("Search projects").fill(RUN_ID);

    // Filtering is driven through the URL and resolved on the server.
    await expect(page).toHaveURL(new RegExp(`search=${RUN_ID}`));
    await expect(page.getByText(PROJECT_NAME)).toBeVisible();
  });

  test("opens the project and shows its detail", async ({ page }) => {
    await page.goto(`/dashboard/projects?search=${RUN_ID}`);
    await page.getByRole("link", { name: PROJECT_NAME }).click();

    await expect(page).toHaveURL(/\/dashboard\/projects\/[a-z0-9]+/i);
    await expect(page.getByRole("heading", { name: PROJECT_NAME })).toBeVisible();
    await expect(page.getByText("Created by the end-to-end suite")).toBeVisible();
  });

  test("updates the project without disturbing its other fields", async ({ page }) => {
    await page.goto(`/dashboard/projects?search=${RUN_ID}`);
    await page.getByRole("link", { name: PROJECT_NAME }).click();

    await page.getByRole("button", { name: "Edit" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill(RENAMED);
    await dialog.getByRole("button", { name: "Save changes" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByRole("heading", { name: RENAMED })).toBeVisible();
    // The description was not part of the patch and must survive it.
    await expect(page.getByText("Created by the end-to-end suite")).toBeVisible();
  });

  test("deletes the project only after the name is typed", async ({ page }) => {
    await page.goto(`/dashboard/projects?search=${RUN_ID}`);
    await page.getByRole("link", { name: RENAMED }).click();

    await page.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");

    // The confirm button stays disabled until the name matches exactly.
    const confirm = dialog.getByRole("button", { name: "Delete project" });
    await expect(confirm).toBeDisabled();

    await dialog.getByLabel(/type .* to confirm/i).fill(RENAMED);
    await expect(confirm).toBeEnabled();
    await confirm.click();

    await expect(page).toHaveURL(/\/dashboard\/projects(\?|$)/);
    await page.goto(`/dashboard/projects?search=${RUN_ID}`);
    await expect(page.getByText(RENAMED)).toHaveCount(0);
  });
});
