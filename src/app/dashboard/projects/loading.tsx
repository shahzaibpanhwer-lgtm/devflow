import { PageHeader } from "@/components/devflow/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div>
      <PageHeader
        title="Projects"
        description="Every application in your workspace, with its repository, environment and deployment state."
      />
      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-9 w-full sm:max-w-xs" />
        <Skeleton className="h-9 w-full sm:w-44" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="border-line bg-surface-1 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-3 w-20" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-2/3" />
            <Skeleton className="mt-5 h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
