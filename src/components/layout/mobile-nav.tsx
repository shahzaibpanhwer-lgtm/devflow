"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/devflow/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  // Closing on link activation rather than on a pathname effect keeps the
  // drawer in sync without a render-triggering state update.
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <MenuIcon aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-sidebar w-72 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-14 items-center px-6">
          <Logo />
        </div>
        <Separator className="bg-sidebar-border" />
        <nav className="px-6 py-4" aria-label="Main">
          <SidebarNav section="primary" indicatorId="mobile-nav-indicator" onNavigate={close} />
          <Separator className="bg-sidebar-border my-4" />
          <SidebarNav
            section="secondary"
            indicatorId="mobile-nav-indicator-secondary"
            onNavigate={close}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
