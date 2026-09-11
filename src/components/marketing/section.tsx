import type { ReactNode } from "react";

import { SectionBackdrop, type BackdropVariant } from "@/components/marketing/backdrop";
import { Reveal } from "@/components/marketing/motion";
import { cn } from "@/lib/utils";

export function Section({
  id,
  children,
  className,
  backdrop,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Background treatment. Omitted, the section sits on the page surface. */
  backdrop?: BackdropVariant;
}) {
  return (
    <section id={id} className={cn("border-line relative border-t py-24 sm:py-32", className)}>
      {backdrop ? <SectionBackdrop variant={backdrop} /> : null}
      {/* Content is positioned so it always stacks above the backdrop. */}
      <div className="relative mx-auto w-full max-w-6xl px-6">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "start";
}) {
  return (
    <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="text-brand-500 font-mono text-xs font-medium tracking-[0.18em] uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-text-secondary mt-4 text-base leading-relaxed text-pretty sm:text-lg">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
