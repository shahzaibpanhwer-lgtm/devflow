import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";
import { getCurrentUser } from "@/lib/current-user";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  // Middleware already blocks anonymous requests; this is the second gate that
  // guarantees `user` is non-null for everything rendered below.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh w-full">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar user={{ name: user.name, email: user.email }} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
