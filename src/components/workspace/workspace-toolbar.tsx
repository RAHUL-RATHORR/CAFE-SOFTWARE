"use client";

import type { ReactNode } from "react";
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace-store";

type WorkspaceToolbarProps = {
  className?: string;
  sticky?: boolean;
  showBreadcrumb?: boolean;
  actions?: ReactNode;
  onRefresh?: () => void;
  onSettings?: () => void;
};

export function WorkspaceToolbar({
  className,
  sticky,
  showBreadcrumb = true,
  actions,
  onRefresh,
  onSettings,
}: WorkspaceToolbarProps) {
  const stickyToolbar = useWorkspaceStore((state) => state.stickyToolbar);
  const isFullscreen = useWorkspaceStore((state) => state.isFullscreen);
  const toggleFullscreen = useWorkspaceStore((state) => state.toggleFullscreen);
  const isSticky = sticky ?? stickyToolbar;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-3 py-2 md:px-4",
        isSticky && "sticky top-0 z-10",
        className
      )}
      data-workspace-slot="toolbar"
      role="toolbar"
      aria-label="Workspace toolbar"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 text-muted-foreground sm:inline-flex"
          aria-label="Search workspace (placeholder)"
          disabled
        >
          <Search className="size-3.5" aria-hidden />
          <span className="text-xs">Search workspace</span>
        </Button>

        {showBreadcrumb ? (
          <div className="hidden min-w-0 flex-1 lg:block">
            <BreadcrumbNav />
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {actions}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Refresh workspace (placeholder)"
          onClick={onRefresh}
          disabled={!onRefresh}
        >
          <RefreshCw className="size-3.5" aria-hidden />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2 className="size-3.5" aria-hidden />
          ) : (
            <Maximize2 className="size-3.5" aria-hidden />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Workspace settings (placeholder)"
          onClick={onSettings}
          disabled={!onSettings}
        >
          <Settings className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
