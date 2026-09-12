/**
 * Interface audit.
 *
 * Every page at six widths, checking for horizontal overflow, console errors,
 * text contrast, images without alt text, controls without an accessible name,
 * and form fields without a label.
 */

import { chromium } from "@playwright/test";

// Point at a deployment instead of the local server by setting AUDIT_BASE_URL.
const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const WIDTHS = [1440, 1280, 1024, 768, 480, 375];

const browser = await chromium.launch();

async function signIn(context) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill("demo@devflow.app");
  await page.getByLabel("Password").fill("devflow123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/);
  await page.close();
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await signIn(context);
// Reused for the per-width passes, so the suite signs in once rather than
// once per width — repeated sign-ins trip the registration rate limiter.
const storageState = await context.storageState();

// The context's request client shares its cookies, so this runs as the
// signed-in user without rendering a page to scrape.
const projectsRes = await context.request.get(`${BASE}/api/projects`);
const projectsBody = await projectsRes.json();
if (!projectsBody?.success) {
  console.error(`setup failed: /api/projects returned ${projectsRes.status()}`, projectsBody);
  process.exit(1);
}
const projectId = projectsBody.data.projects[0].id;

const PAGES = [
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/dashboard/projects",
  `/dashboard/projects/${projectId}`,
  "/dashboard/deployments",
  "/dashboard/analytics",
  "/dashboard/api",
  "/dashboard/docs",
  "/dashboard/team",
  "/dashboard/settings",
  "/p/leadfinder",
];

const issues = [];

/** Runs inside the page: the checks that need the DOM. */
const AUDIT = () => {
  /*
   * Colours are resolved through a canvas rather than parsed from the string.
   * Computed styles come back in whatever space the engine chose — this page
   * yields lab() for tinted chips — and an earlier version read those
   * components as if they were RGB, inventing a contrast failure on a chip
   * that actually passes. Painting the colour and reading the pixel handles
   * every colour space, and painting it over its backdrop handles alpha.
   */
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const resolve = (color, over) => {
    ctx.clearRect(0, 0, 1, 1);
    if (over) {
      ctx.fillStyle = over;
      ctx.fillRect(0, 0, 1, 1);
    }
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  };

  const luminance = ([r, g, b]) => {
    const [rl, gl, bl] = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
  };

  const contrast = (fg, bg) => {
    const a = luminance(fg);
    const b = luminance(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };

  /** Composites every painted background from the page ground upward. */
  const backgroundOf = (element) => {
    const layers = [];
    let node = element;
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") layers.push(bg);
      node = node.parentElement;
    }
    layers.push("rgb(11, 13, 15)");

    let resolved = layers.pop();
    while (layers.length) {
      const [r, g, b] = resolve(layers.pop(), resolved);
      resolved = `rgb(${r}, ${g}, ${b})`;
    }
    return resolve(resolved);
  };

  const doc = document.documentElement;

  const lowContrast = [];
  for (const el of document.querySelectorAll("p, h1, h2, h3, h4, span, a, li, dt, dd, label")) {
    if (!el.textContent?.trim()) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) < 0.6) continue;
    // Only leaf text, so a wrapper is not judged by its children's colour.
    if (el.children.length > 0) continue;

    const size = parseFloat(style.fontSize);
    const bold = Number(style.fontWeight) >= 700;
    // WCAG treats >=24px, or >=18.66px bold, as large text.
    const large = size >= 24 || (bold && size >= 18.66);
    const required = large ? 3 : 4.5;

    const background = backgroundOf(el);
    const ratio = contrast(resolve(style.color, `rgb(${background.join(",")})`), background);
    if (ratio !== null && ratio < required) {
      lowContrast.push({
        text: el.textContent.trim().slice(0, 40),
        ratio: Math.round(ratio * 10) / 10,
        required,
      });
    }
  }

  const namelessControls = [...document.querySelectorAll("button, a[href]")]
    .filter((el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const name =
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        el.textContent?.trim() ||
        el.querySelector("[class*='sr-only']")?.textContent?.trim();
      return !name;
    })
    .map((el) => el.tagName.toLowerCase() + "." + String(el.className).split(" ")[0]);

  const unlabelledFields = [...document.querySelectorAll("input, select, textarea")]
    .filter((el) => {
      if (el.type === "hidden") return false;
      const id = el.getAttribute("id");
      const labelled =
        (id && document.querySelector(`label[for="${id}"]`)) ||
        el.getAttribute("aria-label") ||
        el.getAttribute("aria-labelledby") ||
        el.closest("label");
      return !labelled;
    })
    .map((el) => el.tagName.toLowerCase() + (el.name ? `[name=${el.name}]` : ""));

  const imagesWithoutAlt = [...document.querySelectorAll("img")]
    .filter((img) => !img.hasAttribute("alt"))
    .map((img) => img.src.slice(-40));

  return {
    overflow: doc.scrollWidth > doc.clientWidth + 1,
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    lowContrast: lowContrast.slice(0, 4),
    namelessControls: [...new Set(namelessControls)].slice(0, 4),
    unlabelledFields: [...new Set(unlabelledFields)].slice(0, 4),
    imagesWithoutAlt: imagesWithoutAlt.slice(0, 3),
  };
};

console.log("=== per page, at 1440px ===");
for (const path of PAGES) {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 80));
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 80)));

  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const result = await page.evaluate(AUDIT);

  const problems = [];
  if (result.lowContrast.length) problems.push(`${result.lowContrast.length} low-contrast`);
  if (result.namelessControls.length) problems.push(`${result.namelessControls.length} unnamed controls`);
  if (result.unlabelledFields.length) problems.push(`${result.unlabelledFields.length} unlabelled fields`);
  if (result.imagesWithoutAlt.length) problems.push(`${result.imagesWithoutAlt.length} images without alt`);
  if (consoleErrors.length) problems.push(`${consoleErrors.length} console errors`);

  if (problems.length) {
    issues.push({ path, result, consoleErrors });
  }
  console.log(`  ${problems.length ? "!" : " "} ${path.padEnd(40)} ${problems.join(", ") || "clean"}`);
  await page.close();
}

console.log("");
console.log("=== horizontal overflow, every page × every width ===");
let overflowing = 0;
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, storageState });
  const bad = [];
  for (const path of PAGES) {
    const page = await ctx.newPage();
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    const { overflow } = await page.evaluate(AUDIT);
    if (overflow) {
      bad.push(path);
      overflowing += 1;
    }
    await page.close();
  }
  console.log(`  ${String(width).padEnd(6)} ${bad.length ? "OVERFLOW: " + bad.join(", ") : "all clean"}`);
  await ctx.close();
}

console.log("");
if (issues.length) {
  console.log("=== detail ===");
  for (const { path, result, consoleErrors } of issues) {
    console.log(`  ${path}`);
    for (const c of result.lowContrast) console.log(`    contrast ${c.ratio} (needs ${c.required}): "${c.text}"`);
    for (const c of result.namelessControls) console.log(`    unnamed control: ${c}`);
    for (const f of result.unlabelledFields) console.log(`    unlabelled field: ${f}`);
    for (const i of result.imagesWithoutAlt) console.log(`    image without alt: ${i}`);
    for (const e of [...new Set(consoleErrors)]) console.log(`    console: ${e}`);
  }
}

console.log(
  issues.length === 0 && overflowing === 0
    ? "UI AUDIT CLEAN"
    : `${issues.length} page(s) with issues, ${overflowing} overflow case(s)`,
);

await browser.close();
