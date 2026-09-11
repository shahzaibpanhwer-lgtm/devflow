import { CheckCircle2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";

import type { StatusSlice } from "@/lib/analytics-range";

/**
 * Share of responses by status class.
 *
 * Three values that sum to a whole, so this is a proportion bar rather than a
 * chart: at ~97% success one segment dominates completely, and a pie or bar
 * chart would spend a lot of space showing that the other two are small.
 *
 * These are status colours, so each segment ships with an icon and a written
 * label — state is never carried by colour alone. The steps are the
 * chart-specific status tokens, validated for the dark chart surface.
 */

const META = {
  "2xx": { color: "var(--chart-status-success)", icon: CheckCircle2Icon },
  "4xx": { color: "var(--chart-status-warning)", icon: TriangleAlertIcon },
  "5xx": { color: "var(--chart-status-danger)", icon: OctagonXIcon },
} as const;

export function StatusBreakdown({ slices }: { slices: StatusSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);

  if (total === 0) {
    return (
      <p className="text-text-secondary py-6 text-center text-sm">No requests in this period.</p>
    );
  }

  return (
    <div>
      <div
        className="border-line flex h-2.5 w-full overflow-hidden rounded-full border"
        role="img"
        aria-label={slices
          .map((slice) => `${slice.label} ${((slice.count / total) * 100).toFixed(1)}%`)
          .join(", ")}
      >
        {slices
          .filter((slice) => slice.count > 0)
          .map((slice) => (
            <span
              key={slice.klass}
              /* A hairline of surface between segments keeps adjacent fills
                 from reading as one continuous band. */
              className="border-surface-1 h-full border-r-2 last:border-r-0"
              style={{
                width: `${(slice.count / total) * 100}%`,
                backgroundColor: META[slice.klass].color,
              }}
            />
          ))}
      </div>

      <dl className="mt-4 space-y-2.5">
        {slices.map((slice) => {
          const Icon = META[slice.klass].icon;
          const share = total === 0 ? 0 : (slice.count / total) * 100;

          return (
            <div key={slice.klass} className="flex items-center gap-2.5 text-sm">
              <Icon
                className="size-3.5 shrink-0"
                style={{ color: META[slice.klass].color }}
                aria-hidden="true"
              />
              <dt className="text-text-secondary">
                <span className="font-mono">{slice.klass}</span>
                <span className="text-text-tertiary ml-1.5 text-xs">{slice.label}</span>
              </dt>
              <dd className="ml-auto flex items-baseline gap-2">
                <span className="font-mono text-xs tabular-nums">
                  {slice.count.toLocaleString()}
                </span>
                <span className="text-text-tertiary w-12 text-right font-mono text-xs tabular-nums">
                  {share.toFixed(1)}%
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
