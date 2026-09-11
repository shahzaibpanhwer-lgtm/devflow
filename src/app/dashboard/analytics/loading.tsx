import { PageHeader } from "@/components/devflow/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Request volume, latency, errors and release cadence across your workspace."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="border-line bg-surface-1 rounded-lg border p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <div className="border-line bg-surface-1 rounded-lg border p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="border-line bg-surface-1 rounded-lg border p-4 lg:col-span-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-56 w-full" />
          </div>
          <div className="border-line bg-surface-1 rounded-lg border p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-40 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
