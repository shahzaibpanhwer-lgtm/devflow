import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { SectionBackdrop } from "@/components/marketing/backdrop";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Reveal, RevealVisual } from "@/components/marketing/motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <SectionBackdrop variant="hero" />

      <div className="relative mx-auto w-full max-w-6xl px-6 pt-16 pb-16 sm:pt-24 sm:pb-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          {/* Says something the logo does not, rather than repeating the name. */}
          <p className="border-line bg-surface-1/60 text-text-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide">
            <span className="bg-brand-500 size-1.5 rounded-full" aria-hidden="true" />
            Projects, deployments and APIs in one place
          </p>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            One command center for your entire development workflow.
          </h1>

          <p className="text-text-secondary mx-auto mt-6 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
            Manage projects, deployments, APIs, GitHub activity and team workflows from one powerful
            workspace.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {/* `group` drives the arrow; the lift and halo are on the button. */}
          <Button
            asChild
            size="lg"
            className="hover:shadow-brand-500/25 group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Link href="/register">
              Start Building
              <ArrowRightIcon
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="hover:border-line-strong hover:bg-surface-2 transition-all duration-200"
          >
            <a href="#preview">View Demo</a>
          </Button>
        </Reveal>

        <RevealVisual delay={0.16} className="mt-14 sm:mt-20">
          <div id="preview" className="scroll-mt-20">
            {/* A faint halo under the frame lifts it off the page without a
                visible shadow edge. */}
            <div className="relative">
              <div
                aria-hidden="true"
                className="bg-brand-500/10 pointer-events-none absolute -inset-x-8 -top-4 bottom-8 rounded-[2rem] blur-3xl"
              />
              <div className="relative">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </RevealVisual>
      </div>
    </section>
  );
}
