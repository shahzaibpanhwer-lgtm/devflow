"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ANALYTICS_RANGES, type AnalyticsRange } from "@/lib/analytics-range";
import { cn } from "@/lib/utils";

/**
 * Time range selector.
 *
 * The choice lives in the URL, so a range is shareable, survives a refresh and
 * lets the server component query the database for exactly that window rather
 * than shipping every bucket to the browser and filtering there.
 */
export function RangeFilter({ current }: { current: AnalyticsRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(range: AnalyticsRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.replace(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <div
      role="group"
      aria-label="Time range"
      className="border-line bg-surface-1 inline-flex rounded-md border p-0.5"
    >
      {ANALYTICS_RANGES.map((range) => {
        const active = range === current;
        return (
          <button
            key={range}
            type="button"
            onClick={() => select(range)}
            aria-pressed={active}
            className={cn(
              "focus-visible:ring-ring/50 rounded px-2.5 py-1 font-mono text-xs transition-colors focus-visible:ring-3 focus-visible:outline-none",
              active
                ? "bg-surface-3 text-foreground font-medium"
                : "text-text-secondary hover:text-foreground",
            )}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}
