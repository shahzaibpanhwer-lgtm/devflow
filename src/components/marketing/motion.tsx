"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type UseInViewOptions,
  type Variants,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The homepage's animation language, in one place.
 *
 * Every reveal on the page comes from here, so timing and easing stay
 * consistent instead of each section inventing its own. Three rules hold
 * throughout:
 *
 *   - Reveals fire once. `once: true` everywhere, so scrolling back up does
 *     not replay the page.
 *   - Only transform and opacity are animated. Both are composited, so none
 *     of this triggers layout.
 *   - A reduced-motion preference removes the movement rather than shortening
 *     it — the content renders in its final position immediately.
 */

/** Ease-out. Content should arrive decisively and settle, never bounce. */
const EASE = [0.21, 0.47, 0.32, 0.98] as const;

/** Fires a little before the element is fully on screen, so it is already
 *  settling as it arrives rather than starting once the reader is looking. */
const VIEWPORT: UseInViewOptions = { once: true, margin: "-80px" };

export const DURATION = {
  micro: 0.18,
  hover: 0.24,
  section: 0.6,
  product: 0.8,
  story: 1.4,
} as const;

/**
 * Text and general content: opacity with a short rise.
 */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.section, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Product visuals: the same rise with a slight scale, which reads as the
 * interface coming forward rather than merely appearing.
 */
export function RevealVisual({
  children,
  delay = 0.08,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.product, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const STAGGER_CONTAINER: Variants = {
  hidden: {},
  visible: (stagger: number) => ({ transition: { staggerChildren: stagger } }),
};

const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/**
 * Reveals children in sequence. Used where a group of elements is read as a
 * list — stat tiles, log lines, activity rows — so the eye is led through
 * them rather than hit with all of them at once.
 */
export function Stagger({
  children,
  stagger = 0.06,
  delay = 0,
  className,
}: {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={STAGGER_CONTAINER}
      custom={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      transition={{ delayChildren: delay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={STAGGER_ITEM}>
      {children}
    </motion.div>
  );
}

/**
 * True once the element has been seen, and true forever after.
 *
 * The building block for the sequenced product animations — a section can ask
 * "have I been reached yet?" and start its own timeline, without re-running
 * when the reader scrolls back past it.
 */
export function useHasBeenSeen<T extends Element = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref, VIEWPORT);
  return { ref, seen: inView };
}

/**
 * Counts up to a value when the element is first seen.
 *
 * Eased rather than linear, so the number decelerates into place instead of
 * stopping dead — and rendered with tabular figures so the width does not
 * jitter as digits change.
 */
export function CountUp({
  to,
  duration = 1.6,
  format = (value: number) => value.toLocaleString(),
  className,
}: {
  to: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { ref, seen } = useHasBeenSeen<HTMLSpanElement>();
  const [value, setValue] = useState(reduced ? to : 0);

  useEffect(() => {
    if (reduced || !seen) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease-out: fast at first, settling at the end.
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(to * eased));

      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, to, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}

/**
 * Grows a bar from zero to its height when first seen.
 *
 * Animates scaleY from a bottom origin rather than the height property, so
 * the browser composites it instead of reflowing the row on every frame.
 */
export function GrowBar({
  heightPercent,
  index = 0,
  className,
}: {
  heightPercent: number;
  index?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <span className={className} style={{ height: `${heightPercent}%` }} />;
  }

  return (
    <motion.span
      className={className}
      style={{ height: `${heightPercent}%`, transformOrigin: "bottom" }}
      initial={{ scaleY: 0, opacity: 0 }}
      whileInView={{ scaleY: 1, opacity: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.5, delay: index * 0.03, ease: EASE }}
    />
  );
}
