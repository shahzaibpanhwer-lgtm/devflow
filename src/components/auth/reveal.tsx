"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Staged entrance for the sign-in screen.
 *
 * Children rise in sequence rather than all at once, which is what makes the
 * screen feel considered rather than merely animated. Deliberately subtle: a
 * short travel and a quick curve, so it reads as the page settling rather than
 * as an effect being performed.
 *
 * With reduced motion requested the content renders immediately, in place —
 * not a faster version of the same movement.
 */
export function Reveal({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  /** Position in the sequence; each step delays by 60ms. */
  index?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      {children}
    </motion.div>
  );
}
