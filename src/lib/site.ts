/**
 * Static product metadata. Kept in one place so marketing copy, page titles
 * and Open Graph tags never drift apart.
 */
export const siteConfig = {
  name: "DevFlow",
  title: "DevFlow — One command center for your entire development workflow",
  description:
    "Manage projects, deployments, APIs, GitHub activity and team workflows from one powerful workspace.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export type SiteConfig = typeof siteConfig;
