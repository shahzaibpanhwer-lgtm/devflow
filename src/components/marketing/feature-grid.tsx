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

import { FadeIn } from "@/components/devflow/fade-in";
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
    <div className="border-line bg-line mt-14 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map((feature, index) => (
        <FadeIn key={feature.title} delay={index * 0.04} className="bg-surface-1">
          <div className="hover:bg-surface-2 h-full p-5 transition-colors">
            <feature.icon className="text-brand-500 size-4" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-medium">{feature.title}</h3>
            <p className="text-text-secondary mt-1.5 text-sm text-pretty">{feature.description}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}
