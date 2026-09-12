import type { EndpointRow } from "@/lib/analytics-range";
import { cn } from "@/lib/utils";

/*
 * Method colours come from the text palette, not the chart palette. The chart
 * tokens are stepped for marks on a chart surface and are too dark for text —
 * DELETE measured 4.1:1 against the 4.5 minimum. The status tokens all clear
 * it, and the method name is always spelled out beside the colour anyway.
 */
const METHOD_CLASS: Record<string, string> = {
  GET: "text-status-info",
  POST: "text-status-success",
  PUT: "text-status-warning",
  PATCH: "text-status-warning",
  DELETE: "text-status-danger",
};

/**
 * Busiest endpoints.
 *
 * A table rather than a bar chart: each row carries three different measures
 * (volume, latency, error rate), and reading them side by side is what makes
 * the list useful. The volume bar behind each row gives the ranking at a
 * glance without spending a second chart on it.
 */
export function EndpointTable({ endpoints }: { endpoints: EndpointRow[] }) {
  if (endpoints.length === 0) {
    return (
      <p className="text-text-secondary py-6 text-center text-sm">No requests in this period.</p>
    );
  }

  const busiest = Math.max(...endpoints.map((endpoint) => endpoint.requests));

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[30rem] text-sm">
        <thead>
          <tr className="border-line border-b">
            <th scope="col" className="text-text-tertiary py-2 text-left text-xs font-medium">
              Endpoint
            </th>
            <th scope="col" className="text-text-tertiary py-2 text-right text-xs font-medium">
              Requests
            </th>
            <th scope="col" className="text-text-tertiary py-2 text-right text-xs font-medium">
              Avg
            </th>
            <th scope="col" className="text-text-tertiary py-2 text-right text-xs font-medium">
              Errors
            </th>
          </tr>
        </thead>
        <tbody>
          {endpoints.map((endpoint) => (
            <tr key={endpoint.endpoint} className="border-line relative border-b last:border-b-0">
              <td className="relative py-2.5">
                <span
                  className="bg-chart-brand/10 absolute inset-y-1 left-0 rounded-sm"
                  style={{ width: `${(endpoint.requests / busiest) * 100}%` }}
                  aria-hidden="true"
                />
                <span className="relative flex items-center gap-2 font-mono text-xs">
                  <span className={cn("shrink-0 font-medium", METHOD_CLASS[endpoint.method])}>
                    {endpoint.method}
                  </span>
                  <span className="truncate">{endpoint.path}</span>
                </span>
              </td>
              <td className="py-2.5 text-right font-mono text-xs tabular-nums">
                {endpoint.requests.toLocaleString()}
              </td>
              <td className="text-text-secondary py-2.5 text-right font-mono text-xs tabular-nums">
                {endpoint.avgDuration}ms
              </td>
              <td
                className={cn(
                  "py-2.5 text-right font-mono text-xs tabular-nums",
                  endpoint.errorRate > 5 ? "text-status-danger" : "text-text-secondary",
                )}
              >
                {endpoint.errorRate.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
