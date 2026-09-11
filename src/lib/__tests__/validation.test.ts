import { describe, expect, it } from "vitest";

import { isAllowedPath, pathParameters } from "@/lib/api-catalog";
import { slugify, uniqueSlug } from "@/lib/slug";
import { safeCallbackUrl } from "@/lib/urls";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations/project";
import { createDeploymentSchema } from "@/lib/validations/deployment";
import { changeRoleSchema, inviteMemberSchema } from "@/lib/validations/team";

/**
 * Input validation.
 *
 * Several of these are security boundaries rather than convenience checks —
 * the URL scheme test stops stored XSS, the callback test stops an open
 * redirect, and the path test stops the playground reaching outside the API.
 * They are grouped with the ordinary validation cases because they are
 * enforced the same way and must not be relaxed by accident.
 */

describe("registerSchema", () => {
  it("normalises email case, so the same address cannot register twice", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "Ada@Example.COM",
      password: "correct-horse-battery",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("ada@example.com");
  });

  it("requires at least 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short12",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password beyond bcrypt's 72-byte limit", () => {
    // bcrypt silently truncates past 72 bytes, so anything longer would give
    // a false sense of strength.
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "a".repeat(73),
    });

    expect(result.success).toBe(false);
  });

  it("rejects a malformed address", () => {
    expect(
      registerSchema.safeParse({
        name: "Ada",
        email: "not-an-email",
        password: "correct-horse-battery",
      }).success,
    ).toBe(false);
  });

  it("trims surrounding whitespace from the name", () => {
    const result = registerSchema.safeParse({
      name: "  Ada Lovelace  ",
      email: "ada@example.com",
      password: "correct-horse-battery",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Ada Lovelace");
  });
});

describe("loginSchema", () => {
  it("does not impose the registration length rule on sign-in", () => {
    // An existing account may predate a stricter rule; rejecting it at sign-in
    // would lock the owner out rather than protect them.
    expect(loginSchema.safeParse({ email: "ada@example.com", password: "x" }).success).toBe(true);
  });

  it("still requires a password to be present", () => {
    expect(loginSchema.safeParse({ email: "ada@example.com", password: "" }).success).toBe(false);
  });
});

describe("createProjectSchema", () => {
  it("accepts a minimal project", () => {
    const result = createProjectSchema.safeParse({ name: "Atlas" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("DEVELOPMENT");
  });

  it("rejects javascript: URLs", () => {
    // WHATWG parsing accepts any scheme, and these values are rendered as link
    // hrefs — without this check the field is a stored-XSS vector.
    const result = createProjectSchema.safeParse({
      name: "Atlas",
      productionUrl: "javascript:alert(1)",
    });

    expect(result.success).toBe(false);
  });

  it.each(["ftp://files.example", "htp:/bad", "data:text/html,<script>"])(
    "rejects the non-http scheme %s",
    (url) => {
      expect(createProjectSchema.safeParse({ name: "Atlas", productionUrl: url }).success).toBe(
        false,
      );
    },
  );

  it("accepts http and https", () => {
    expect(
      createProjectSchema.safeParse({ name: "Atlas", productionUrl: "https://example.com" })
        .success,
    ).toBe(true);
    expect(
      createProjectSchema.safeParse({ name: "Atlas", productionUrl: "http://example.com" }).success,
    ).toBe(true);
  });

  it("turns an empty optional field into null rather than an empty string", () => {
    const result = createProjectSchema.safeParse({ name: "Atlas", description: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBeNull();
  });

  it("requires owner/repository format for a GitHub handle", () => {
    expect(
      createProjectSchema.safeParse({ name: "Atlas", githubRepository: "not a repo" }).success,
    ).toBe(false);
    expect(
      createProjectSchema.safeParse({ name: "Atlas", githubRepository: "vercel/next.js" }).success,
    ).toBe(true);
  });

  it("keeps projects private unless publishing is asked for", () => {
    const result = createProjectSchema.safeParse({ name: "Atlas" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isPublic).toBeUndefined();
  });
});

describe("updateProjectSchema", () => {
  it("rejects an empty patch", () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a single field", () => {
    expect(updateProjectSchema.safeParse({ status: "PRODUCTION" }).success).toBe(true);
  });

  it("applies the same URL rules as creation", () => {
    expect(updateProjectSchema.safeParse({ productionUrl: "javascript:alert(1)" }).success).toBe(
      false,
    );
  });

  it("does not attach a status to a patch that did not send one", () => {
    /*
     * Regression. The update schema was derived with `.partial()`, which makes
     * a field optional but leaves its `.default()` intact — so renaming a
     * project emitted `status: "DEVELOPMENT"` alongside the name and the route
     * wrote it, silently demoting live projects. Only the fields actually sent
     * may survive parsing.
     */
    const result = updateProjectSchema.safeParse({ name: "Renamed" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "Renamed" });
      expect("status" in result.data).toBe(false);
    }
  });

  it("still carries a status when one is sent", () => {
    const result = updateProjectSchema.safeParse({ status: "PRODUCTION" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("PRODUCTION");
  });
});

describe("createDeploymentSchema", () => {
  it("names the missing project in plain language", () => {
    const result = createDeploymentSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? "";
      // Zod's default would read "expected string, received undefined".
      expect(message).toContain("project");
    }
  });

  it("rejects a version containing shell or path characters", () => {
    expect(
      createDeploymentSchema.safeParse({ projectId: "p1", version: "v1 .. /etc" }).success,
    ).toBe(false);
  });

  it("defaults to the production environment", () => {
    const result = createDeploymentSchema.safeParse({ projectId: "p1" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.environment).toBe("PRODUCTION");
  });
});

describe("team schemas", () => {
  it("does not offer OWNER as an assignable role", () => {
    // Ownership transfer is deliberately not an ordinary role change.
    expect(changeRoleSchema.safeParse({ role: "OWNER" }).success).toBe(false);
    expect(changeRoleSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
  });

  it("defaults an invitation to the developer role", () => {
    const result = inviteMemberSchema.safeParse({ email: "new@example.com" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.role).toBe("DEVELOPER");
  });
});

describe("safeCallbackUrl", () => {
  it.each(["//evil.example", "https://evil.example", "/\\evil.example", "javascript:alert(1)"])(
    "refuses %s and falls back to the dashboard",
    (value) => {
      expect(safeCallbackUrl(value)).toBe("/dashboard");
    },
  );

  it("keeps a same-origin path", () => {
    expect(safeCallbackUrl("/dashboard/projects")).toBe("/dashboard/projects");
  });

  it("falls back when nothing is supplied", () => {
    expect(safeCallbackUrl(undefined)).toBe("/dashboard");
    expect(safeCallbackUrl(null)).toBe("/dashboard");
  });
});

describe("slugify", () => {
  it.each([
    ["LeadFinder", "leadfinder"],
    ["Atlas  Analytics!!", "atlas-analytics"],
    ["---weird---", "weird"],
    ["Café Sync", "cafe-sync"],
    ["Über Größe", "uber-grosse"],
    ["Ærø Ølsen", "aero-olsen"],
    ["Łódź", "lodz"],
  ])("turns %s into %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("returns an empty string when nothing survives transliteration", () => {
    expect(slugify("日本語")).toBe("");
  });
});

describe("uniqueSlug", () => {
  it("uses the plain slug when it is free", async () => {
    expect(await uniqueSlug("Atlas", async () => false)).toBe("atlas");
  });

  it("suffixes until it finds a free slug", async () => {
    const taken = new Set(["atlas", "atlas-2", "atlas-3"]);
    expect(await uniqueSlug("Atlas", async (candidate) => taken.has(candidate))).toBe("atlas-4");
  });

  it("avoids slugs that would collide with real routes", async () => {
    // "api" as a slug would sit under a path the application already owns.
    expect(await uniqueSlug("api", async () => false)).toBe("api-project");
    expect(await uniqueSlug("dashboard", async () => false)).toBe("dashboard-project");
  });

  it("falls back to a name when the input slugifies to nothing", async () => {
    expect(await uniqueSlug("日本語", async () => false)).toBe("project");
  });
});

describe("playground path guard", () => {
  it.each(["/api/projects", "/api/projects/abc"])("allows %s", (path) => {
    expect(isAllowedPath(path)).toBe(true);
  });

  it.each(["/dashboard", "/apifoo", "/api//evil", ""])("refuses %s", (path) => {
    expect(isAllowedPath(path)).toBe(false);
  });

  it("refuses traversal once the URL is resolved", () => {
    // The guard runs on the resolved pathname precisely because URL parsing
    // collapses these segments away.
    const resolved = new URL("/api/../dashboard", "http://localhost:3000").pathname;
    expect(isAllowedPath(resolved)).toBe(false);
  });

  it("names the parameters still left in a path", () => {
    expect(pathParameters("/api/projects/:id/github")).toEqual(["id"]);
    expect(pathParameters("/api/projects")).toEqual([]);
  });
});
