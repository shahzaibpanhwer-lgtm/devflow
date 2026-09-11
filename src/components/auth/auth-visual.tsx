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
 * The orbital system is a fixed-size stage containing nothing but the rings,
 * the marks and the logo at their centre. Copy sits *below* that stage rather
 * than inside it: an orbit is a circle drawn through the centre of its
 * container, so anything placed there is on the path by definition and will be
 * crossed by every mark that passes.
 *
 * Opacities are tuned against #0b0d0f, not a mid-grey — a white hairline at 5%
 * resolves to about #181a1b on this ground and is effectively invisible.
 *
 * All motion is CSS, and the global prefers-reduced-motion rule in globals.css
 * stops it for anyone who has asked for less movement.
 */

/** Stage size in pixels. Every ring and orbit has to fit inside this. */
const STAGE = 400;

/** Rings, outermost first. The inner pair carries the accent. */
const RINGS = [
  { size: 400, className: "border-foreground/[0.08]", dashed: true, opacity: 0.08 },
  { size: 300, className: "border-foreground/[0.12]", dashed: false, opacity: 0.12 },
  { size: 200, className: "border-brand-500/30", dashed: false, opacity: 0.3 },
  { size: 100, className: "border-brand-500/45", dashed: false, opacity: 0.45 },
];

/**
 * Marks travelling the rings, one ring in from the ring they track so they sit
 * on the line rather than outside it. Durations are unequal and slow, so the
 * arrangement never settles into a pattern the eye can lock on to.
 */
const ORBITERS = [
  { icon: FolderGitIcon, radius: 100, duration: 28, delay: 0, reverse: false, accent: true },
  { icon: RocketIcon, radius: 100, duration: 28, delay: -14, reverse: false, accent: false },
  { icon: TerminalIcon, radius: 150, duration: 36, delay: -5, reverse: true, accent: false },
  {
    icon: ChartNoAxesColumnIcon,
    radius: 150,
    duration: 36,
    delay: -23,
    reverse: true,
    accent: true,
  },
  { icon: UsersIcon, radius: 200, duration: 46, delay: -9, reverse: false, accent: false },
  { icon: KeyRoundIcon, radius: 200, duration: 46, delay: -32, reverse: false, accent: false },
];

export function AuthVisual() {
  return (
    <section
      aria-hidden="true"
      className="border-line bg-surface-0 relative hidden overflow-hidden border-r lg:flex lg:flex-col lg:items-center lg:justify-center"
    >
      {/* Fine grid, faded towards the edges so it reads as texture rather than
          as a drawn table. */}
      <span
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff0a 1px, transparent 1px), linear-gradient(to bottom, #ffffff0a 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 65% 55% at 50% 45%, black 10%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 55% at 50% 45%, black 10%, transparent 70%)",
        }}
      />

      {/* Kept tight and behind the stage. A wide, bright glow washes the rings
          out entirely — the light should sit under the orbit, not flood it. */}
      <span className="bg-brand-500/18 animate-drift absolute top-[38%] left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px]" />

      <div className="relative flex flex-col items-center px-10">
        {/* The orbital stage. Fixed size, and the only thing at its centre is
            the logo — nothing else can be crossed by a passing mark. */}
        <div className="relative shrink-0" style={{ width: `${STAGE}px`, height: `${STAGE}px` }}>
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
                className="animate-orbit absolute top-1/2 left-1/2 flex size-9 items-center justify-center"
                style={{
                  ["--orbit-radius" as string]: String(orbiter.radius),
                  ["--orbit-duration" as string]: String(orbiter.duration),
                  animationDelay: `${orbiter.delay}s`,
                  animationDirection: orbiter.reverse ? "reverse" : "normal",
                  marginTop: "-1.125rem",
                  marginLeft: "-1.125rem",
                }}
              >
                <span
                  className={
                    orbiter.accent
                      ? "border-brand-500/40 bg-brand-500/15 text-brand-500 flex size-9 items-center justify-center rounded-xl border shadow-lg shadow-black/50 backdrop-blur-sm"
                      : "border-line-strong bg-surface-2 text-text-secondary flex size-9 items-center justify-center rounded-xl border shadow-lg shadow-black/50 backdrop-blur-sm"
                  }
                >
                  <Icon className="size-4" />
                </span>
              </span>
            );
          })}

          {/* Dead centre, and the only occupant of the orbit's interior. */}
          <span className="border-line-strong bg-surface-1 absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border shadow-xl shadow-black/60">
            <LogoMark className="size-8" />
          </span>
        </div>

        {/* Below the stage, clear of every orbit. */}
        <div className="mt-12 max-w-sm text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            One command center for your entire workflow
          </h2>
          <p className="text-text-secondary mt-3 text-sm text-pretty">
            Projects, deployments, APIs and team activity — together, in one workspace.
          </p>

          <ul className="text-text-tertiary mt-7 flex items-center justify-center gap-x-4 font-mono text-[11px] tracking-wide uppercase">
            <li>Deploy</li>
            <li className="bg-line-strong size-1 rounded-full" />
            <li>Monitor</li>
            <li className="bg-line-strong size-1 rounded-full" />
            <li>Ship</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
