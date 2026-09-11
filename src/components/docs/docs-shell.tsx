import type { ReactNode } from "react";

import { DocEndpointBlock } from "@/components/docs/doc-endpoint";
import { DocsNav } from "@/components/docs/docs-nav";
import { PageHeader } from "@/components/devflow/page-header";
import type { DocSection } from "@/lib/docs";

/**
 * Renders one documentation section from its structured description, so every
 * page has the same anatomy: prose, endpoints, then any reference table.
 *
 * Inline code in the prose is marked with backticks in the source and rendered
 * here, which keeps the content free of markup.
 */
function Prose({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <p className="text-text-secondary text-sm leading-relaxed text-pretty">
      {parts.map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={index}
            className="border-line bg-surface-2 text-foreground rounded border px-1 py-0.5 font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}

export function DocsShell({ section, children }: { section: DocSection; children?: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <h2 className="text-text-tertiary mb-2 px-2.5 text-[11px] font-medium tracking-wide uppercase">
          Reference
        </h2>
        <DocsNav />
      </aside>

      <div className="min-w-0">
        <PageHeader title={section.title} description={section.summary} />

        <div className="space-y-5">
          {section.body?.map((paragraph, index) => (
            <Prose key={index} text={paragraph} />
          ))}

          {section.endpoints?.map((endpoint) => (
            <DocEndpointBlock key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
          ))}

          {section.table ? (
            <section className="border-line bg-surface-1 rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-medium">{section.table.caption}</h3>
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[26rem] text-sm">
                  <thead>
                    <tr className="border-line border-b">
                      {section.table.columns.map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className="text-text-tertiary py-1.5 pr-3 text-left text-xs font-medium"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row) => (
                      <tr key={row.join("|")} className="border-line border-b last:border-b-0">
                        {row.map((cell, index) => (
                          <td
                            key={index}
                            className={
                              index === row.length - 1
                                ? "text-text-secondary py-2 pr-3 align-top text-xs"
                                : "py-2 pr-3 align-top font-mono text-xs"
                            }
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {children}
        </div>
      </div>
    </div>
  );
}
