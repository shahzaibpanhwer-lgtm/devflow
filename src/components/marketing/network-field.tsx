"use client";

import { useReducedMotion } from "framer-motion";

/**
 * The network motif behind the page.
 *
 * A pipeline drawn as a graph: source feeds build, build feeds test, test
 * feeds deploy, deploy reaches production, with a couple of branches rejoining
 * the trunk. It never labels any of that — the point is an impression of a
 * connected development system, not a diagram someone has to read.
 *
 * Every coordinate is fixed rather than generated, so the server and the
 * client render the same graph and there is no hydration mismatch. Opacity is
 * kept low enough that the atmosphere registers before the movement does.
 */

/** Percentage coordinates, so the graph scales with whatever box holds it. */
type Node = { x: number; y: number; accent?: boolean };

const NODES: Node[] = [
  { x: 8, y: 62 }, // source
  { x: 22, y: 38 },
  { x: 24, y: 78 },
  { x: 38, y: 55, accent: true }, // build
  { x: 52, y: 30 },
  { x: 54, y: 72 },
  { x: 68, y: 48, accent: true }, // deploy
  { x: 82, y: 26 },
  { x: 84, y: 68 },
  { x: 94, y: 45, accent: true }, // production
];

/** Index pairs. The trunk runs left to right; branches leave and rejoin. */
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [3, 5],
  [4, 6],
  [5, 6],
  [6, 7],
  [6, 8],
  [7, 9],
  [8, 9],
];

/** Only a few carry a travelling point; every edge lit at once reads as noise. */
const ACTIVE_EDGES = [2, 4, 6, 10];

export function NetworkField({
  className,
  opacity = 1,
}: {
  className?: string;
  /** Scales the whole field, so each section can sit it further back. */
  opacity?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ opacity }}
    >
      {EDGES.map(([from, to], index) => {
        const a = NODES[from];
        const b = NODES[to];
        if (!a || !b) return null;

        return (
          <line
            key={`edge-${index}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="currentColor"
            strokeWidth={0.12}
            className="text-foreground/25"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      {/* Points in transit. Each supplies its own delta, so one keyframe in
          globals.css drives every connection. */}
      {!reduced &&
        ACTIVE_EDGES.map((edgeIndex, order) => {
          const edge = EDGES[edgeIndex];
          if (!edge) return null;
          const a = NODES[edge[0]];
          const b = NODES[edge[1]];
          if (!a || !b) return null;

          return (
            <circle
              key={`travel-${edgeIndex}`}
              cx={a.x}
              cy={a.y}
              r={0.55}
              className="fill-brand-500 animate-travel"
              style={{
                ["--dx" as string]: `${b.x - a.x}px`,
                ["--dy" as string]: `${b.y - a.y}px`,
                ["--travel-duration" as string]: `${11 + order * 3}s`,
                animationDelay: `${order * 2.6}s`,
              }}
            />
          );
        })}

      {NODES.map((node, index) => (
        <circle
          key={`node-${index}`}
          cx={node.x}
          cy={node.y}
          r={node.accent ? 0.85 : 0.55}
          /*
            Only the accent nodes pulse. Animating all ten read as a field of
            activity competing with the page; three points of interest is the
            atmosphere that was wanted.
          */
          className={
            node.accent && !reduced
              ? "fill-brand-500 animate-node-pulse"
              : node.accent
                ? "fill-brand-500"
                : "fill-foreground/40"
          }
          style={{
            ["--node-opacity" as string]: node.accent ? "0.35" : "0.22",
            opacity: node.accent ? undefined : 0.22,
            animationDelay: `${index * 0.9}s`,
          }}
        />
      ))}
    </svg>
  );
}
