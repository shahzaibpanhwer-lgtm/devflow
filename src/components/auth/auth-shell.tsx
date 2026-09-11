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
 * a decorative panel would put the first field off-screen.
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <AuthVisual />

      <main className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Reveal index={0}>
            <Link
              href="/"
              className="mb-8 inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <Logo />
            </Link>
          </Reveal>

          <Reveal index={1}>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-text-secondary mt-1.5 text-sm text-pretty">{description}</p>
          </Reveal>

          <Reveal index={2} className="mt-8">
            {children}
          </Reveal>

          <Reveal index={3}>
            <p className="text-text-secondary mt-6 text-center text-sm">{footer}</p>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
