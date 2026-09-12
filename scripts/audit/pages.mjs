/**
 * Page and edge-case audit.
 *
 * Every route as every role, plus the malformed input each endpoint should
 * refuse. Reports status codes so a wrong answer is visible rather than
 * inferred.
 */

// Point at a deployment instead of the local server by setting AUDIT_BASE_URL.
const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";

async function signIn(email) {
  const r = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await r.json();
  const jar = r.headers.getSetCookie().map((c) => c.split(";")[0]);
  const s = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: jar.join("; ") },
    body: new URLSearchParams({ csrfToken, email, password: "devflow123" }),
    redirect: "manual",
  });
  return [...jar, ...s.headers.getSetCookie().map((c) => c.split(";")[0])].join("; ");
}

async function get(cookie, path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  return res.status;
}

const owner = await signIn("demo@devflow.app");
const viewer = await signIn("rin@devflow.app");

const { data } = await (await fetch(`${BASE}/api/projects`, { headers: { cookie: owner } })).json();
const projectId = data.projects[0].id;

const PAGES = [
  ["/", 200, 200, 200],
  ["/login", 200, 302, 302],
  ["/register", 200, 302, 302],
  ["/dashboard", 307, 200, 200],
  ["/dashboard/projects", 307, 200, 200],
  [`/dashboard/projects/${projectId}`, 307, 200, 200],
  ["/dashboard/deployments", 307, 200, 200],
  ["/dashboard/analytics", 307, 200, 200],
  ["/dashboard/api", 307, 200, 200],
  ["/dashboard/docs", 307, 200, 200],
  ["/dashboard/docs/authentication", 307, 200, 200],
  ["/dashboard/docs/errors", 307, 200, 200],
  ["/dashboard/team", 307, 200, 200],
  ["/dashboard/settings", 307, 200, 200],
  ["/p/leadfinder", 200, 200, 200],
  ["/p/relay-gateway", 404, 404, 404],
  ["/p/nonexistent", 404, 404, 404],
  ["/totally-made-up", 404, 404, 404],
];

/*
 * The component gallery is development-only by design, so what counts as
 * correct depends on which build is being audited: present in development,
 * absent from production. Asserting one of those unconditionally makes the
 * suite wrong against the other build — it reported a false failure against
 * the dev server for exactly that reason.
 *
 * The production expectation is the one that matters, since it is really a
 * check that a development surface has not shipped. It is therefore never
 * skipped silently: when the target is a dev server the suite says so.
 */
const TARGET = process.env.AUDIT_TARGET ?? "development";
if (TARGET !== "development" && TARGET !== "production") {
  console.error(`AUDIT_TARGET must be "development" or "production", got "${TARGET}"`);
  process.exit(1);
}
const devOnly = TARGET === "production" ? 404 : 200;
PAGES.push(["/dev/kitchen-sink", devOnly, devOnly, devOnly]);

const failures = [];
console.log(`=== routes (anonymous / viewer / owner) — target: ${TARGET} ===`);
if (TARGET === "development") {
  console.log("  note: /dev/kitchen-sink is expected to exist here.");
  console.log("  run with AUDIT_TARGET=production to assert it is absent from a production build.");
}
for (const [path, wantAnon, wantViewer, wantOwner] of PAGES) {
  const [a, v, o] = await Promise.all([get(null, path), get(viewer, path), get(owner, path)]);
  const ok = a === wantAnon && v === wantViewer && o === wantOwner;
  if (!ok) failures.push(`${path}: got ${a}/${v}/${o}, expected ${wantAnon}/${wantViewer}/${wantOwner}`);
  console.log(`  ${ok ? " " : "!"} ${path.padEnd(42)} ${a}  ${v}  ${o}`);
}

// Malformed and hostile input each endpoint should refuse cleanly.
const EDGE = [
  // The API rejects bad params; only the page falls back to defaults.
  ["GET", "/api/projects?page=abc&perPage=999", null, 400, "bad pagination rejected"],
  ["GET", "/api/projects?status=NONSENSE", null, 400, "unknown status rejected"],
  ["GET", "/api/projects/does-not-exist", null, 404, "unknown project"],
  ["PATCH", "/api/projects/does-not-exist", { name: "x" }, 404, "patch unknown project"],
  ["DELETE", "/api/projects/does-not-exist", null, 404, "delete unknown project"],
  ["POST", "/api/projects", { name: "" }, 400, "empty name"],
  ["POST", "/api/projects", { name: "ok", productionUrl: "javascript:alert(1)" }, 400, "javascript URL"],
  ["PATCH", `/api/projects/${projectId}`, {}, 400, "empty patch"],
  ["GET", "/api/deployments/does-not-exist", null, 404, "unknown deployment"],
  ["POST", "/api/deployments", { projectId: "does-not-exist" }, 404, "deploy unknown project"],
  ["GET", "/api/teams/does-not-exist/members", null, 404, "unknown team"],
  ["DELETE", "/api/keys/does-not-exist", null, 404, "unknown key"],
];

console.log("");
console.log("=== edge cases (as owner) ===");
for (const [method, path, body, want, label] of EDGE) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { cookie: owner, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* not JSON */
  }

  const ok = res.status === want;
  // Every failure must use the shared envelope and must never leak internals.
  const shaped = res.status < 400 || (payload && payload.success === false && payload.error?.message);
  const leaks = payload && JSON.stringify(payload).match(/prisma|PrismaClient|at .*\\|node_modules/i);

  if (!ok) failures.push(`${label}: expected ${want}, got ${res.status}`);
  if (!shaped) failures.push(`${label}: response not in the standard envelope`);
  if (leaks) failures.push(`${label}: response leaks internals`);

  console.log(
    `  ${ok && shaped && !leaks ? " " : "!"} ${label.padEnd(30)} ${String(res.status).padEnd(5)} ${shaped ? "enveloped" : "MALFORMED"}${leaks ? "  LEAKS INTERNALS" : ""}`,
  );
}

console.log("");
console.log(failures.length === 0 ? "PAGE AND EDGE AUDIT CLEAN" : `${failures.length} ISSUE(S):`);
for (const f of failures) console.log("  " + f);
