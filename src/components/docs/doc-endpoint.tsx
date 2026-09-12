import { CodeTabs } from "@/components/docs/code-tabs";
import type { DocEndpoint, DocParameter } from "@/lib/docs";
import { cn } from "@/lib/utils";

/*
 * Method colours come from the text palette, not the chart palette. The chart
 * tokens are stepped for marks on a chart surface and are too dark for text —
 * DELETE measured 4.1:1 against the 4.5 minimum. The status tokens all clear
 * it, and the method name is always spelled out beside the colour anyway.
 */
const METHOD_CLASS: Record<DocEndpoint["method"], string> = {
  GET: "text-status-info",
  POST: "text-status-success",
  PUT: "text-status-warning",
  PATCH: "text-status-warning",
  DELETE: "text-status-danger",
};

function ParameterTable({ title, rows }: { title: string; rows: DocParameter[] }) {
  return (
    <div>
      <h4 className="text-text-secondary mb-2 text-xs font-medium tracking-wide uppercase">
        {title}
      </h4>
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr className="border-line border-b">
              <th scope="col" className="text-text-tertiary py-1.5 text-left text-xs font-medium">
                Name
              </th>
              <th scope="col" className="text-text-tertiary py-1.5 text-left text-xs font-medium">
                Type
              </th>
              <th scope="col" className="text-text-tertiary py-1.5 text-left text-xs font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-line border-b last:border-b-0">
                <td className="py-2 pr-3 align-top font-mono text-xs">
                  {row.name}
                  {row.required ? (
                    <span className="text-status-danger ml-1" title="Required">
                      *
                    </span>
                  ) : null}
                </td>
                <td className="text-text-tertiary py-2 pr-3 align-top font-mono text-xs">
                  {row.type}
                </td>
                <td className="text-text-secondary py-2 align-top text-xs">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DocEndpointBlock({ endpoint }: { endpoint: DocEndpoint }) {
  return (
    <section className="border-line bg-surface-1 space-y-4 rounded-lg border p-4">
      <header>
        <p className="flex flex-wrap items-center gap-2 font-mono text-sm">
          <span className={cn("font-semibold", METHOD_CLASS[endpoint.method])}>
            {endpoint.method}
          </span>
          <span className="break-all">{endpoint.path}</span>
        </p>
        <p className="text-text-secondary mt-2 text-sm text-pretty">{endpoint.description}</p>
      </header>

      {endpoint.parameters?.length ? (
        <ParameterTable title="Query parameters" rows={endpoint.parameters} />
      ) : null}
      {endpoint.bodyFields?.length ? (
        <ParameterTable title="Request body" rows={endpoint.bodyFields} />
      ) : null}

      <div>
        <h4 className="text-text-secondary mb-2 text-xs font-medium tracking-wide uppercase">
          Example request
        </h4>
        <CodeTabs samples={endpoint.samples} />
      </div>

      <div>
        <h4 className="text-text-secondary mb-2 text-xs font-medium tracking-wide uppercase">
          Response
        </h4>
        <pre className="border-line bg-surface-0 text-text-secondary overflow-x-auto rounded-md border p-3 font-mono text-xs leading-relaxed">
          <code>{endpoint.response}</code>
        </pre>
      </div>
    </section>
  );
}
