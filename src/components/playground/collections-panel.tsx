"use client";

import { API_CATALOG, type CatalogEndpoint, type HttpMethod } from "@/lib/api-catalog";
import { cn } from "@/lib/utils";

/*
 * Method colours come from the text palette, not the chart palette. The chart
 * tokens are stepped for marks on a chart surface and are too dark for text —
 * DELETE measured 4.1:1 against the 4.5 minimum. The status tokens all clear
 * it.
 *
 * Colour is never the only encoding either way: the label is always the method
 * name itself, so nothing depends on telling the colours apart.
 */
const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: "text-status-info",
  POST: "text-status-success",
  PUT: "text-status-warning",
  PATCH: "text-status-warning",
  DELETE: "text-status-danger",
};

export function CollectionsPanel({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (endpoint: CatalogEndpoint) => void;
}) {
  return (
    <nav aria-label="API collections" className="h-full overflow-y-auto p-2">
      {API_CATALOG.map((group) => (
        <section key={group.name} className="mb-3 last:mb-0">
          <h3 className="text-text-tertiary px-2 py-1 text-[11px] font-medium tracking-wide uppercase">
            {group.name}
          </h3>
          <ul className="space-y-0.5">
            {group.endpoints.map((endpoint) => {
              const active = endpoint.id === activeId;
              return (
                <li key={endpoint.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(endpoint)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "focus-visible:ring-ring/50 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors focus-visible:ring-3 focus-visible:outline-none",
                      active
                        ? "bg-sidebar-accent text-foreground"
                        : "text-text-secondary hover:bg-sidebar-accent/60 hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "w-12 shrink-0 font-mono text-[10px] font-semibold",
                        METHOD_CLASS[endpoint.method],
                      )}
                    >
                      {endpoint.method}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">
                      {endpoint.path}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
