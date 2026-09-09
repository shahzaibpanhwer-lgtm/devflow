import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { FadeIn } from "@/components/devflow/fade-in";
import { GithubMark } from "@/components/devflow/github-mark";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Hero } from "@/components/marketing/hero";
import { Section, SectionHeading } from "@/components/marketing/section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Spotlight } from "@/components/marketing/spotlight";
import {
  AnalyticsVisual,
  ApiVisual,
  DeploymentVisual,
  GithubVisual,
  PublicPageVisual,
  TeamVisual,
} from "@/components/marketing/spotlight-visuals";
import { TechStack } from "@/components/marketing/tech-stack";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <Hero />

        <Section id="features">
          <SectionHeading
            eyebrow="Features"
            title="Everything a project needs, in one workspace"
            description="Stop stitching together a repository host, a deployment dashboard, an API client and a spreadsheet of keys."
          />
          <FeatureGrid />
        </Section>

        <Section id="github">
          <Spotlight
            eyebrow="GitHub integration"
            title="Your repository, in context"
            description="Authenticate with GitHub and connect a repository to any project. DevFlow reads the metadata you actually care about and keeps it beside your deployments."
            points={[
              "Branches, commits, pull requests and open issues",
              "Stars, forks and primary language at a glance",
              "Rate limits, unauthorised access and missing repositories all handled explicitly",
            ]}
            visual={<GithubVisual />}
          />
        </Section>

        <Section id="deployments">
          <Spotlight
            reverse
            eyebrow="Deployments"
            title="Follow every release, stage by stage"
            description="Each deployment moves through a defined pipeline and keeps its logs. When something fails you can see exactly which stage it failed at."
            points={[
              "Queued, building, testing, deploying and production stages",
              "Terminal-style log viewer with expandable detail",
              "Version, environment, commit and duration recorded per release",
            ]}
            visual={<DeploymentVisual />}
          />
        </Section>

        <Section id="api">
          <Spotlight
            eyebrow="API playground"
            title="Test your endpoints without leaving the tab"
            description="A three-pane client for the DevFlow API — collections on the left, the request editor in the middle, the full response on the right."
            points={[
              "GET, POST, PUT, PATCH and DELETE with headers, params and JSON bodies",
              "Status code, response time, headers and body on every send",
              "Request payloads validated with Zod on the server",
            ]}
            visual={<ApiVisual />}
          />
        </Section>

        <Section id="analytics">
          <Spotlight
            reverse
            eyebrow="Analytics"
            title="Numbers that come from your own data"
            description="Request volume, response times, error rates and deployment frequency, aggregated from the records your workspace actually produced."
            points={[
              "24H, 7D, 30D and 90D windows",
              "Interactive charts that animate as they enter the viewport",
              "Metrics derived from database records, never hardcoded",
            ]}
            visual={<AnalyticsVisual />}
          />
        </Section>

        <Section id="team">
          <Spotlight
            eyebrow="Team collaboration"
            title="Roles enforced where it counts"
            description="Invite collaborators and give them exactly the access they need. Permissions are checked on the server, so the UI is a convenience rather than the boundary."
            points={[
              "Owner, admin, developer and viewer roles",
              "Invite, remove and change roles with a full activity trail",
              "Server-side authorisation on every route handler",
            ]}
            visual={<TeamVisual />}
          />
        </Section>

        <Section id="public-pages">
          <Spotlight
            reverse
            eyebrow="Public project pages"
            title="A shareable page for everything you ship"
            description="Every project gets a public URL at /p/your-slug — a portfolio-grade summary you can hand to a client or drop in a README."
            points={[
              "Live status, tech stack and headline statistics",
              "Direct links to the live deployment and the repository",
              "Publicly accessible, no account required",
            ]}
            visual={<PublicPageVisual />}
          />
        </Section>

        <Section id="stack">
          <SectionHeading
            eyebrow="Stack"
            title="Built on tools worth defending in review"
            description="A conventional, production-shaped stack — chosen so the architecture stays legible to anyone who opens the repository."
          />
          <TechStack />
        </Section>

        <Section className="text-center">
          <FadeIn>
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Bring your whole workflow into one place
            </h2>
            <p className="text-text-secondary mx-auto mt-4 max-w-xl text-base text-pretty">
              Create a project, connect a repository and ship your first deployment in a few
              minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Start Building
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href="https://github.com/shahzaibpanhwer-lgtm/devflow"
                  target="_blank"
                  rel="noreferrer"
                >
                  <GithubMark />
                  View source
                </a>
              </Button>
            </div>
          </FadeIn>
        </Section>
      </main>

      <SiteFooter />
    </>
  );
}
