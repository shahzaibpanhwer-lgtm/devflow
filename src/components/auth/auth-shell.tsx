import Link from "next/link";
import type { ReactNode } from "react";

import { AuthVisual } from "@/components/auth/auth-visual";
import { Reveal } from "@/components/auth/reveal";
import { Logo } from "@/components/devflow/logo";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * Two-column sign-in layout: the visual on the left, the form on the right.
 *
 * The visual collapses away below `lg` rather than stacking above the form —
 * on a phone the form is the only thing anyone came for, and pushing it below
 * a decorative panel would put the first field off-screen. In its place the
 * small screen gets a faint glow, so the page is not simply a form on black.
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <AuthVisual />

      <main className="relative flex flex-col items-center justify-center px-6 py-12">
        {/* Stands in for the visual panel on narrow screens. */}
        <span
          aria-hidden="true"
          className="bg-brand-500/10 pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full blur-[100px] lg:hidden"
        />

        <div className="relative w-full max-w-104">
          <Reveal index={0}>
            <Link
              href="/"
              className="mb-7 inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 lg:hidden"
            >
              <Logo />
            </Link>
          </Reveal>

          {/*
            A panel rather than a bare form. On a near-black ground an
            unbounded form has nothing to sit against, and the eye has no edge
            to read the layout from.
          */}
          <div className="border-line bg-surface-1/60 relative overflow-hidden rounded-xl border p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
            {/* Accent hairline — the one place the brand colour appears on
                this side, marking where the content starts. */}
            <span
              aria-hidden="true"
              className="via-brand-500/70 absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent"
            />

            <Reveal index={1}>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-text-secondary mt-1.5 text-sm text-pretty">{description}</p>
            </Reveal>

            <Reveal index={2} className="mt-7">
              {children}
            </Reveal>
          </div>

          <Reveal index={3}>
            <p className="text-text-secondary mt-6 text-center text-sm">{footer}</p>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
