"use client";

import { create } from "zustand";
import type { DrawerSide } from "@/types";

type DrawerState = {
  activeDrawerId: string | null;
  side: DrawerSide;
  payload: Record<string, unknown> | null;
  openDrawer: (
    id: string,
    options?: { side?: DrawerSide; payload?: Record<string, unknown> }
  ) => void;
  closeDrawer: () => void;
};

export const useDrawerStore = create<DrawerState>((set) => ({
  activeDrawerId: null,
  side: "right",
  payload: null,
  openDrawer: (id, options) =>
    set({
      activeDrawerId: id,
      side: options?.side ?? "right",
      payload: options?.payload ?? null,
    }),
  closeDrawer: () =>
    set({ activeDrawerId: null, payload: null, side: "right" }),
}));
