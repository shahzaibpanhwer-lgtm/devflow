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
 * Concentric rings with DevFlow's own product marks orbiting them, in the
 * accent on the application's own surface — rather than third-party
 * technology logos, which would say nothing about this product and would pull
 * images from someone else's CDN on the one page a visitor sees first.
 *
 * Everything here is CSS animation. The global prefers-reduced-motion rule in
 * globals.css stops all of it for anyone who has asked for less movement, and
 * the layout is identical when it does.
 */

/** Rings, outermost first. Radius in pixels, matched to the orbit radii. */
const RINGS = [
  { size: 460, opacity: 0.05, dashed: true },
  { size: 340, opacity: 0.08, dashed: false },
  { size: 220, opacity: 0.12, dashed: false },
  { size: 120, opacity: 0.16, dashed: false },
];

/**
 * Marks travelling the rings. Durations are deliberately unequal and slow, so
 * the arrangement never settles into a repeating pattern the eye can lock on.
 */
const ORBITERS = [
  { icon: FolderGitIcon, radius: 110, duration: 28, delay: 0, reverse: false },
  { icon: RocketIcon, radius: 110, duration: 28, delay: -14, reverse: false },
  { icon: TerminalIcon, radius: 170, duration: 36, delay: -6, reverse: true },
  { icon: ChartNoAxesColumnIcon, radius: 170, duration: 36, delay: -24, reverse: true },
  { icon: UsersIcon, radius: 230, duration: 44, delay: -10, reverse: false },
  { icon: KeyRoundIcon, radius: 230, duration: 44, delay: -32, reverse: false },
];

export function AuthVisual() {
  return (
    <section
      aria-hidden="true"
      className="bg-surface-0 relative hidden overflow-hidden lg:flex lg:items-center lg:justify-center"
    >
      {/* Warm glow behind the rings, kept low so the ground stays near-black. */}
      <span className="bg-brand-500/12 animate-drift absolute top-1/2 left-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />

      {RINGS.map((ring, index) => (
        <span
          key={ring.size}
          className="border-foreground animate-ripple absolute top-1/2 left-1/2 rounded-full border"
          style={{
            width: `${ring.size}px`,
            height: `${ring.size}px`,
            opacity: ring.opacity,
            borderStyle: ring.dashed ? "dashed" : "solid",
            // Staggered so the rings breathe in sequence, not in unison.
            animationDelay: `${index * 0.5}s`,
            ["--ripple-opacity" as string]: String(ring.opacity),
          }}
        />
      ))}

      {ORBITERS.map((orbiter, index) => {
        const Icon = orbiter.icon;
        return (
          <span
            key={index}
            className="animate-orbit absolute top-1/2 left-1/2 flex size-8 items-center justify-center"
            style={{
              ["--orbit-radius" as string]: String(orbiter.radius),
              ["--orbit-duration" as string]: String(orbiter.duration),
              animationDelay: `${orbiter.delay}s`,
              animationDirection: orbiter.reverse ? "reverse" : "normal",
              marginTop: "-1rem",
              marginLeft: "-1rem",
            }}
          >
            <span className="border-line bg-surface-2/80 text-text-secondary flex size-8 items-center justify-center rounded-lg border backdrop-blur-sm">
              <Icon className="size-3.5" />
            </span>
          </span>
        );
      })}

      <div className="relative flex flex-col items-center gap-4 text-center">
        <LogoMark className="size-10" />
        <p className="text-text-secondary max-w-xs text-sm text-pretty">
          Projects, deployments, APIs and team activity — one workspace.
        </p>
      </div>
    </section>
  );
}
