import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout";
import { requireAuth } from "@/lib/auth/session";

export default async function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();
  return <DashboardLayout>{children}</DashboardLayout>;
}
