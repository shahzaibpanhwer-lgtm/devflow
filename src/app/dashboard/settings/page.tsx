import { SettingsIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/devflow/empty-state";
import { PageHeader } from "@/components/devflow/page-header";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Account preferences, workspace configuration and connected integrations."
      />
      <EmptyState
        icon={SettingsIcon}
        title="Settings unavailable"
        description="Account and workspace settings become editable once authentication is wired up."
      />
    </div>
  );
}
