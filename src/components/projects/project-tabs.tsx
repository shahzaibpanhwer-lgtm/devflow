"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "deployments", label: "Deployments" },
  { value: "analytics", label: "Analytics" },
  { value: "api", label: "API" },
  { value: "team", label: "Team" },
  { value: "docs", label: "Documentation" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

/**
 * Tab switching needs client state, but every panel is rendered on the server
 * and passed in as children — so no project data reaches the client bundle.
 */
export function ProjectTabs({ panels }: { panels: Record<TabValue, ReactNode> }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      {/* The trigger row scrolls rather than wrapping on narrow viewports. */}
      <div className="-mx-1 overflow-x-auto px-1">
        <TabsList className="w-max">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-5">
          {panels[tab.value]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
