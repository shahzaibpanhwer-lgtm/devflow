import { BookTextIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/devflow/empty-state";
import { PageHeader } from "@/components/devflow/page-header";

export const metadata: Metadata = {
  title: "Documentation",
};

export default function DocumentationPage() {
  return (
    <div>
      <PageHeader
        title="Documentation"
        description="Reference for the DevFlow API — endpoints, parameters, responses and code samples."
      />
      <EmptyState
        icon={BookTextIcon}
        title="Documentation is being written"
        description="Endpoint reference, authentication guides and multi-language code samples land in the documentation phase."
      />
    </div>
  );
}
