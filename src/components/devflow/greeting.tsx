"use client";

import { useSyncExternalStore } from "react";

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** No external store to watch — the clock is read once per render pass. */
const subscribe = () => () => {};

/**
 * The greeting depends on the visitor's own clock, which the server cannot
 * know. `useSyncExternalStore` renders a neutral server snapshot and swaps to
 * the local value on hydration, avoiding both a mismatch and a state update
 * inside an effect.
 */
export function Greeting({ name }: { name?: string }) {
  const greeting = useSyncExternalStore(
    subscribe,
    () => greetingFor(new Date().getHours()),
    () => "Welcome back",
  );

  return (
    <>
      {greeting}
      {name ? `, ${name.split(" ")[0]}` : ""} <span aria-hidden="true">👋</span>
    </>
  );
}
