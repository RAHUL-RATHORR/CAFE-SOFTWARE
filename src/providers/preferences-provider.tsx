"use client";

import { useEffect, type ReactNode } from "react";
import { usePreferencesStore } from "@/store/preferences-store";

type PreferencesProviderProps = {
  children: ReactNode;
};

function applyPreferencesToDocument(options: {
  compactMode: boolean;
  reducedMotion: boolean;
  animationsEnabled: boolean;
  dashboardDensity: string;
  tableDensity: string;
}) {
  const root = document.documentElement;
  root.dataset.compact = options.compactMode ? "true" : "false";
  root.dataset.dashboardDensity = options.dashboardDensity;
  root.dataset.tableDensity = options.tableDensity;
  root.dataset.animations = options.animationsEnabled ? "true" : "false";

  const reduce =
    options.reducedMotion ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !options.animationsEnabled;

  root.dataset.reducedMotion = reduce ? "true" : "false";
}

/**
 * Applies persisted UI preferences to the document.
 * Sidebar collapse/width memory lives in ui-store persist.
 */
export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const compactMode = usePreferencesStore((state) => state.compactMode);
  const reducedMotion = usePreferencesStore((state) => state.reducedMotion);
  const animationsEnabled = usePreferencesStore(
    (state) => state.animationsEnabled
  );
  const dashboardDensity = usePreferencesStore(
    (state) => state.dashboardDensity
  );
  const tableDensity = usePreferencesStore((state) => state.tableDensity);
  useEffect(() => {
    applyPreferencesToDocument({
      compactMode,
      reducedMotion,
      animationsEnabled,
      dashboardDensity,
      tableDensity,
    });
  }, [
    compactMode,
    reducedMotion,
    animationsEnabled,
    dashboardDensity,
    tableDensity,
  ]);

  // Sidebar collapse/width are remembered via ui-store persist.
  // Settings toggles apply collapse through PreferencesView directly.

  return children;
}
