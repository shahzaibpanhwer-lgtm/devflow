/**
 * API audit.
 *
 * Walks every endpoint as every role, including anonymous, and reports the
 * status each returns. Written as a table so a wrong answer stands out rather
 * than having to be reasoned about.
 */

// Point at a deployment instead of the local server by setting AUDIT_BASE_URL.
const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";

const ACCOUNTS = {
  owner: "demo@devflow.app",
  admin: "amara@devflow.app",
  developer: "tobias@devflow.app",
  viewer: "rin@devflow.app",
};

/** Signs in and returns a cookie header for that account. */
async function signIn(email) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const jar = csrfRes.headers.getSetCookie().map((c) => c.split(";")[0]);

  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: jar.join("; ") },
    body: new URLSearchParams({ csrfToken, email, password: "devflow123" }),
    redirect: "manual",
  });

  const session = res.headers.getSetCookie().map((c) => c.split(";")[0]);
  return [...jar, ...session].join("; ");
}

async function call(cookie, method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: "manual",
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* not JSON */
  }
  return { status: res.status, payload };
}

const cookies = { anonymous: null };
for (const [role, email] of Object.entries(ACCOUNTS)) {
  cookies[role] = await signIn(email);
}

// Confirm each session actually resolved to the right person.
console.log("=== sessions ===");
for (const role of Object.keys(ACCOUNTS)) {
  const { payload } = await call(cookies[role], "GET", "/api/auth/session");
  console.log(`  ${role.padEnd(10)} ${payload?.user?.email ?? "NO SESSION"}`);
}

const owner = cookies.owner;

/*
 * Setup failures report the status and body that caused them.
 *
 * An earlier version just said what it could not find, which was useless: the
 * same message appeared whether the endpoint had returned a 500, an empty
 * list, or a shape that had genuinely changed. Two of those are environment
 * trouble and one is a real defect, and the message could not tell them apart.
 */
function abort(what, res) {
  console.error(`setup failed: ${what}`);
  console.error(`  status ${res.status}`);
  console.error(`  body   ${JSON.stringify(res.payload)?.slice(0, 400)}`);
  process.exit(1);
}

const listRes = await call(owner, "GET", "/api/projects");
const project = listRes.payload?.data?.projects?.[0];
if (!project) abort("no projects to audit against — is the database seeded?", listRes);

const teamRes = await call(owner, "GET", "/api/projects/" + project.id);
const teamId = teamRes.payload?.data?.project?.team?.id;
if (!teamId) abort("could not resolve a team from the first project", teamRes);
const membersRes = await call(owner, "GET", `/api/teams/${teamId}/members`);
const members = membersRes.payload;
const viewerMember = members?.data?.members?.find((m) => m.role === "VIEWER");
if (!viewerMember) abort("no viewer in the team to exercise role rules against", membersRes);

const deploymentsRes = await call(owner, "GET", "/api/deployments?perPage=1");
const deploymentId = deploymentsRes.payload?.data?.deployments?.[0]?.id;
if (!deploymentId) abort("no deployments to audit against", deploymentsRes);

console.log("");
console.log(`  project ${project.id}  team ${teamId}`);

/** [method, path, body, expected per role] — anonymous first. */
const CASES = [
  ["GET", "/api/projects", null, { anonymous: 401, viewer: 200, developer: 200, admin: 200, owner: 200 }],
  // A viewer is refused: creating a project would attach it to a team they
  // may only read, and make them owner of the new record.
  ["POST", "/api/projects", { name: "Audit Probe" }, { anonymous: 401, viewer: 403, developer: 201, admin: 201, owner: 201 }],
  ["GET", `/api/projects/${project.id}`, null, { anonymous: 401, viewer: 200, developer: 200, admin: 200, owner: 200 }],
  ["PATCH", `/api/projects/${project.id}`, { framework: "Next.js" }, { anonymous: 401, viewer: 403, developer: 200, admin: 200, owner: 200 }],
  ["GET", `/api/projects/${project.id}/keys`, null, { anonymous: 401, viewer: 403, developer: 403, admin: 200, owner: 200 }],
  ["POST", `/api/projects/${project.id}/keys`, { name: "Audit key" }, { anonymous: 401, viewer: 403, developer: 403, admin: 201, owner: 201 }],
  ["GET", `/api/projects/${project.id}/github`, null, { anonymous: 401, viewer: 200, developer: 200, admin: 200, owner: 200 }],
  ["PUT", `/api/projects/${project.id}/repository`, { fullName: "vercel/next.js" }, { anonymous: 401, viewer: 403, developer: 409, admin: 409, owner: 409 }],
  ["GET", "/api/github/repositories", null, { anonymous: 401, viewer: 409, developer: 409, admin: 409, owner: 409 }],
  ["GET", "/api/deployments", null, { anonymous: 401, viewer: 200, developer: 200, admin: 200, owner: 200 }],
  ["GET", `/api/deployments/${deploymentId}`, null, { anonymous: 401, viewer: 200, developer: 200, admin: 200, owner: 200 }],
  ["GET", `/api/teams/${teamId}/members`, null, { anonymous: 401, viewer: 200, developer: 200, admin: 200, owner: 200 }],
  ["POST", `/api/teams/${teamId}/members`, { email: "nobody@example.com" }, { anonymous: 401, viewer: 403, developer: 403, admin: 404, owner: 404 }],
  ["PATCH", `/api/teams/${teamId}/members/${viewerMember.id}`, { role: "DEVELOPER" }, { anonymous: 401, viewer: 403, developer: 403, admin: 200, owner: 200 }],
];

const ROLES = ["anonymous", "viewer", "developer", "admin", "owner"];
const failures = [];
const created = [];

/**
 * Roles as they stood before the matrix ran.
 *
 * The matrix deliberately performs writes, so it has to put the workspace back
 * exactly as it found it. An earlier version cleaned up on the happy path
 * only; one crash left a developer promoted to admin, and the next run then
 * reported four false mismatches against a workspace its predecessor had
 * altered. Restoration now happens in a finally block.
 */
const originalRoles = members.data.members.map((m) => ({ id: m.id, role: m.role }));

async function restore() {
  for (const { id, role } of originalRoles) {
    if (role === "OWNER") continue; // not an assignable role
    await call(owner, "PATCH", `/api/teams/${teamId}/members/${id}`, { role });
  }
  for (const id of created) {
    await call(owner, "DELETE", `/api/projects/${id}`);
  }
}

console.log("");
console.log("=== authorization matrix (expected -> actual) ===");
console.log(`  ${"endpoint".padEnd(48)} ${ROLES.map((r) => r.slice(0, 5).padEnd(7)).join("")}`);

try {
for (const [method, path, body, expected] of CASES) {
  const label = `${method} ${path.replace(/c[a-z0-9]{20,}/g, ":id")}`;
  const cells = [];

  for (const role of ROLES) {
    const { status, payload } = await call(cookies[role], method, path, body);
    const want = expected[role];
    const ok = status === want;
    if (!ok) failures.push(`${label} as ${role}: expected ${want}, got ${status}`);
    if (status === 201 && payload?.data?.project) created.push(payload.data.project.id);
    cells.push((ok ? `${status}` : `${status}!=${want}`).padEnd(7));
  }

  console.log(`  ${label.padEnd(48)} ${cells.join("")}`);
}

} finally {
  // Runs whether the matrix completed or threw, so a failure never leaves the
  // workspace altered for the next run.
  await restore();
}

console.log("");
if (failures.length === 0) {
  console.log("AUTHORIZATION MATRIX CLEAN");
} else {
  console.log(`${failures.length} MISMATCH(ES):`);
  for (const f of failures) console.log("  " + f);
}
