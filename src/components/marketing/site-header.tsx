"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/devflow/logo";
import { Button } from "@/components/ui/button";

const SECTION_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Integrations", href: "#github" },
  { label: "Analytics", href: "#analytics" },
  { label: "Stack", href: "#stack" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-line bg-surface-0/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Sections">
          {SECTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-text-secondary hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/register">Start Building</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <XIcon aria-hidden="true" /> : <MenuIcon aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-line bg-surface-1 border-t md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-6 py-2" aria-label="Sections">
            {SECTION_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-text-secondary hover:text-foreground py-2.5 text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Button asChild size="sm" className="my-3">
              <Link href="/register">Start Building</Link>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
