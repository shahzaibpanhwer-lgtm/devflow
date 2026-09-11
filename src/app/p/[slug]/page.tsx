import { ArrowUpRightIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GithubMark } from "@/components/devflow/github-mark";
import { Logo } from "@/components/devflow/logo";
import { StatusDot } from "@/components/devflow/status-dot";
import { Button } from "@/components/ui/button";
import { getPublicProject, getPublicProjectStats } from "@/lib/projects";
import { PROJECT_STATUS_META, type ProjectStatus } from "@/lib/status";

type PageProps = { params: Promise<{ slug: string }> };

/**
 * Public project page.
 *
 * Deliberately outside the dashboard layout: nothing above it streams, so a
 * missing or unpublished project produces a real 404 rather than a page that
 * says "not found" while reporting 200. Crawlers and link previews see the
 * status they should.
 */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicProject(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  const description =
    project.description ?? `${project.name} — built with ${project.framework ?? "DevFlow"}.`;

  return {
    title: project.name,
    description,
    openGraph: {
      title: project.name,
      description,
      type: "website",
      siteName: "DevFlow",
    },
    twitter: {
      card: "summary_large_image",
      title: project.name,
      description,
    },
  };
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(value);
}

export default async function PublicProjectPage({ params }: PageProps) {
  const { slug } = await params;

  const project = await getPublicProject(slug);
  if (!project) notFound();

  const stats = await getPublicProjectStats(project.id);
  const statusMeta = PROJECT_STATUS_META[project.status as ProjectStatus];

  // Only the pieces that describe how it was built, in the order they matter.
  const stack = [project.framework, project.repository?.language].filter((entry): entry is string =>
    Boolean(entry),
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-line border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="rounded-sm">
            <Logo />
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/register">
              Build yours
              <ArrowUpRightIcon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:py-24">
        <p className="text-text-tertiary mb-4 flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
          <StatusDot tone={statusMeta.tone} pulsing={statusMeta.pulsing} />
          {statusMeta.label}
        </p>

        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {project.name}
        </h1>

        {project.description ? (
          <p className="text-text-secondary mt-4 max-w-xl text-lg text-pretty">
            {project.description}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {project.productionUrl ? (
            <Button asChild size="lg">
              <a href={project.productionUrl} target="_blank" rel="noreferrer">
                Live demo
                <ExternalLinkIcon aria-hidden="true" />
              </a>
            </Button>
          ) : null}
          {project.repositoryUrl ? (
            <Button asChild variant="outline" size="lg">
              <a href={project.repositoryUrl} target="_blank" rel="noreferrer">
                <GithubMark className="size-4" />
                GitHub
              </a>
            </Button>
          ) : null}
        </div>

        {stack.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-text-tertiary text-xs font-medium tracking-wide uppercase">
              Built with
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {stack.map((entry) => (
                <li
                  key={entry}
                  className="border-line bg-surface-1 rounded-md border px-2.5 py-1 font-mono text-xs"
                >
                  {entry}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-14">
          <h2 className="text-text-tertiary text-xs font-medium tracking-wide uppercase">
            By the numbers
          </h2>
          <dl className="border-line mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-4">
            {[
              { label: "Deployments", value: formatCompact(stats.deployments) },
              { label: "API requests", value: formatCompact(stats.apiRequests) },
              {
                label: "Success rate",
                value: stats.successRate === null ? "—" : `${stats.successRate.toFixed(0)}%`,
              },
              { label: "Stars", value: formatCompact(project.repository?.stars ?? 0) },
            ].map((stat) => (
              <div key={stat.label} className="bg-surface-1 px-4 py-5">
                <dd className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
                  {stat.value}
                </dd>
                <dt className="text-text-tertiary mt-1 text-xs">{stat.label}</dt>
              </div>
            ))}
          </dl>
          <p className="text-text-tertiary mt-2 text-xs">
            Figures cover this project&rsquo;s full recorded history in DevFlow.
          </p>
        </section>

        {project.githubRepository ? (
          <section className="mt-14">
            <h2 className="text-text-tertiary text-xs font-medium tracking-wide uppercase">
              Repository
            </h2>
            <a
              href={`https://github.com/${project.githubRepository}`}
              target="_blank"
              rel="noreferrer"
              className="border-line bg-surface-1 hover:border-line-strong mt-3 flex items-center gap-2.5 rounded-lg border p-4 transition-colors"
            >
              <GithubMark className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate font-mono text-sm">
                {project.githubRepository}
              </span>
              {project.repository ? (
                <span className="text-text-tertiary shrink-0 font-mono text-xs tabular-nums">
                  {project.repository.forks} forks
                </span>
              ) : null}
            </a>
          </section>
        ) : null}
      </main>

      <footer className="border-line border-t">
        <div className="text-text-tertiary mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs">
          <p>
            Published with{" "}
            <Link href="/" className="text-foreground hover:underline">
              DevFlow
            </Link>
          </p>
          <p className="font-mono">/p/{project.slug}</p>
        </div>
      </footer>
    </div>
  );
}
