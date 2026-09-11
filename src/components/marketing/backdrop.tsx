import { NetworkField } from "@/components/marketing/network-field";
import { cn } from "@/lib/utils";

/**
 * Section backgrounds.
 *
 * The page was a single flat black, which gave the eye nothing to read depth
 * from. Each section now carries a slightly different treatment so scrolling
 * feels like moving through an environment rather than past a wall — while
 * every variant stays far enough back that content never competes with it.
 *
 * Two rules govern everything here:
 *
 *   - Nothing is opaque enough to affect text contrast. Where a treatment
 *     sits behind copy it is masked away from the centre.
 *   - Every backdrop is `aria-hidden` and `pointer-events-none`. It is
 *     atmosphere, and must never be reachable by keyboard or screen reader.
 */

export type BackdropVariant =
  "hero" | "neutral" | "network" | "pipeline" | "data" | "rules" | "cta";

/** Square technical grid, sized per variant. */
function Grid({ size, opacity, mask }: { size: number; opacity: number; mask: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(to right, #ffffff${Math.round(opacity * 255)
          .toString(16)
          .padStart(2, "0")} 1px, transparent 1px), linear-gradient(to bottom, #ffffff${Math.round(
          opacity * 255,
        )
          .toString(16)
          .padStart(2, "0")} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}

/** A pool of ambient light. Drifts slowly so it does not read as a static blob. */
function Ambient({
  className,
  color = "var(--color-brand-500)",
  opacity = 0.08,
  animated = true,
}: {
  className?: string;
  color?: string;
  opacity?: number;
  animated?: boolean;
}) {
  return (
    <div
      className={cn("absolute rounded-full blur-3xl", animated && "animate-ambient", className)}
      style={{
        background: `radial-gradient(50% 50% at 50% 50%, ${color} 0%, transparent 100%)`,
        opacity,
        ["--ambient-opacity" as string]: String(opacity),
      }}
    />
  );
}

export function SectionBackdrop({ variant }: { variant: BackdropVariant }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {variant === "hero" ? (
        <>
          <Grid
            size={64}
            opacity={0.032}
            mask="radial-gradient(ellipse 70% 55% at 50% 32%, black 10%, transparent 72%)"
          />
          <Ambient className="inset-x-0 -top-40 mx-auto h-96 w-[64rem]" opacity={0.1} />
          {/* The network sits low and wide, under the dashboard frame rather
              than behind the headline. */}
          <NetworkField
            className="absolute inset-x-0 bottom-0 h-[28rem] w-full text-white"
            opacity={0.5}
          />
        </>
      ) : null}

      {variant === "neutral" ? (
        <>
          <Grid
            size={72}
            opacity={0.022}
            mask="radial-gradient(ellipse 80% 70% at 50% 50%, black 0%, transparent 78%)"
          />
          {/* Cool rather than warm, so the accent stays reserved for moments
              that mean something. */}
          <Ambient
            className="top-0 left-1/2 h-72 w-[48rem] -translate-x-1/2"
            color="#8d959b"
            opacity={0.05}
            animated={false}
          />
        </>
      ) : null}

      {variant === "network" ? (
        <>
          <Grid
            size={72}
            opacity={0.02}
            mask="radial-gradient(ellipse 75% 70% at 50% 50%, black 0%, transparent 75%)"
          />
          <NetworkField className="absolute inset-0 h-full w-full text-white" opacity={0.42} />
        </>
      ) : null}

      {variant === "pipeline" ? (
        <>
          {/* Directional lines, left to right — the shape of a release moving
              through stages, without drawing a diagram of one. */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg, #ffffff06 0px, #ffffff06 1px, transparent 1px, transparent 96px)",
              maskImage: "radial-gradient(ellipse 80% 65% at 50% 50%, black 0%, transparent 76%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 65% at 50% 50%, black 0%, transparent 76%)",
            }}
          />
          <Ambient className="top-1/3 right-0 h-80 w-[36rem]" opacity={0.06} />
        </>
      ) : null}

      {variant === "data" ? (
        <>
          {/* Tighter than the page grid: a plotting surface rather than a
              structural one. */}
          <Grid
            size={32}
            opacity={0.018}
            mask="radial-gradient(ellipse 70% 65% at 50% 50%, black 0%, transparent 72%)"
          />
          <Ambient className="bottom-0 left-1/4 h-72 w-[40rem]" opacity={0.055} animated={false} />
        </>
      ) : null}

      {variant === "rules" ? (
        /* Horizontal rules only — reads as a stack of layers, which is what
           the section is describing. */
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, #ffffff07 0px, #ffffff07 1px, transparent 1px, transparent 56px)",
            maskImage: "radial-gradient(ellipse 85% 70% at 50% 50%, black 0%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 85% 70% at 50% 50%, black 0%, transparent 80%)",
          }}
        />
      ) : null}

      {variant === "cta" ? (
        <>
          <Grid
            size={64}
            opacity={0.025}
            mask="radial-gradient(ellipse 60% 70% at 50% 50%, black 0%, transparent 70%)"
          />
          {/* The warmest light on the page, at the one moment it is asking for
              something. Still well under a tenth of full strength. */}
          <Ambient className="inset-0 m-auto h-80 w-[44rem]" opacity={0.13} />
        </>
      ) : null}
    </div>
  );
}
