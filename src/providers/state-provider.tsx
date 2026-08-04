"use client";

import type { ReactNode } from "react";

type StateProviderProps = {
  children: ReactNode;
};

/**
 * Global client state boundary.
 * Zustand stores are imported where needed; this wrapper reserves
 * a composition point for future hydration or cross-store setup.
 */
export function StateProvider({ children }: StateProviderProps) {
  return children;
}
