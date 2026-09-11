import { FileQuestionIcon } from "lucide-react";
import Link from "next/link";

import { DocsNav } from "@/components/docs/docs-nav";
import { EmptyState } from "@/components/devflow/empty-state";
import { PageHeader } from "@/components/devflow/page-header";
import { Button } from "@/components/ui/button";

/**
 * Shown when a documentation slug does not exist.
 *
 * The sidebar stays put so the reader can jump straight to a real section
 * rather than being dropped onto a bare error page.
 */
export default function DocNotFound() {
  return (
    <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <h2 className="text-text-tertiary mb-2 px-2.5 text-[11px] font-medium tracking-wide uppercase">
          Reference
        </h2>
        <DocsNav />
      </aside>

      <div className="min-w-0">
        <PageHeader title="Section not found" />
        <EmptyState
          icon={FileQuestionIcon}
          title="No such documentation section"
          description="That page does not exist. Choose a section from the list to continue."
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/docs">Back to the introduction</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
