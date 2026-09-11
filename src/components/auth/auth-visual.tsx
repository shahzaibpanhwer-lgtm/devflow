import {
  ChartNoAxesColumnIcon,
  FolderGitIcon,
  KeyRoundIcon,
  RocketIcon,
  TerminalIcon,
  UsersIcon,
} from "lucide-react";

import { LogoMark } from "@/components/devflow/logo";

/**
 * The visual half of the sign-in screen.
 *
 * DevFlow's own product marks orbiting concentric rings, in the accent on the
 * application's own surface — rather than third-party technology logos, which
 * would say nothing about this product and would pull images from an outside
 * CDN on the first page a visitor sees.
 *
 * Opacities here are deliberately higher than they look on paper: the ground
 * is #0b0d0f, so a white hairline at 5% resolves to about #181a1b and is
 * effectively invisible. Everything is tuned against that surface rather than
 * against a mid-grey.
 *
 * All motion is CSS. The global prefers-reduced-motion rule in globals.css
 * stops it for anyone who has asked for less movement, and the composition is
 * identical when it does.
 */

/** Rings, outermost first. Inner rings carry the accent; outer ones recede. */
const RINGS = [
  { size: 520, className: "border-foreground/[0.07]", dashed: true, opacity: 0.07 },
  { size: 400, className: "border-foreground/10", dashed: false, opacity: 0.1 },
  { size: 280, className: "border-brand-500/25", dashed: false, opacity: 0.25 },
  { size: 160, className: "border-brand-500/40", dashed: false, opacity: 0.4 },
];

/**
 * Marks travelling the rings. Durations are unequal and slow, so the
 * arrangement never settles into a pattern the eye can lock on to.
 */
const ORBITERS = [
  { icon: FolderGitIcon, radius: 80, duration: 26, delay: 0, reverse: false, accent: true },
  { icon: RocketIcon, radius: 80, duration: 26, delay: -13, reverse: false, accent: false },
  { icon: TerminalIcon, radius: 140, duration: 34, delay: -4, reverse: true, accent: false },
  {
    icon: ChartNoAxesColumnIcon,
    radius: 140,
    duration: 34,
    delay: -21,
    reverse: true,
    accent: true,
  },
  { icon: UsersIcon, radius: 200, duration: 42, delay: -8, reverse: false, accent: false },
  { icon: KeyRoundIcon, radius: 200, duration: 42, delay: -29, reverse: false, accent: false },
];

export function AuthVisual() {
  return (
    <section
      aria-hidden="true"
      className="border-line bg-surface-0 relative hidden overflow-hidden border-r lg:flex lg:items-center lg:justify-center"
    >
      {/* Fine grid, faded out towards the edges so it reads as texture rather
          than as a drawn table. */}
      <span
        className="absolute inset-0 opacity-[0.6]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff0a 1px, transparent 1px), linear-gradient(to bottom, #ffffff0a 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 75%)",
        }}
      />

      {/* Two stacked glows: a warm core on the accent, and a wider, cooler
          halo that keeps the corners from going flat black. */}
      <span className="bg-brand-500/25 animate-drift absolute top-1/2 left-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]" />
      <span className="bg-brand-600/10 absolute top-1/2 left-1/2 size-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]" />

      {RINGS.map((ring, index) => (
        <span
          key={ring.size}
          className={`animate-ripple absolute top-1/2 left-1/2 rounded-full border ${ring.className}`}
          style={{
            width: `${ring.size}px`,
            height: `${ring.size}px`,
            borderStyle: ring.dashed ? "dashed" : "solid",
            // Staggered so the rings breathe in sequence, not in unison.
            animationDelay: `${index * 0.6}s`,
            ["--ripple-opacity" as string]: String(ring.opacity),
          }}
        />
      ))}

      {ORBITERS.map((orbiter, index) => {
        const Icon = orbiter.icon;
        return (
          <span
            key={index}
            className="animate-orbit absolute top-1/2 left-1/2 flex size-10 items-center justify-center"
            style={{
              ["--orbit-radius" as string]: String(orbiter.radius),
              ["--orbit-duration" as string]: String(orbiter.duration),
              animationDelay: `${orbiter.delay}s`,
              animationDirection: orbiter.reverse ? "reverse" : "normal",
              marginTop: "-1.25rem",
              marginLeft: "-1.25rem",
            }}
          >
            <span
              className={
                orbiter.accent
                  ? "border-brand-500/40 bg-brand-500/15 text-brand-500 flex size-10 items-center justify-center rounded-xl border shadow-lg shadow-black/40 backdrop-blur-sm"
                  : "border-line-strong bg-surface-2 text-text-secondary flex size-10 items-center justify-center rounded-xl border shadow-lg shadow-black/40 backdrop-blur-sm"
              }
            >
              <Icon className="size-4" />
            </span>
          </span>
        );
      })}

      {/* The centre sits above the rings, with its own backdrop so the type
          never has to compete with a ring passing behind it. */}
      <div className="relative flex max-w-sm flex-col items-center px-8 text-center">
        <span className="border-line-strong bg-surface-1/90 mb-6 flex size-14 items-center justify-center rounded-2xl border shadow-xl shadow-black/50 backdrop-blur-sm">
          <LogoMark className="size-7" />
        </span>

        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          One command center for your entire workflow
        </h2>

        <p className="text-text-secondary mt-3 text-sm text-pretty">
          Projects, deployments, APIs and team activity — together, in one workspace.
        </p>

        <ul className="text-text-tertiary mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-wide uppercase">
          <li>Deploy</li>
          <li className="bg-line-strong size-1 rounded-full" />
          <li>Monitor</li>
          <li className="bg-line-strong size-1 rounded-full" />
          <li>Ship</li>
        </ul>
      </div>
    </section>
  );
}
