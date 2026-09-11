import { PageHeader } from "@/components/devflow/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function DeploymentsLoading() {
  return (
    <div>
      <PageHeader
        title="Deployments"
        description="Every release across your projects, with its pipeline, build output and result."
      />
      <div className="border-line bg-surface-1 overflow-hidden rounded-lg border">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="border-line flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
          >
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="ml-auto h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
