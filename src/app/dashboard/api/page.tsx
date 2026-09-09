import { TerminalIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/devflow/empty-state";
import { PageHeader } from "@/components/devflow/page-header";

export const metadata: Metadata = {
  title: "API Playground",
};

export default function ApiPlaygroundPage() {
  return (
    <div>
      <PageHeader
        title="API Playground"
        description="Compose and send requests against the DevFlow API, then inspect the full response."
      />
      <EmptyState
        icon={TerminalIcon}
        title="Playground not configured"
        description="The request editor, collections and response inspector arrive with the API phase."
      />
    </div>
  );
}
