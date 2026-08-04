"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  PREFERENCES_STORAGE_KEY,
  defaultPreferences,
} from "@/config/preferences";
import type { UserPreferences } from "@/types";

type PreferencesState = UserPreferences & {
  hasHydrated: boolean;
  setPreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  setPreferences: (values: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      hasHydrated: false,
      setPreference: (key, value) => set({ [key]: value } as Partial<PreferencesState>),
      setPreferences: (values) => set({ ...values }),
      resetPreferences: () => set({ ...defaultPreferences }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      partialize: (state) => ({
        language: state.language,
        currency: state.currency,
        timezone: state.timezone,
        dateFormat: state.dateFormat,
        timeFormat: state.timeFormat,
        compactMode: state.compactMode,
        sidebarDefaultCollapsed: state.sidebarDefaultCollapsed,
        animationsEnabled: state.animationsEnabled,
        reducedMotion: state.reducedMotion,
        dashboardDensity: state.dashboardDensity,
        tableDensity: state.tableDensity,
        notificationSound: state.notificationSound,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
