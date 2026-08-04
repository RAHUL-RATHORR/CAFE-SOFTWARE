"use client";

import { cn } from "@/lib/utils";
import { useSidebarResize } from "@/hooks/use-sidebar-resize";
import { SIDEBAR_RESIZE_HANDLE_WIDTH } from "@/constants/workspace";
import { useUiStore } from "@/store/ui-store";

type SidebarResizeHandleProps = {
  className?: string;
};

export function SidebarResizeHandle({ className }: SidebarResizeHandleProps) {
  const { beginResize, canResize, isResizing } = useSidebarResize();
  const setSidebarWidth = useUiStore((state) => state.setSidebarWidth);
  const sidebarExpandedWidth = useUiStore((state) => state.sidebarExpandedWidth);

  if (!canResize) return null;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuemin={200}
      aria-valuemax={400}
      aria-valuenow={sidebarExpandedWidth}
      tabIndex={0}
      onPointerDown={beginResize}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const step = event.shiftKey ? 24 : 8;
        const delta = event.key === "ArrowRight" ? step : -step;
        setSidebarWidth(sidebarExpandedWidth + delta);
      }}
      className={cn(
        "absolute top-0 right-0 z-20 hidden h-full cursor-col-resize touch-none md:block",
        "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-transparent hover:after:bg-primary/40",
        isResizing && "after:bg-primary",
        className
      )}
      style={{ width: SIDEBAR_RESIZE_HANDLE_WIDTH }}
    />
  );
}
