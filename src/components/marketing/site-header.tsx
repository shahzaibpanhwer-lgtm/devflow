"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/devflow/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SECTION_LINKS = [
  { label: "Features", href: "#features", id: "features" },
  { label: "Integrations", href: "#github", id: "github" },
  { label: "Analytics", href: "#analytics", id: "analytics" },
  { label: "Stack", href: "#stack", id: "stack" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  /**
   * The header keeps a faint surface from the start and firms up once the page
   * moves, rather than being fully transparent — a bar that disappears into
   * the hero reads as absent rather than as restraint.
   *
   * The listener is passive and only flips a boolean, so it never blocks
   * scrolling or forces a render per frame.
   */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Marks the section currently in view.
   *
   * An observer rather than a scroll handler, so the browser does the
   * intersection work off the main thread. The band is narrow and near the top
   * of the viewport, so the highlight follows the section being read rather
   * than whichever one happens to be largest on screen.
   */
  useEffect(() => {
    const sections = SECTION_LINKS.map((link) => document.getElementById(link.id)).filter(
      (element): element is HTMLElement => element !== null,
    );

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0 && visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-12% 0px -80% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-line bg-surface-0/90 shadow-lg shadow-black/20 backdrop-blur-xl"
          : "border-line/50 bg-surface-0/40 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-8 px-6">
        <Link
          href="/"
          className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Logo />
        </Link>

        {/*
          The links sit in their own bordered group rather than floating as
          loose text. It gives the navigation an edge to read against on a
          near-black page, and keeps the cluster from dissolving into the
          space between the logo and the buttons.
        */}
        <nav
          className="border-line bg-surface-1/60 hidden items-center gap-1 rounded-full border p-1 md:flex"
          aria-label="Sections"
        >
          {SECTION_LINKS.map((link) => {
            const active = activeId === link.id;

            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-brand-500/12 text-brand-500"
                    : "text-text-secondary hover:bg-surface-3 hover:text-foreground",
                )}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hover:text-foreground hidden font-medium sm:inline-flex"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="hover:shadow-brand-500/30 hidden font-medium transition-all duration-200 hover:-translate-y-px hover:shadow-lg sm:inline-flex"
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
            {SECTION_LINKS.map((link) => {
              const active = activeId === link.id;

              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-500/12 text-brand-500"
                      : "text-text-secondary hover:text-foreground",
                  )}
                >
                  {link.label}
                </a>
              );
            })}
            <div className="border-line mt-2 flex flex-col gap-2 border-t py-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Start Building</Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
