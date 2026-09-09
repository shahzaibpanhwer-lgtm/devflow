import {
  CircleDotIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  GitForkIcon,
  GitPullRequestIcon,
  StarIcon,
} from "lucide-react";

import { GithubMark } from "@/components/devflow/github-mark";
import { StatusDot } from "@/components/devflow/status-dot";
import { DEPLOYMENT_PIPELINE, DEPLOYMENT_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("border-line bg-surface-1 rounded-lg border p-4", className)}>
      {children}
    </div>
  );
}

export function GithubVisual() {
  const stats = [
    { icon: StarIcon, label: "1,284" },
    { icon: GitForkIcon, label: "96" },
    { icon: GitPullRequestIcon, label: "7 open" },
    { icon: CircleDotIcon, label: "12 issues" },
  ];

  return (
    <Frame>
      <div className="flex items-start gap-3">
        <GithubMark className="text-text-secondary mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-medium">shahzaib/leadfinder</p>
          <p className="text-text-secondary mt-1 text-xs">
            CRM &amp; lead management platform built with Next.js
          </p>
        </div>
      </div>

      <div className="text-text-tertiary mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {stats.map((stat) => (
          <span key={stat.label} className="inline-flex items-center gap-1.5">
            <stat.icon className="size-3.5" aria-hidden="true" />
            {stat.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-status-info size-2 rounded-full" aria-hidden="true" />
          TypeScript
        </span>
      </div>

      <div className="border-line mt-4 space-y-2 border-t pt-4">
        {[
          { branch: "main", message: "feat: add lead scoring pipeline", time: "2h ago" },
          { branch: "fix/auth", message: "fix: refresh token rotation", time: "1d ago" },
        ].map((commit) => (
          <div key={commit.branch} className="flex items-center gap-2 text-xs">
            <GitBranchIcon className="text-text-tertiary size-3.5 shrink-0" aria-hidden="true" />
            <span className="text-text-secondary shrink-0 font-mono">{commit.branch}</span>
            <span className="text-text-tertiary truncate">{commit.message}</span>
            <span className="text-text-tertiary ml-auto shrink-0 font-mono text-[10px]">
              {commit.time}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function DeploymentVisual() {
  // The pipeline is mid-flight: the first two stages are done, testing is live.
  const activeIndex = 2;

  return (
    <Frame>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-sm font-medium">v1.4.2</span>
        <span className="text-text-tertiary font-mono text-xs">1m 48s</span>
      </div>

      <ol className="space-y-0">
        {DEPLOYMENT_PIPELINE.map((stage, index) => {
          const meta = DEPLOYMENT_STATUS_META[stage];
          const done = index < activeIndex;
          const active = index === activeIndex;
          const last = index === DEPLOYMENT_PIPELINE.length - 1;

          return (
            <li key={stage} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StatusDot
                  tone={done ? "success" : active ? "warning" : "neutral"}
                  pulsing={active}
                />
                {last ? null : (
                  <span
                    aria-hidden="true"
                    className={cn("w-px flex-1", done ? "bg-status-success/40" : "bg-line")}
                  />
                )}
              </div>
              <div className={cn("pb-4", last && "pb-0")}>
                <p
                  className={cn(
                    "text-xs font-medium",
                    done || active ? "text-foreground" : "text-text-tertiary",
                  )}
                >
                  {meta.label}
                </p>
                <p className="text-text-tertiary mt-0.5 font-mono text-[10px]">
                  {done ? "completed" : active ? "in progress" : "pending"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Frame>
  );
}

const LOG_LINES = [
  { prefix: "$", text: "npm run build", tone: "text-foreground" },
  { prefix: ">", text: "Compiled successfully in 12.6s", tone: "text-status-success" },
  { prefix: ">", text: "Collecting page data …", tone: "text-text-secondary" },
  { prefix: ">", text: "Generating static pages (12/12)", tone: "text-text-secondary" },
  { prefix: ">", text: "Deployed to production", tone: "text-status-success" },
];

export function ApiVisual() {
  return (
    <Frame className="p-0">
      <div className="border-line flex items-center gap-2 border-b px-4 py-2.5">
        <span className="bg-brand-500/15 text-brand-500 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold">
          POST
        </span>
        <span className="text-text-secondary truncate font-mono text-xs">/api/projects</span>
        <span className="bg-status-success/15 text-status-success ml-auto shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold">
          201
        </span>
      </div>
      <div className="space-y-1 px-4 py-3 font-mono text-[11px] leading-relaxed">
        {LOG_LINES.map((line) => (
          <div key={line.text} className="flex gap-2">
            <span className="text-text-tertiary select-none">{line.prefix}</span>
            <span className={cn("truncate", line.tone)}>{line.text}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

const SERIES = [22, 34, 28, 46, 39, 58, 51, 67, 60, 78, 72, 88, 81, 94];

export function AnalyticsVisual() {
  return (
    <Frame>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-text-secondary text-xs">API Requests</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">1,248,392</p>
        </div>
        <span className="text-status-success font-mono text-xs">+18.4%</span>
      </div>

      <div className="mt-5 flex h-24 items-end gap-1" aria-hidden="true">
        {SERIES.map((value, index) => (
          <div
            key={index}
            className={cn(
              "flex-1 rounded-sm transition-colors",
              index >= SERIES.length - 3 ? "bg-brand-500" : "bg-surface-3",
            )}
            style={{ height: `${value}%` }}
          />
        ))}
      </div>

      <div className="text-text-tertiary mt-3 flex justify-between font-mono text-[10px]">
        <span>24H</span>
        <span>7D</span>
        <span>30D</span>
        <span>90D</span>
      </div>
    </Frame>
  );
}

export function TeamVisual() {
  const members = [
    { name: "Shahzaib Panhwer", role: "Owner", initials: "SP" },
    { name: "Amara Khan", role: "Admin", initials: "AK" },
    { name: "Tobias Meyer", role: "Developer", initials: "TM" },
    { name: "Rin Watanabe", role: "Viewer", initials: "RW" },
  ];

  return (
    <Frame className="p-0">
      <div className="divide-line divide-y">
        {members.map((member) => (
          <div key={member.name} className="flex items-center gap-3 px-4 py-3">
            <span className="bg-surface-3 text-text-secondary flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium">
              {member.initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{member.name}</span>
            <span
              className={cn(
                "border-line shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                member.role === "Owner"
                  ? "text-brand-500 border-brand-500/30"
                  : "text-text-tertiary",
              )}
            >
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function PublicPageVisual() {
  return (
    <Frame>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight">LeadFinder</p>
          <p className="text-text-secondary mt-1 text-xs">CRM &amp; Lead Management Platform</p>
        </div>
        <span className="text-status-success inline-flex shrink-0 items-center gap-1.5 text-xs">
          <StatusDot tone="success" />
          Production
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {["Next.js", "Node.js", "PostgreSQL"].map((tech) => (
          <span
            key={tech}
            className="border-line bg-surface-2 text-text-secondary rounded border px-2 py-0.5 font-mono text-[10px]"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="border-line mt-4 grid grid-cols-3 gap-3 border-t pt-4">
        {[
          { value: "98", label: "Performance" },
          { value: "42", label: "Deployments" },
          { value: "1.2M", label: "API Requests" },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="font-mono text-base font-semibold tabular-nums">{stat.value}</p>
            <p className="text-text-tertiary mt-0.5 text-[10px]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <span className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium">
          Live Demo
          <ExternalLinkIcon className="size-3" aria-hidden="true" />
        </span>
        <span className="border-line text-text-secondary inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium">
          <GithubMark className="size-3" />
          GitHub
        </span>
      </div>
    </Frame>
  );
}
