import { FadeIn } from "@/components/devflow/fade-in";

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
    <div className="border-line bg-line mt-14 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-3">
      {STACK.map((group, index) => (
        <FadeIn key={group.layer} delay={index * 0.05} className="bg-surface-1">
          <div className="h-full p-5">
            <p className="text-text-tertiary font-mono text-[11px] tracking-[0.16em] uppercase">
              {group.layer}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="border-line bg-surface-2 text-text-secondary rounded border px-2 py-1 font-mono text-xs"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}
