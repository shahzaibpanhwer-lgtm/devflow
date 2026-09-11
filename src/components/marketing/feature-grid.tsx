import {
  ActivityIcon,
  BookTextIcon,
  ChartNoAxesColumnIcon,
  KeyRoundIcon,
  RocketIcon,
  TerminalIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { Stagger, StaggerItem } from "@/components/marketing/motion";
import { GithubMark } from "@/components/devflow/github-mark";

type Feature = {
  icon: LucideIcon | typeof GithubMark;
  title: string;
  description: string;
};

const FEATURES: readonly Feature[] = [
  {
    icon: GithubMark,
    title: "GitHub integration",
    description:
      "Connect a repository and pull branches, commits, pull requests and issues straight into the project view.",
  },
  {
    icon: RocketIcon,
    title: "Deployment tracking",
    description:
      "Follow every release through queue, build, test and production with full logs at each stage.",
  },
  {
    icon: TerminalIcon,
    title: "API playground",
    description:
      "Compose requests, set headers and bodies, then inspect status, timing and response payloads.",
  },
  {
    icon: ChartNoAxesColumnIcon,
    title: "Analytics",
    description:
      "Request volume, response times, error rates and deployment frequency over any time window.",
  },
  {
    icon: KeyRoundIcon,
    title: "API keys",
    description:
      "Issue scoped keys, track last use and revoke instantly. Secrets are hashed and shown exactly once.",
  },
  {
    icon: UsersIcon,
    title: "Team roles",
    description:
      "Owner, admin, developer and viewer permissions, enforced on the server rather than in the UI.",
  },
  {
    icon: ActivityIcon,
    title: "Activity timeline",
    description:
      "Every project change, deployment and key rotation recorded with actor, action and timestamp.",
  },
  {
    icon: BookTextIcon,
    title: "Documentation",
    description:
      "A reference for every endpoint with parameters, responses and copyable code in four languages.",
  },
];

export function FeatureGrid() {
  return (
    <Stagger
      stagger={0.05}
      className="border-line bg-line mt-14 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4"
    >
      {FEATURES.map((feature) => (
        <StaggerItem key={feature.title} className="bg-surface-1 group relative">
          {/*
            The lift is on an inner element so the grid's hairline gaps stay
            put — translating the cell itself would open a seam between cards.
          */}
          <div className="hover:bg-surface-2 relative h-full p-5 transition-colors duration-200 group-hover:-translate-y-0.5">
            <span
              aria-hidden="true"
              className="ring-brand-500/20 pointer-events-none absolute inset-0 opacity-0 ring-1 transition-opacity duration-200 ring-inset group-hover:opacity-100"
            />
            <feature.icon
              className="text-brand-500 size-4 transition-transform duration-200 group-hover:scale-110"
              aria-hidden="true"
            />
            <h3 className="mt-3 text-sm font-medium">{feature.title}</h3>
            <p className="text-text-secondary mt-1.5 text-sm text-pretty">{feature.description}</p>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
