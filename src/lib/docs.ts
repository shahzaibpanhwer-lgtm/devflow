/**
 * API reference content.
 *
 * Structured data rather than prose, so every endpoint is documented in the
 * same shape and the page renders itself from that shape. Free of server
 * imports — the code-sample tabs are a client component.
 */

export type CodeLanguage = "javascript" | "typescript" | "curl" | "python";

export const CODE_LANGUAGES: { id: CodeLanguage; label: string }[] = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "curl", label: "cURL" },
  { id: "python", label: "Python" },
];

export type DocParameter = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

export type DocEndpoint = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  parameters?: DocParameter[];
  bodyFields?: DocParameter[];
  /** Example success response, already formatted. */
  response: string;
  samples: Record<CodeLanguage, string>;
};

export type DocSection = {
  slug: string;
  title: string;
  summary: string;
  /** Prose paragraphs rendered above the endpoints. */
  body?: string[];
  endpoints?: DocEndpoint[];
  /** Reference tables that are not endpoints, such as the error codes. */
  table?: { caption: string; columns: string[]; rows: string[][] };
};

const BASE = "https://devflow.app";

/** Builds the four code samples for one request, so they never drift apart. */
function samples(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Record<CodeLanguage, string> {
  const url = `${BASE}${path}`;
  const json = body ? JSON.stringify(body, null, 2) : null;

  const jsOptions = [
    `  method: "${method}"`,
    `  headers: {\n    Authorization: \`Bearer \${apiKey}\`,\n    "Content-Type": "application/json",\n  }`,
    json ? `  body: JSON.stringify(${json.replace(/\n/g, "\n  ")})` : null,
  ]
    .filter(Boolean)
    .join(",\n");

  return {
    javascript: `const response = await fetch("${url}", {\n${jsOptions},\n});\n\nconst result = await response.json();\nif (!result.success) throw new Error(result.error.message);\n\nconsole.log(result.data);`,

    typescript: `type ApiResult<T> =\n  | { success: true; data: T }\n  | { success: false; error: { message: string; code?: string } };\n\nconst response = await fetch("${url}", {\n${jsOptions},\n});\n\nconst result = (await response.json()) as ApiResult<unknown>;\nif (!result.success) throw new Error(result.error.message);\n\nconsole.log(result.data);`,

    curl:
      `curl -X ${method} "${url}" \\\n` +
      `  -H "Authorization: Bearer $DEVFLOW_API_KEY" \\\n` +
      `  -H "Content-Type: application/json"` +
      (json ? ` \\\n  -d '${JSON.stringify(body)}'` : ""),

    python:
      `import os, requests\n\n` +
      `response = requests.${method.toLowerCase()}(\n` +
      `    "${url}",\n` +
      `    headers={"Authorization": f"Bearer {os.environ['DEVFLOW_API_KEY']}"},\n` +
      (body ? `    json=${JSON.stringify(body, null, 4).replace(/\n/g, "\n    ")},\n` : "") +
      `)\n\n` +
      `result = response.json()\n` +
      `if not result["success"]:\n` +
      `    raise RuntimeError(result["error"]["message"])\n\n` +
      `print(result["data"])`,
  };
}

export const DOC_SECTIONS: DocSection[] = [
  {
    slug: "introduction",
    title: "Introduction",
    summary: "What the DevFlow API is and how its responses are shaped.",
    body: [
      "The DevFlow API is a REST interface over your workspace. Every endpoint returns JSON and every response uses the same envelope, so a client never has to guess at the shape of what came back.",
      "A successful response carries `success: true` and a `data` object. A failure carries `success: false` and an `error` object with a human-readable `message`, an optional machine-readable `code`, and — for validation failures — a `fields` map of per-field messages.",
      "Raw database errors are never returned. An unexpected failure is logged server-side and reported as a generic message, so internal details stay internal.",
    ],
    table: {
      caption: "Response envelope",
      columns: ["Field", "Type", "Description"],
      rows: [
        ["success", "boolean", "Whether the request succeeded"],
        ["data", "object", "Present on success"],
        ["error.message", "string", "Human-readable failure description"],
        ["error.code", "string", "Machine-readable code, where one applies"],
        ["error.fields", "object", "Per-field validation messages"],
      ],
    },
  },
  {
    slug: "authentication",
    title: "Authentication",
    summary: "Authenticate with a project API key passed as a bearer token.",
    body: [
      "Requests are authenticated with a project API key, sent as a bearer token. Keys are created per project from the project's API tab, and a key is scoped to that project alone — a key handed to a CI job cannot widen into your whole account.",
      "DevFlow stores only a SHA-256 hash of each key. The plaintext is shown once, at creation, and cannot be retrieved afterwards. If you lose it, revoke the key and issue a new one.",
      "Revoking takes effect immediately: any service still presenting the key begins receiving 401 responses.",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/projects",
        description: "Returns the project a key is scoped to. Verifies that a key is working.",
        response: JSON.stringify(
          {
            success: true,
            data: {
              projects: [
                { id: "clx…", name: "LeadFinder", slug: "leadfinder", status: "PRODUCTION" },
              ],
              pagination: { page: 1, perPage: 1, total: 1, totalPages: 1 },
            },
          },
          null,
          2,
        ),
        samples: samples("GET", "/api/projects"),
      },
    ],
  },
  {
    slug: "projects",
    title: "Projects",
    summary: "Create, read, update and delete projects.",
    endpoints: [
      {
        method: "GET",
        path: "/api/projects",
        description: "Lists projects visible to the caller, newest activity first.",
        parameters: [
          {
            name: "status",
            type: "string",
            required: false,
            description: "DEVELOPMENT, PRODUCTION, PAUSED or ARCHIVED",
          },
          {
            name: "search",
            type: "string",
            required: false,
            description: "Matches name, description or repository",
          },
          { name: "page", type: "number", required: false, description: "1-based page number" },
          {
            name: "perPage",
            type: "number",
            required: false,
            description: "Items per page, 1 to 50",
          },
        ],
        response: JSON.stringify(
          {
            success: true,
            data: {
              projects: [
                { id: "clx…", name: "LeadFinder", slug: "leadfinder", deploymentCount: 42 },
              ],
              pagination: { page: 1, perPage: 12, total: 4, totalPages: 1 },
            },
          },
          null,
          2,
        ),
        samples: samples("GET", "/api/projects"),
      },
      {
        method: "POST",
        path: "/api/projects",
        description: "Creates a project. The slug is derived from the name and cannot be supplied.",
        bodyFields: [
          { name: "name", type: "string", required: true, description: "2 to 60 characters" },
          {
            name: "description",
            type: "string",
            required: false,
            description: "Up to 280 characters",
          },
          {
            name: "framework",
            type: "string",
            required: false,
            description: "For example, Next.js",
          },
          {
            name: "status",
            type: "string",
            required: false,
            description: "Defaults to DEVELOPMENT",
          },
          {
            name: "productionUrl",
            type: "string",
            required: false,
            description: "Must be http or https",
          },
          {
            name: "githubRepository",
            type: "string",
            required: false,
            description: "owner/repository",
          },
        ],
        response: JSON.stringify(
          { success: true, data: { project: { id: "clx…", name: "Atlas", slug: "atlas" } } },
          null,
          2,
        ),
        samples: samples("POST", "/api/projects", { name: "Atlas", framework: "Next.js" }),
      },
      {
        method: "PATCH",
        path: "/api/projects/:id",
        description:
          "Updates a project. Requires the developer role. The slug is immutable, since it is the public URL.",
        bodyFields: [
          { name: "name", type: "string", required: false, description: "2 to 60 characters" },
          { name: "status", type: "string", required: false, description: "New lifecycle status" },
          {
            name: "productionUrl",
            type: "string",
            required: false,
            description: "Must be http or https",
          },
        ],
        response: JSON.stringify(
          { success: true, data: { project: { id: "clx…", status: "PRODUCTION" } } },
          null,
          2,
        ),
        samples: samples("PATCH", "/api/projects/:id", { status: "PRODUCTION" }),
      },
      {
        method: "DELETE",
        path: "/api/projects/:id",
        description:
          "Deletes a project and everything under it — deployments, keys and documentation. Requires the admin role.",
        response: JSON.stringify({ success: true, data: { deleted: true, id: "clx…" } }, null, 2),
        samples: samples("DELETE", "/api/projects/:id"),
      },
    ],
  },
  {
    slug: "deployments",
    title: "Deployments",
    summary: "Start deployments and read their pipeline state and build output.",
    endpoints: [
      {
        method: "GET",
        path: "/api/deployments",
        description: "Lists deployments across visible projects, newest first.",
        parameters: [
          {
            name: "projectId",
            type: "string",
            required: false,
            description: "Restrict to one project",
          },
          {
            name: "status",
            type: "string",
            required: false,
            description: "QUEUED through SUCCESS or FAILED",
          },
          {
            name: "environment",
            type: "string",
            required: false,
            description: "PRODUCTION, PREVIEW or DEVELOPMENT",
          },
        ],
        response: JSON.stringify(
          {
            success: true,
            data: {
              deployments: [
                { id: "clx…", version: "v1.4.2", status: "SUCCESS", durationMs: 84000 },
              ],
              pagination: { page: 1, perPage: 20, total: 94, totalPages: 5 },
            },
          },
          null,
          2,
        ),
        samples: samples("GET", "/api/deployments"),
      },
      {
        method: "POST",
        path: "/api/deployments",
        description:
          "Starts a deployment. Requires the developer role. Returns as soon as the record exists; the pipeline advances behind it.",
        bodyFields: [
          { name: "projectId", type: "string", required: true, description: "Project to deploy" },
          {
            name: "version",
            type: "string",
            required: false,
            description: "Defaults to the next patch version",
          },
          {
            name: "environment",
            type: "string",
            required: false,
            description: "Defaults to PRODUCTION",
          },
          {
            name: "branch",
            type: "string",
            required: false,
            description: "Defaults to the repository's default branch",
          },
        ],
        response: JSON.stringify(
          {
            success: true,
            data: { deployment: { id: "clx…", version: "v1.4.3", status: "QUEUED" } },
          },
          null,
          2,
        ),
        samples: samples("POST", "/api/deployments", { projectId: "clx…", environment: "PREVIEW" }),
      },
      {
        method: "GET",
        path: "/api/deployments/:id",
        description: "Reads one deployment, including its ordered build log.",
        response: JSON.stringify(
          {
            success: true,
            data: {
              deployment: {
                id: "clx…",
                status: "SUCCESS",
                logs: [
                  {
                    timestamp: "2026-09-11T10:00:00.000Z",
                    level: "info",
                    message: "Cloning repository",
                  },
                ],
              },
            },
          },
          null,
          2,
        ),
        samples: samples("GET", "/api/deployments/:id"),
      },
    ],
  },
  {
    slug: "api-keys",
    title: "API keys",
    summary: "Issue and revoke the keys that authenticate API requests.",
    body: [
      "Managing keys requires the admin role. Keys are created against a project and inherit that project's scope.",
    ],
    endpoints: [
      {
        method: "GET",
        path: "/api/projects/:id/keys",
        description:
          "Lists a project's keys. Secrets are never returned — only the prefix, last four characters and usage metadata.",
        response: JSON.stringify(
          {
            success: true,
            data: {
              keys: [
                {
                  id: "clx…",
                  name: "CI pipeline",
                  prefix: "dfk_live_a1b2",
                  lastFour: "9f3c",
                  lastUsedAt: "2026-09-11T09:12:00.000Z",
                  revokedAt: null,
                },
              ],
            },
          },
          null,
          2,
        ),
        samples: samples("GET", "/api/projects/:id/keys"),
      },
      {
        method: "POST",
        path: "/api/projects/:id/keys",
        description:
          "Issues a key. The plaintext appears in this response only and is never recoverable.",
        bodyFields: [
          { name: "name", type: "string", required: true, description: "2 to 60 characters" },
          {
            name: "expiresInDays",
            type: "number",
            required: false,
            description: "1 to 365; omit for no expiry",
          },
        ],
        response: JSON.stringify(
          {
            success: true,
            data: {
              key: { id: "clx…", name: "CI pipeline", prefix: "dfk_live_a1b2", lastFour: "9f3c" },
              plaintext: "dfk_live_a1b2…9f3c",
            },
          },
          null,
          2,
        ),
        samples: samples("POST", "/api/projects/:id/keys", {
          name: "CI pipeline",
          expiresInDays: 90,
        }),
      },
      {
        method: "DELETE",
        path: "/api/keys/:id",
        description:
          "Revokes a key immediately. The row is retained and stamped, so the audit trail still shows it existed.",
        response: JSON.stringify({ success: true, data: { revoked: true, id: "clx…" } }, null, 2),
        samples: samples("DELETE", "/api/keys/:id"),
      },
    ],
  },
  {
    slug: "errors",
    title: "Errors",
    summary: "Status codes, error codes and what they mean.",
    body: [
      "Failed requests return `success: false` with an `error` object. The HTTP status carries the category; the `code` field identifies the specific condition.",
      "A request for a resource you cannot see returns 404 rather than 403. That is deliberate: a 403 would confirm the resource exists, which is itself a disclosure.",
    ],
    table: {
      caption: "Status codes",
      columns: ["Status", "Code", "Meaning"],
      rows: [
        ["400", "BAD_REQUEST", "Malformed body, or validation failed — see error.fields"],
        ["401", "UNAUTHORIZED", "No session or API key, or the key is revoked or expired"],
        ["403", "FORBIDDEN", "Authenticated, but your role does not permit the action"],
        ["404", "NOT_FOUND", "No such resource, or you cannot see it"],
        ["409", "CONFLICT", "The request conflicts with existing state"],
        ["429", "RATE_LIMITED", "Too many requests — retry after the stated interval"],
        [
          "500",
          "INTERNAL_ERROR",
          "Something failed on our side; the detail is logged, not returned",
        ],
      ],
    },
  },
];

export function findSection(slug: string): DocSection | undefined {
  return DOC_SECTIONS.find((section) => section.slug === slug);
}
