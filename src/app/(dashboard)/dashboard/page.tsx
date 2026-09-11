import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export default async function DashboardPage() {
  const session = await auth();

  if (session?.user?.role === "super-admin") {
    redirect("/admin/restaurants");
  }

  return <DashboardView />;
}
