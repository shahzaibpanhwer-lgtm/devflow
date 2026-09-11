import { Stagger, StaggerItem } from "@/components/marketing/motion";

type StackGroup = {
  layer: string;
  items: readonly string[];
};

const STACK: readonly StackGroup[] = [
  {
    layer: "Frontend",
    items: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Framer Motion"],
  },
  { layer: "Backend", items: ["Route Handlers", "REST APIs", "Zod validation"] },
  { layer: "Data", items: ["PostgreSQL", "Prisma ORM"] },
  { layer: "Auth", items: ["Auth.js", "Credentials", "GitHub OAuth"] },
  { layer: "Integrations", items: ["GitHub REST API", "Recharts"] },
  { layer: "Quality", items: ["Vitest", "Playwright", "ESLint", "Prettier"] },
];

export function TechStack() {
  return (
    <Stagger
      stagger={0.06}
      className="border-line bg-line mt-14 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-3"
    >
      {STACK.map((group) => (
        <StaggerItem key={group.layer} className="bg-surface-1 group">
          <div className="hover:bg-surface-2 h-full p-5 transition-colors duration-200">
            <p className="text-text-tertiary group-hover:text-text-secondary font-mono text-[11px] tracking-[0.16em] uppercase transition-colors duration-200">
              {group.layer}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <li
                  key={item}
                  /* Each badge lifts on its own hover, so the row reads as a
                     set of components rather than one block of text. */
                  className="border-line bg-surface-2 text-text-secondary hover:border-brand-500/30 hover:text-foreground rounded border px-2 py-1 font-mono text-xs transition-all duration-200 hover:-translate-y-px"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
