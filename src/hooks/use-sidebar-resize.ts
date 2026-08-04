"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "@/constants/workspace";
import { useUiStore } from "@/store/ui-store";

/**
 * Pointer-driven resize for the desktop sidebar.
 * Only active while the sidebar is expanded.
 */
export function useSidebarResize() {
  const setSidebarWidth = useUiStore((state) => state.setSidebarWidth);
  const setSidebarResizing = useUiStore((state) => state.setSidebarResizing);
  const sidebarMode = useUiStore((state) => state.sidebarMode);
  const isResizing = useUiStore((state) => state.isSidebarResizing);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const delta = event.clientX - startX.current;
      const next = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, startWidth.current + delta)
      );
      setSidebarWidth(next);
    },
    [setSidebarWidth]
  );

  const stopResizing = useCallback(() => {
    setSidebarResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [setSidebarResizing]);

  useEffect(() => {
    if (!isResizing) return;

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [isResizing, onPointerMove, stopResizing]);

  const beginResize = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (sidebarMode !== "expanded") return;
      event.preventDefault();
      startX.current = event.clientX;
      startWidth.current = useUiStore.getState().sidebarExpandedWidth;
      setSidebarResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [setSidebarResizing, sidebarMode]
  );

  return {
    beginResize,
    isResizing,
    canResize: sidebarMode === "expanded",
  };
}
