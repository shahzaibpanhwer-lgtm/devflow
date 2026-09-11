import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/devflow/page-header";
import { Playground } from "@/components/playground/playground";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "API Playground",
};

export default async function ApiPlaygroundPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader
        title="API Playground"
        description="Send real requests to DevFlow's API as your signed-in account, and read the response exactly as a client would."
      />
      <Playground />
    </div>
  );
}
