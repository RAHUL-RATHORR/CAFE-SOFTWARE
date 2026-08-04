"use client";

import { useShallow } from "zustand/react/shallow";

/**
 * Zustand selector helpers — prefer shallow multi-field picks to cut re-renders.
 */
export { useShallow };

export function pick<T extends object, K extends keyof T>(...keys: K[]) {
  return (state: T): Pick<T, K> => {
    const next = {} as Pick<T, K>;
    for (const key of keys) {
      next[key] = state[key];
    }
    return next;
  };
}
