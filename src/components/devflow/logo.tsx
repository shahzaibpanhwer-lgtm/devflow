import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
};

/**
 * The DevFlow mark: three offset bars forming a forward-leaning flow, with the
 * leading bar carrying the accent. Drawn inline so it inherits currentColor and
 * needs no network request.
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="4" width="7" height="16" rx="2" className="fill-brand-500" />
      <rect x="10.5" y="4" width="5" height="16" rx="2" className="fill-current opacity-45" />
      <rect x="17" y="4" width="5" height="16" rx="2" className="fill-current opacity-20" />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  /** Hides the wordmark, e.g. in a collapsed sidebar. */
  markOnly?: boolean;
};

export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={cn("text-foreground inline-flex items-center gap-2", className)}>
      <LogoMark />
      {markOnly ? null : <span className="text-[15px] font-semibold tracking-tight">DevFlow</span>}
    </span>
  );
}
