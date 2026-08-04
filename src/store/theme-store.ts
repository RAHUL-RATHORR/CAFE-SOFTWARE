"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { THEME_STORAGE_KEY } from "@/config/preferences";
import type { ResolvedTheme, ThemeMode } from "@/types/common";

type ThemeState = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  hasHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  setResolved: (resolved: ResolvedTheme) => void;
  setHasHydrated: (value: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      resolved: "light",
      hasHydrated: false,
      setMode: (mode) => set({ mode }),
      setResolved: (resolved) => set({ resolved }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
