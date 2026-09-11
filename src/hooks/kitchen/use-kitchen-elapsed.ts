"use client";

import { useEffect, useState } from "react";
import { formatElapsed } from "@/lib/kitchen";

const globalListeners = new Set<() => void>();
let globalInterval: NodeJS.Timeout | null = null;

function subscribeClock(cb: () => void): () => void {
  globalListeners.add(cb);
  if (!globalInterval && typeof window !== "undefined") {
    globalInterval = setInterval(() => {
      globalListeners.forEach((fn) => fn());
    }, 1000);
  }
  return () => {
    globalListeners.delete(cb);
    if (globalListeners.size === 0 && globalInterval) {
      clearInterval(globalInterval);
      globalInterval = null;
    }
  };
}

/**
 * Live elapsed timer for kitchen tickets using a single centralized interval.
 */
export function useKitchenElapsed(createdAt: string): string {
  const [label, setLabel] = useState(() =>
    formatElapsed(Math.max(0, Date.now() - new Date(createdAt).getTime()))
  );

  useEffect(() => {
    const update = () => {
      setLabel(formatElapsed(Math.max(0, Date.now() - new Date(createdAt).getTime())));
    };
    update();
    return subscribeClock(update);
  }, [createdAt]);

  return label;
}
