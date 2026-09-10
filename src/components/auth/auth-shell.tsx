import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/devflow/logo";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Logo />
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-text-secondary mt-1.5 text-sm text-pretty">{description}</p>

        <div className="mt-8">{children}</div>

        <p className="text-text-secondary mt-6 text-center text-sm">{footer}</p>
      </div>
    </main>
  );
}
