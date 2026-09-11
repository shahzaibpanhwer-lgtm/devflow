"use client";

import { API_CATALOG, type CatalogEndpoint, type HttpMethod } from "@/lib/api-catalog";
import { cn } from "@/lib/utils";

/** Method colours double as the only place method identity is encoded, so the
 *  label is always the method name itself rather than colour alone. */
const METHOD_CLASS: Record<HttpMethod, string> = {
  GET: "text-chart-1",
  POST: "text-chart-status-success",
  PUT: "text-chart-status-warning",
  PATCH: "text-chart-status-warning",
  DELETE: "text-chart-status-danger",
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
