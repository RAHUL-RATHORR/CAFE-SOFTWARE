"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";
import { WorkspaceBody } from "./workspace-body";
import { WorkspaceContextArea } from "./workspace-context-area";
import { WorkspaceFooter } from "./workspace-footer";
import { WorkspaceHeader } from "./workspace-header";
import { WorkspaceLayoutStates } from "./workspace-states";
import { WorkspaceToolbar } from "./workspace-toolbar";

type WorkspaceLayoutProps = {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  toolbar?: ReactNode;
  context?: ReactNode;
  footer?: ReactNode;
  showToolbar?: boolean;
  showFooter?: boolean;
  showHeader?: boolean;
  scrollable?: boolean;
};

/**
 * Reusable nested workspace frame: header → toolbar → context → body → footer.
 */
export function WorkspaceLayout({
  children,
  className,
  header,
  toolbar,
  context,
  footer,
  showToolbar = true,
  showFooter = true,
  showHeader = false,
  scrollable = true,
}: WorkspaceLayoutProps) {
  const isFullscreen = useWorkspaceStore((state) => state.isFullscreen);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-background",
        isFullscreen && "fixed inset-0 z-50",
        className
      )}
      data-workspace-layout=""
    >
      {showHeader ? (
        <WorkspaceHeader>{header}</WorkspaceHeader>
      ) : header ? (
        <WorkspaceHeader>{header}</WorkspaceHeader>
      ) : null}

      {showToolbar ? (
        toolbar ?? <WorkspaceToolbar showBreadcrumb={false} />
      ) : null}

      {context ? <WorkspaceContextArea>{context}</WorkspaceContextArea> : null}

      <WorkspaceBody scrollable={scrollable}>
        <WorkspaceLayoutStates>{children}</WorkspaceLayoutStates>
      </WorkspaceBody>

      {showFooter ? (
        footer !== undefined ? (
          <WorkspaceFooter>{footer}</WorkspaceFooter>
        ) : (
          <WorkspaceFooter />
        )
      ) : null}
    </div>
  );
}
