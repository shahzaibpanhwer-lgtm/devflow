import type { ReactNode } from "react";

import { FadeIn } from "@/components/devflow/fade-in";
import { cn } from "@/lib/utils";

export function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("border-line border-t py-20 sm:py-28", className)}>
      <div className="mx-auto w-full max-w-6xl px-6">{children}</div>
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
    <FadeIn className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="text-brand-500 font-mono text-xs font-medium tracking-[0.18em] uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {description ? (
        <p className="text-text-secondary mt-4 text-base text-pretty sm:text-lg">{description}</p>
      ) : null}
    </FadeIn>
  );
}
