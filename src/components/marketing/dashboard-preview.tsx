"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChartNoAxesColumnIcon,
  FolderGitIcon,
  LayoutDashboardIcon,
  RocketIcon,
  TerminalIcon,
} from "lucide-react";
import type { JSX } from "react";
import { useState } from "react";

import { GrowBar, Stagger, StaggerItem } from "@/components/marketing/motion";
import { StatusDot } from "@/components/devflow/status-dot";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboardIcon },
  { id: "deployments", label: "Deployments", icon: RocketIcon },
  { id: "api", label: "API", icon: TerminalIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SIDEBAR_ITEMS = [
  { label: "Overview", icon: LayoutDashboardIcon },
  { label: "Projects", icon: FolderGitIcon },
  { label: "Deployments", icon: RocketIcon },
  { label: "Analytics", icon: ChartNoAxesColumnIcon },
  { label: "API", icon: TerminalIcon },
] as const;

const TRAFFIC = [38, 52, 44, 61, 49, 73, 66, 84, 71, 92, 78, 96];

const REQUEST_BODY = `{
  "name": "DevFlow",
  "status": "active"
}`;

const RESPONSE_BODY = `{
  "success": true,
  "data": { "id": "prj_8f2a" }
}`;

function OverviewPanel() {
  const stats = [
    { label: "Projects", value: "12", emphasis: true },
    { label: "Deployments", value: "248", emphasis: false },
    { label: "API Requests", value: "1.2M", emphasis: false },
    { label: "Error Rate", value: "0.14%", emphasis: false },
  ];

  return (
    <div className="space-y-4">
      {/*
        The tiles land one after another, so the panel reads as an interface
        populating rather than a picture fading in.
      */}
      <Stagger stagger={0.07} delay={0.25} className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StaggerItem
            key={stat.label}
            className={cn(
              "border-line bg-surface-2 rounded-md border p-2.5",
              stat.emphasis && "border-brand-500/30",
            )}
          >
            <p className="text-text-tertiary truncate text-[10px] tracking-wide uppercase">
              {stat.label}
            </p>
            <p
              className={cn(
                "mt-1 font-mono text-sm font-semibold tabular-nums",
                stat.emphasis && "text-brand-500",
              )}
            >
              {stat.value}
            </p>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="border-line bg-surface-2 rounded-md border p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-text-secondary text-[11px] font-medium">API requests</p>
          <p className="text-text-tertiary font-mono text-[10px]">Last 12h</p>
        </div>
        {/* Bars grow from the baseline; the accent bar arrives last so the
            latest reading is what the eye finishes on. */}
        <div className="flex h-20 items-end gap-1" aria-hidden="true">
          {TRAFFIC.map((value, index) => {
            const latest = index === TRAFFIC.length - 1;

            return (
              <GrowBar
                key={index}
                heightPercent={value}
                index={latest ? index + 3 : index}
                className={cn("block flex-1 rounded-sm", latest ? "bg-brand-500" : "bg-surface-3")}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DeploymentsPanel() {
  const rows = [
    {
      version: "v1.4.2",
      env: "Production",
      tone: "success" as const,
      time: "2m ago",
      label: "Success",
      pulsing: false,
    },
    {
      version: "v1.4.1",
      env: "Preview",
      tone: "info" as const,
      time: "1h ago",
      label: "Deploying",
      pulsing: true,
    },
    {
      version: "v1.4.0",
      env: "Production",
      tone: "success" as const,
      time: "5h ago",
      label: "Success",
      pulsing: false,
    },
    {
      version: "v1.3.9",
      env: "Preview",
      tone: "danger" as const,
      time: "Yesterday",
      label: "Failed",
      pulsing: false,
    },
  ];

  return (
    <div className="border-line divide-line divide-y rounded-md border">
      {rows.map((row) => (
        <div key={row.version} className="flex items-center gap-3 px-3 py-2.5">
          <StatusDot tone={row.tone} pulsing={row.pulsing} />
          <span className="font-mono text-xs font-medium">{row.version}</span>
          <span className="text-text-tertiary hidden text-[11px] sm:inline">{row.env}</span>
          <span className="text-text-secondary ml-auto text-[11px]">{row.label}</span>
          <span className="text-text-tertiary hidden font-mono text-[10px] sm:inline">
            {row.time}
          </span>
        </div>
      ))}
    </div>
  );
}

function ApiPanel() {
  return (
    <div className="grid gap-2 lg:grid-cols-2">
      <div className="border-line bg-surface-2 rounded-md border p-3">
        <div className="flex items-center gap-2">
          <span className="bg-brand-500/15 text-brand-500 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold">
            POST
          </span>
          <span className="text-text-secondary truncate font-mono text-[11px]">/api/projects</span>
        </div>
        <pre className="text-text-secondary mt-3 overflow-x-auto font-mono text-[10px] leading-relaxed">
          {REQUEST_BODY}
        </pre>
      </div>
      <div className="border-line bg-surface-2 rounded-md border p-3">
        <div className="flex items-center gap-2">
          <span className="bg-status-success/15 text-status-success rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold">
            201
          </span>
          <span className="text-text-tertiary font-mono text-[10px]">84ms</span>
        </div>
        <pre className="text-text-secondary mt-3 overflow-x-auto font-mono text-[10px] leading-relaxed">
          {RESPONSE_BODY}
        </pre>
      </div>
    </div>
  );
}

const PANELS: Record<TabId, () => JSX.Element> = {
  overview: OverviewPanel,
  deployments: DeploymentsPanel,
  api: ApiPanel,
};

/**
 * Interactive product preview for the hero. The figures are illustrative — the
 * real workspace renders equivalent components against live database records.
 */
export function DashboardPreview() {
  const [tab, setTab] = useState<TabId>("overview");
  const prefersReducedMotion = useReducedMotion();
  const Panel = PANELS[tab];

  return (
    <div className="border-line bg-surface-1 overflow-hidden rounded-xl border shadow-2xl shadow-black/40">
      <div className="border-line bg-surface-2/60 flex h-9 items-center gap-2 border-b px-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="bg-surface-3 size-2.5 rounded-full" />
          <span className="bg-surface-3 size-2.5 rounded-full" />
          <span className="bg-surface-3 size-2.5 rounded-full" />
        </div>
        <div className="border-line bg-surface-1 text-text-tertiary mx-auto hidden rounded px-2 py-0.5 font-mono text-[10px] sm:block">
          devflow.app/dashboard
        </div>
      </div>

      <div className="flex">
        <div className="border-line hidden w-40 shrink-0 border-r px-3 py-3 sm:block">
          {SIDEBAR_ITEMS.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1.5 text-[11px]",
                index === 0 ? "bg-surface-2 text-foreground" : "text-text-tertiary",
              )}
            >
              <item.icon
                className={cn("size-3", index === 0 && "text-brand-500")}
                aria-hidden="true"
              />
              {item.label}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1 p-3">
          <div
            className="border-line mb-3 flex gap-1 border-b pb-2"
            role="tablist"
            aria-label="Preview sections"
          >
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-medium transition-colors",
                  tab === item.id
                    ? "bg-surface-2 text-foreground"
                    : "text-text-tertiary hover:text-text-secondary",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <Panel />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
