/**
 * Temporary foundation check. Replaced by the marketing landing page once the
 * design-system primitives land in the next phase.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-24">
      <div className="space-y-4">
        <span className="border-line bg-surface-1 text-text-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs">
          <span className="bg-primary size-1.5 rounded-full" />
          Phase 1 — foundation
        </span>
        <h1 className="text-5xl font-semibold tracking-tight">DevFlow</h1>
        <p className="text-text-secondary max-w-xl text-lg">
          One command center for your entire development workflow.
        </p>
      </div>

      <div className="border-line bg-surface-1 rounded-lg border p-6">
        <p className="text-text-tertiary mb-4 font-mono text-xs tracking-wide uppercase">
          Design tokens
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "surface-0", className: "bg-surface-0" },
            { label: "surface-1", className: "bg-surface-1" },
            { label: "surface-2", className: "bg-surface-2" },
            { label: "surface-3", className: "bg-surface-3" },
            { label: "brand-500", className: "bg-brand-500" },
            { label: "success", className: "bg-status-success" },
            { label: "warning", className: "bg-status-warning" },
            { label: "danger", className: "bg-status-danger" },
            { label: "info", className: "bg-status-info" },
          ].map((token) => (
            <div key={token.label} className="flex flex-col gap-1.5">
              <div className={`border-line size-14 rounded-md border ${token.className}`} />
              <span className="text-text-tertiary font-mono text-[10px]">{token.label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
