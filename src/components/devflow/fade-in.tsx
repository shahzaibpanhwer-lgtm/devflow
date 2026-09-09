"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  /** Stagger helper — seconds to wait before animating. */
  delay?: number;
  /** Vertical travel in pixels. */
  y?: number;
  className?: string;
};

/**
 * Reveals content once it scrolls into view. When the visitor has asked for
 * reduced motion the element renders immediately with no transform at all.
 */
export function FadeIn({ children, delay = 0, y = 12, className }: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.45, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
