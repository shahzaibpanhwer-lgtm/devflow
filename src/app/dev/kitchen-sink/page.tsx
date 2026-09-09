import { FolderGitIcon, PlusIcon, RocketIcon, TerminalIcon, TriangleAlertIcon } from "lucide-react";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/devflow/empty-state";
import { ErrorState } from "@/components/devflow/error-state";
import { GithubMark } from "@/components/devflow/github-mark";
import { Logo } from "@/components/devflow/logo";
import { PageHeader } from "@/components/devflow/page-header";
import { StatCard } from "@/components/devflow/stat-card";
import { StatusBadge } from "@/components/devflow/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPLOYMENT_STATUSES, PROJECT_STATUSES } from "@/lib/status";

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;
// Written out in full: Tailwind scans source text, so an interpolated
// `bg-${name}` would never be generated.
const SURFACES = [
  { name: "surface-0", className: "bg-surface-0" },
  { name: "surface-1", className: "bg-surface-1" },
  { name: "surface-2", className: "bg-surface-2" },
  { name: "surface-3", className: "bg-surface-3" },
] as const;
const SWATCHES = [
  "bg-brand-500",
  "bg-status-success",
  "bg-status-warning",
  "bg-status-danger",
  "bg-status-info",
  "bg-status-neutral",
] as const;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-text-secondary font-mono text-xs tracking-[0.16em] uppercase">{title}</h2>
      <div className="border-line bg-surface-1 rounded-lg border p-6">{children}</div>
    </section>
  );
}

/**
 * Internal reference for the design system. Excluded from production so it
 * never becomes part of the shipped surface area.
 */
export default function KitchenSinkPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-6 py-12">
      <PageHeader
        title="Kitchen sink"
        description="Every design-system primitive on one page. Development only."
        badge={<Badge variant="secondary">internal</Badge>}
        actions={
          <Button size="sm">
            <PlusIcon aria-hidden="true" />
            Primary action
          </Button>
        }
      />

      <Group title="Brand">
        <div className="flex flex-wrap items-center gap-8">
          <Logo />
          <Logo markOnly />
          <GithubMark className="size-6" />
        </div>
      </Group>

      <Group title="Surfaces">
        <div className="flex flex-wrap gap-3">
          {SURFACES.map((surface) => (
            <div key={surface.name} className="space-y-1.5">
              <div className={`border-line size-20 rounded-md border ${surface.className}`} />
              <p className="text-text-tertiary font-mono text-[10px]">{surface.name}</p>
            </div>
          ))}
          {SWATCHES.map((swatch) => (
            <div key={swatch} className="space-y-1.5">
              <div className={`border-line size-20 rounded-md border ${swatch}`} />
              <p className="text-text-tertiary font-mono text-[10px]">{swatch.slice(3)}</p>
            </div>
          ))}
        </div>
      </Group>

      <Group title="Typography">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">Display — 36px semibold</h1>
          <h2 className="text-2xl font-semibold tracking-tight">Heading — 24px semibold</h2>
          <h3 className="text-base font-medium">Subheading — 16px medium</h3>
          <p className="text-sm">Body — 14px regular, the workspace default.</p>
          <p className="text-text-secondary text-sm">Secondary — muted supporting copy.</p>
          <p className="text-text-tertiary text-xs">Tertiary — 12px metadata and labels.</p>
          <p className="font-mono text-sm">Mono — 14px for versions, IDs and payloads.</p>
        </div>
      </Group>

      <Group title="Buttons">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
          <Separator />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Add">
              <PlusIcon aria-hidden="true" />
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Group>

      <Group title="Status">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PROJECT_STATUSES.map((status) => (
              <StatusBadge key={status} kind="project" status={status} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {DEPLOYMENT_STATUSES.map((status) => (
              <StatusBadge key={status} kind="deployment" status={status} />
            ))}
          </div>
        </div>
      </Group>

      <Group title="Metrics">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Projects" value="12" icon={FolderGitIcon} delta="+2" emphasis />
          <StatCard
            label="Deployments"
            value="248"
            icon={RocketIcon}
            delta="+18.4%"
            deltaIntent="positive"
          />
          <StatCard label="API Requests" value="1.2M" icon={TerminalIcon} />
          <StatCard
            label="Error Rate"
            value="0.14%"
            icon={TriangleAlertIcon}
            delta="+0.03%"
            deltaIntent="negative"
          />
        </div>
      </Group>

      <Group title="Forms">
        <div className="grid max-w-md gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ks-name">Project name</Label>
            <Input id="ks-name" placeholder="LeadFinder" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ks-invalid">Slug</Label>
            <Input id="ks-invalid" defaultValue="Lead Finder" aria-invalid />
            <p className="text-status-danger text-xs">Slugs may only contain lowercase letters.</p>
          </div>
        </div>
      </Group>

      <Group title="Loading">
        <div className="space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </div>
      </Group>

      <Group title="Empty state">
        <EmptyState
          icon={FolderGitIcon}
          title="No projects yet"
          description="Create your first project to connect a repository and track deployments."
          action={
            <Button size="sm">
              <PlusIcon aria-hidden="true" />
              Create project
            </Button>
          }
        />
      </Group>

      <Group title="Error state">
        <ErrorState />
      </Group>
    </div>
  );
}
