/**
 * The DevFlow API surface, as the playground presents it.
 *
 * Deliberately free of server imports so the playground — which is entirely
 * client-side — can read it without pulling the database into the browser
 * bundle. This is a description of the API, not its implementation; the route
 * handlers remain the source of truth for behaviour.
 */

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export type CatalogEndpoint = {
  id: string;
  method: HttpMethod;
  /** Path template; :params are substituted by the user before sending. */
  path: string;
  summary: string;
  /** Prefilled request body, already formatted. */
  body?: string;
  /** Prefilled query parameters. */
  query?: { key: string; value: string }[];
  /** Warns before a request that changes or removes data. */
  destructive?: boolean;
};

export type CatalogGroup = {
  name: string;
  endpoints: CatalogEndpoint[];
};

export const API_CATALOG: CatalogGroup[] = [
  {
    name: "Projects",
    endpoints: [
      {
        id: "projects-list",
        method: "GET",
        path: "/api/projects",
        summary: "List projects visible to you",
        query: [{ key: "perPage", value: "5" }],
      },
      {
        id: "projects-create",
        method: "POST",
        path: "/api/projects",
        summary: "Create a project",
        body: JSON.stringify(
          {
            name: "Playground Project",
            description: "Created from the API playground",
            framework: "Next.js",
            status: "DEVELOPMENT",
          },
          null,
          2,
        ),
      },
      {
        id: "projects-get",
        method: "GET",
        path: "/api/projects/:id",
        summary: "Read one project",
      },
      {
        id: "projects-update",
        method: "PATCH",
        path: "/api/projects/:id",
        summary: "Update a project",
        body: JSON.stringify({ status: "PRODUCTION" }, null, 2),
      },
      {
        id: "projects-delete",
        method: "DELETE",
        path: "/api/projects/:id",
        summary: "Delete a project and everything under it",
        destructive: true,
      },
    ],
  },
  {
    name: "Deployments",
    endpoints: [
      {
        id: "deployments-list",
        method: "GET",
        path: "/api/deployments",
        summary: "List deployments",
        query: [{ key: "perPage", value: "5" }],
      },
      {
        id: "deployments-create",
        method: "POST",
        path: "/api/deployments",
        summary: "Start a deployment",
        body: JSON.stringify(
          { projectId: "REPLACE_WITH_PROJECT_ID", environment: "PREVIEW" },
          null,
          2,
        ),
      },
      {
        id: "deployments-get",
        method: "GET",
        path: "/api/deployments/:id",
        summary: "Read one deployment with its build log",
      },
    ],
  },
  {
    name: "GitHub",
    endpoints: [
      {
        id: "github-repos",
        method: "GET",
        path: "/api/github/repositories",
        summary: "List repositories you can connect",
      },
      {
        id: "github-activity",
        method: "GET",
        path: "/api/projects/:id/github",
        summary: "Commits, pull requests and issues",
      },
      {
        id: "github-connect",
        method: "PUT",
        path: "/api/projects/:id/repository",
        summary: "Connect a repository",
        body: JSON.stringify({ fullName: "vercel/next.js" }, null, 2),
      },
      {
        id: "github-disconnect",
        method: "DELETE",
        path: "/api/projects/:id/repository",
        summary: "Disconnect the repository",
        destructive: true,
      },
    ],
  },
  {
    name: "Authentication",
    endpoints: [
      {
        id: "auth-session",
        method: "GET",
        path: "/api/auth/session",
        summary: "Your current session",
      },
      {
        id: "auth-register",
        method: "POST",
        path: "/api/auth/register",
        summary: "Create an account",
        body: JSON.stringify(
          { name: "Ada Lovelace", email: "ada@example.com", password: "correct-horse-battery" },
          null,
          2,
        ),
      },
    ],
  },
];

/**
 * The playground only ever calls DevFlow's own API.
 *
 * Requests are issued by the browser against the same origin, so this is not a
 * server-side proxy and cannot be used to reach internal hosts. The check
 * still runs, because a path that escapes /api/ would be a bug worth catching
 * rather than silently following.
 */
export function isAllowedPath(path: string): boolean {
  return path.startsWith("/api/") && !path.startsWith("/api//");
}

/** Names the :params still left in a path, so the editor can prompt for them. */
export function pathParameters(path: string): string[] {
  return [...path.matchAll(/:([A-Za-z][A-Za-z0-9_]*)/g)].map((match) => match[1] ?? "");
}
