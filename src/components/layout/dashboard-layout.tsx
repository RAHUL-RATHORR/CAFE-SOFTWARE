import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

type DashboardLayoutProps = {
  children: ReactNode;
};

/**
 * Dashboard shell wrapper: Sidebar + Navbar + Main content.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
