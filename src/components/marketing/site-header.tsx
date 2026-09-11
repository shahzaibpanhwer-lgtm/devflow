"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

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
  const [scrolled, setScrolled] = useState(false);

  /**
   * The header starts flush with the hero and gains a surface once the page
   * moves, so it separates from content without drawing a line across an
   * otherwise clean first screen.
   *
   * The listener is passive and only ever flips a boolean, so it never blocks
   * scrolling or triggers a render per frame.
   */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-line bg-surface-0/85 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
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
              className="text-text-secondary hover:text-foreground group relative text-sm transition-colors duration-200"
            >
              {link.label}
              <span
                aria-hidden="true"
                className="bg-brand-500 absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
              />
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="hover:shadow-brand-500/25 hidden transition-all duration-200 hover:-translate-y-px hover:shadow-lg sm:inline-flex"
          >
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
