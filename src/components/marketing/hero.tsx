import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { FadeIn } from "@/components/devflow/fade-in";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Restrained accent wash — a single soft ellipse, not a gradient field. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 opacity-[0.07] blur-3xl"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 50%, var(--color-brand-500) 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <p className="text-text-tertiary font-mono text-xs font-medium tracking-[0.32em] uppercase">
            DevFlow
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            One command center for your entire development workflow.
          </h1>
          <p className="text-text-secondary mx-auto mt-6 max-w-2xl text-base text-pretty sm:text-lg">
            Manage projects, deployments, APIs, GitHub activity and team workflows from one powerful
            workspace.
          </p>
        </FadeIn>

        <FadeIn delay={0.08} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">
              Start Building
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#preview">View Demo</a>
          </Button>
        </FadeIn>

        <FadeIn delay={0.16} className="mt-14 sm:mt-20">
          <div id="preview" className="scroll-mt-20">
            <DashboardPreview />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
