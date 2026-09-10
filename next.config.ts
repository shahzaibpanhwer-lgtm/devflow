import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next generates AGENTS.md / CLAUDE.md on dev startup; this project keeps
  // its documentation hand-written, so the generation is turned off.
  agentRules: false,
  typedRoutes: true,
  images: {
    remotePatterns: [
      // GitHub user avatars and repository open-graph images.
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "opengraph.githubassets.com" },
    ],
  },
};

export default nextConfig;
