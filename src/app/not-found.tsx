import { FileQuestionIcon } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/devflow/logo";
import { Button } from "@/components/ui/button";

/**
 * Root not-found page.
 *
 * Rendered for any route that does not exist, and for pages that call
 * notFound() before their response has begun streaming.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <Link href="/" className="mb-8 inline-flex rounded-sm">
        <Logo />
      </Link>

      <div className="border-line bg-surface-2 text-text-secondary mb-5 flex size-11 items-center justify-center rounded-lg border">
        <FileQuestionIcon className="size-5" aria-hidden="true" />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-text-secondary mt-2 max-w-sm text-sm text-pretty">
        That page does not exist, or you do not have access to it.
      </p>

      <div className="mt-6 flex items-center gap-2">
        <Button asChild size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </main>
  );
}
