"use client";

import { create } from "zustand";
import type { WorkspaceViewState } from "@/types/workspace";

type WorkspaceState = {
  viewState: WorkspaceViewState;
  isFullscreen: boolean;
  stickyHeader: boolean;
  stickyBreadcrumb: boolean;
  stickyToolbar: boolean;
  setViewState: (state: WorkspaceViewState) => void;
  setFullscreen: (value: boolean) => void;
  toggleFullscreen: () => void;
  setStickyHeader: (value: boolean) => void;
  setStickyBreadcrumb: (value: boolean) => void;
  setStickyToolbar: (value: boolean) => void;
  resetWorkspaceChrome: () => void;
};

const defaultChrome = {
  viewState: "ready" as WorkspaceViewState,
  isFullscreen: false,
  stickyHeader: true,
  stickyBreadcrumb: true,
  stickyToolbar: true,
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  ...defaultChrome,
  setViewState: (viewState) => set({ viewState }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  toggleFullscreen: () =>
    set((state) => ({ isFullscreen: !state.isFullscreen })),
  setStickyHeader: (stickyHeader) => set({ stickyHeader }),
  setStickyBreadcrumb: (stickyBreadcrumb) => set({ stickyBreadcrumb }),
  setStickyToolbar: (stickyToolbar) => set({ stickyToolbar }),
  resetWorkspaceChrome: () => set({ ...defaultChrome }),
}));
