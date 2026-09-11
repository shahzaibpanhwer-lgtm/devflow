import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DocsShell } from "@/components/docs/docs-shell";
import { getCurrentUser } from "@/lib/current-user";
import { findSection } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Documentation",
};

/** /dashboard/docs opens on the introduction rather than redirecting. */
export default async function DocsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const section = findSection("introduction");
  if (!section) notFound();

  return <DocsShell section={section} />;
}
