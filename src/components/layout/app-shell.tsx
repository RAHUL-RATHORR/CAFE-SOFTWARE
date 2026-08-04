"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import {
  WorkspaceLayout,
  WorkspaceTabSync,
  WorkspaceTabs,
} from "@/components/workspace";
import { useUiStore } from "@/store/ui-store";
import { useShallow } from "@/store/selectors";
import { siteConfig } from "@/config/site";
import { SIDEBAR_DEFAULT_WIDTH } from "@/constants/workspace";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { isMobileSidebarOpen, setMobileSidebarOpen, closeMobileSidebar } =
    useUiStore(
      useShallow((state) => ({
        isMobileSidebarOpen: state.isMobileSidebarOpen,
        setMobileSidebarOpen: state.setMobileSidebarOpen,
        closeMobileSidebar: state.closeMobileSidebar,
      }))
    );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar variant="desktop" />

      <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="p-0 duration-300 ease-in-out"
          style={{ width: SIDEBAR_DEFAULT_WIDTH }}
          showCloseButton
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{siteConfig.name} navigation</SheetTitle>
          </SheetHeader>
          <Sidebar variant="mobile" onNavigate={closeMobileSidebar} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <WorkspaceTabSync />
        <WorkspaceTabs />
        <main className="flex min-h-0 flex-1 flex-col">
          <WorkspaceLayout>{children}</WorkspaceLayout>
        </main>
      </div>
    </div>
  );
}
