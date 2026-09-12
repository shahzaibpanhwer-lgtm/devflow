"use client";

import { useSyncExternalStore, type ReactNode } from "react";

/** Nothing to subscribe to — the answer never changes after hydration. */
const subscribe = () => () => {};

/**
 * True on the client, false while rendering on the server.
 *
 * useSyncExternalStore rather than a mount flag set in an effect: React is
 * built to give this hook a different value per environment, so there is no
 * state update on mount and no lint rule to argue with.
 */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/**
 * Defers a chart until it has a real element to measure.
 *
 * Recharts sizes itself from its container, which it cannot do while
 * rendering on the server. In production that surfaced as an intermittent
 * React error on every page carrying a chart — the analytics page failed on
 * almost every navigation — and the route's error boundary replaced the whole
 * page with "Could not load".
 *
 * Rendering the chart only on the client removes the cause rather than
 * catching the symptom. Nothing is lost: a chart has no meaning without
 * measured dimensions, and the figures it draws are already served in the
 * accompanying table, which does render on the server and is what assistive
 * technology reads.
 *
 * The placeholder reserves the exact height, so nothing shifts when the chart
 * arrives.
 */
export function ChartMount({ height, children }: { height: string; children: ReactNode }) {
  const isClient = useIsClient();

  if (!isClient) {
    return <div className={height} aria-hidden="true" />;
  }

  return <div className={height}>{children}</div>;
}
