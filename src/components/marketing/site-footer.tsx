import Link from "next/link";

import { Logo } from "@/components/devflow/logo";

export function SiteFooter() {
  return (
    <footer className="border-line border-t py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5">
          <Logo />
          <p className="text-text-tertiary max-w-xs text-sm leading-relaxed text-pretty">
            One command center for your entire development workflow.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link
            href="/dashboard"
            className="text-text-secondary hover:text-foreground group relative transition-colors duration-200"
          >
            Workspace
            <span
              aria-hidden="true"
              className="bg-brand-500 absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
            />
          </Link>
          <Link
            href="/dashboard/docs"
            className="text-text-secondary hover:text-foreground group relative transition-colors duration-200"
          >
            Documentation
            <span
              aria-hidden="true"
              className="bg-brand-500 absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
            />
          </Link>
          <a
            href="https://github.com/shahzaibpanhwer-lgtm/devflow"
            target="_blank"
            rel="noreferrer"
            className="text-text-secondary hover:text-foreground group relative transition-colors duration-200"
          >
            GitHub
            <span
              aria-hidden="true"
              className="bg-brand-500 absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
