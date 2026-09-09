import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";

import { FadeIn } from "@/components/devflow/fade-in";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  eyebrow: string;
  title: string;
  description: string;
  points: readonly string[];
  visual: ReactNode;
  /** Places the visual on the left so consecutive sections alternate. */
  reverse?: boolean;
};

export function Spotlight({
  eyebrow,
  title,
  description,
  points,
  visual,
  reverse = false,
}: SpotlightProps) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <FadeIn className={cn(reverse && "lg:order-2")}>
        <p className="text-brand-500 font-mono text-xs font-medium tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h3>
        <p className="text-text-secondary mt-4 text-base text-pretty">{description}</p>
        <ul className="mt-6 space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm">
              <CheckIcon className="text-brand-500 mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="text-text-secondary">{point}</span>
            </li>
          ))}
        </ul>
      </FadeIn>

      <FadeIn delay={0.08} className={cn("min-w-0", reverse && "lg:order-1")}>
        {visual}
      </FadeIn>
    </div>
  );
}
