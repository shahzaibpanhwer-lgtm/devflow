import Link from "next/link";

import { Logo } from "@/components/devflow/logo";

export function SiteFooter() {
  return (
    <footer className="border-line border-t py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-text-tertiary text-sm">
            One command center for your entire development workflow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link
            href="/dashboard"
            className="text-text-secondary hover:text-foreground transition-colors"
          >
            Workspace
          </Link>
          <Link
            href="/dashboard/docs"
            className="text-text-secondary hover:text-foreground transition-colors"
          >
            Documentation
          </Link>
          <a
            href="https://github.com/shahzaibpanhwer-lgtm/devflow"
            target="_blank"
            rel="noreferrer"
            className="text-text-secondary hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
