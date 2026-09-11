import { FileQuestionIcon } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/devflow/logo";
import { Button } from "@/components/ui/button";

/**
 * Shown for a slug that does not exist or is not published.
 *
 * Both cases render identically, so the page cannot be used to work out
 * whether a private project exists behind a guessed slug.
 */
export default function PublicProjectNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <Link href="/" className="mb-8 inline-flex rounded-sm">
        <Logo />
      </Link>

      <div className="border-line bg-surface-2 text-text-secondary mb-5 flex size-11 items-center justify-center rounded-lg border">
        <FileQuestionIcon className="size-5" aria-hidden="true" />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">Project not found</h1>
      <p className="text-text-secondary mt-2 max-w-sm text-sm text-pretty">
        No published project uses this address. It may have been unpublished, renamed, or never
        existed.
      </p>

      <Button asChild size="sm" className="mt-6">
        <Link href="/">Go to DevFlow</Link>
      </Button>
    </main>
  );
}
