"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, PanelLeft, Utensils } from "lucide-react";
import {
  DASHBOARD_HREF,
  isNavItemActive,
  mainNavigation,
} from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { useUiStore } from "@/store/ui-store";
import { useShallow } from "@/store/selectors";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarResizeHandle } from "@/components/workspace/sidebar-resize-handle";

type SidebarProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function Sidebar({ variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const {
    isSidebarCollapsed,
    toggleSidebar,
    sidebarMode,
    sidebarWidth,
    setSidebarMode,
    isSidebarResizing,
  } = useUiStore(
    useShallow((state) => ({
      isSidebarCollapsed: state.isSidebarCollapsed,
      toggleSidebar: state.toggleSidebar,
      sidebarMode: state.sidebarMode,
      sidebarWidth: state.sidebarWidth,
      setSidebarMode: state.setSidebarMode,
      isSidebarResizing: state.isSidebarResizing,
    }))
  );
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

  const collapsed =
    variant === "desktop" &&
    (isSidebarCollapsed || sidebarMode === "collapsed" || sidebarMode === "mini");
  const isMini = variant === "desktop" && sidebarMode === "mini";

  // Tablet adaptive: prefer collapsed chrome without wiping remembered expanded width
  useEffect(() => {
    if (variant !== "desktop" || !isTablet) return;
    if (sidebarMode === "expanded") {
      setSidebarMode("collapsed");
    }
  }, [isTablet, variant]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional one-way tablet adapt

  const displayWidth =
    variant === "desktop"
      ? isMini
        ? 64
        : collapsed
          ? 80
          : sidebarWidth
      : undefined;

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        variant === "desktop" &&
          "sticky top-0 hidden h-screen md:flex",
        variant === "desktop" &&
          !isSidebarResizing &&
          "transition-[width] duration-300 ease-in-out",
        variant === "mobile" && "h-full w-full"
      )}
      style={
        variant === "desktop" && displayWidth
          ? { width: displayWidth }
          : undefined
      }
      data-sidebar-mode={variant === "desktop" ? sidebarMode : "mobile"}
      aria-label="Application sidebar"
    >
      <div
        className={cn(
          "flex h-16 items-center gap-3 px-4 mt-4",
          collapsed && "justify-center px-2"
        )}
      >
        <Link
          href={DASHBOARD_HREF}
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Utensils className="size-4" aria-hidden />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                {siteConfig.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Restaurant Suite
              </p>
            </div>
          ) : null}
        </Link>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {mainNavigation.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            const Icon = item.icon;

            const className = cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed && "justify-center px-2",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            );

            const content = (
              <>
                {isActive ? (
                  <motion.span
                    layoutId={
                      variant === "desktop" ? "sidebar-active" : undefined
                    }
                    className="absolute inset-y-1 left-0 w-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
                <Icon className="size-4 shrink-0" aria-hidden />
                {!collapsed ? <span className="truncate">{item.title}</span> : null}
                {collapsed ? <span className="sr-only">{item.title}</span> : null}
              </>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger
                    render={
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={className}
                      />
                    }
                  >
                    {content}
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {variant === "desktop" ? (
        <div className="space-y-2 border-t border-sidebar-border p-3">
          {!collapsed ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => setSidebarMode("mini")}
              aria-label="Switch to mini sidebar"
            >
              <PanelLeft className="size-4" />
              Mini sidebar
            </Button>
          ) : isMini ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-full"
              onClick={() => setSidebarMode("expanded")}
              aria-label="Expand sidebar from mini"
            >
              <ChevronsRight className="size-4" />
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className={cn("w-full", !collapsed && "justify-start gap-2")}
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <>
                <ChevronsLeft className="size-4" />
                Collapse
              </>
            )}
          </Button>
        </div>
      ) : null}

      {variant === "desktop" ? <SidebarResizeHandle /> : null}
    </aside>
  );
}
