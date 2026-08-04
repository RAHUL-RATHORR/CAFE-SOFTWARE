"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_LAYOUT_STORAGE_KEY,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MINI_WIDTH,
} from "@/constants/workspace";
import type { SidebarMode } from "@/types/workspace";

function clampWidth(width: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
}

function widthForMode(mode: SidebarMode, expandedWidth: number) {
  if (mode === "mini") return SIDEBAR_MINI_WIDTH;
  if (mode === "collapsed") return SIDEBAR_COLLAPSED_WIDTH;
  return expandedWidth;
}

type UiState = {
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  sidebarWidth: number;
  sidebarExpandedWidth: number;
  sidebarMode: SidebarMode;
  isSidebarResizing: boolean;
  hasSidebarHydrated: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarMode: (mode: SidebarMode) => void;
  setSidebarResizing: (value: boolean) => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setHasSidebarHydrated: (value: boolean) => void;
  getSidebarDisplayWidth: () => number;
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      isSidebarCollapsed: false,
      isMobileSidebarOpen: false,
      sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
      sidebarExpandedWidth: SIDEBAR_DEFAULT_WIDTH,
      sidebarMode: "expanded",
      isSidebarResizing: false,
      hasSidebarHydrated: false,

      toggleSidebar: () => {
        const nextCollapsed = !get().isSidebarCollapsed;
        const mode: SidebarMode = nextCollapsed ? "collapsed" : "expanded";
        set({
          isSidebarCollapsed: nextCollapsed,
          sidebarMode: mode,
          sidebarWidth: widthForMode(mode, get().sidebarExpandedWidth),
        });
      },

      setSidebarCollapsed: (collapsed) => {
        const mode: SidebarMode = collapsed ? "collapsed" : "expanded";
        set({
          isSidebarCollapsed: collapsed,
          sidebarMode: mode,
          sidebarWidth: widthForMode(mode, get().sidebarExpandedWidth),
        });
      },

      setSidebarWidth: (width) => {
        const next = clampWidth(width);
        set({
          sidebarExpandedWidth: next,
          sidebarWidth: next,
          sidebarMode: "expanded",
          isSidebarCollapsed: false,
        });
      },

      setSidebarMode: (mode) => {
        set({
          sidebarMode: mode,
          isSidebarCollapsed: mode !== "expanded",
          sidebarWidth: widthForMode(mode, get().sidebarExpandedWidth),
        });
      },

      setSidebarResizing: (isSidebarResizing) => set({ isSidebarResizing }),

      openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
      closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
      setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),

      setHasSidebarHydrated: (value) => set({ hasSidebarHydrated: value }),

      getSidebarDisplayWidth: () => {
        const { sidebarMode, sidebarExpandedWidth } = get();
        return widthForMode(sidebarMode, sidebarExpandedWidth);
      },
    }),
    {
      name: SIDEBAR_LAYOUT_STORAGE_KEY,
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        sidebarExpandedWidth: state.sidebarExpandedWidth,
        sidebarMode: state.sidebarMode,
        sidebarWidth: widthForMode(
          state.sidebarMode,
          state.sidebarExpandedWidth
        ),
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) {
          useUiStore.setState({ hasSidebarHydrated: true });
          return;
        }
        const mode =
          state.sidebarMode ??
          (state.isSidebarCollapsed ? "collapsed" : "expanded");
        const expanded = clampWidth(
          state.sidebarExpandedWidth ||
            state.sidebarWidth ||
            SIDEBAR_DEFAULT_WIDTH
        );
        state.sidebarExpandedWidth = expanded;
        state.sidebarMode = mode;
        state.isSidebarCollapsed = mode !== "expanded";
        state.sidebarWidth = widthForMode(mode, expanded);
        state.setHasSidebarHydrated(true);
      },
    }
  )
);
