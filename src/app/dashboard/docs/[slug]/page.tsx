import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DocsShell } from "@/components/docs/docs-shell";
import { getCurrentUser } from "@/lib/current-user";
import { DOC_SECTIONS, findSection } from "@/lib/docs";

type PageProps = { params: Promise<{ slug: string }> };

/**
 * The reference is static content, so every section is generated at build.
 *
 * `dynamicParams = false` makes an unknown slug a real 404 from the routing
 * layer. Without it the dashboard shell starts streaming before the page can
 * call notFound(), the status is committed as 200, and the result is a soft
 * 404 — a page that says "not found" while claiming to have been found.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_SECTIONS.map((section) => ({ slug: section.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = findSection(slug);
  return { title: section ? section.title : "Documentation" };
}

export default async function DocSectionPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const section = findSection(slug);
  if (!section) notFound();

  return <DocsShell section={section} />;
}
