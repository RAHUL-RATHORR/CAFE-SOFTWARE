"use client";

import { useEffect, useState } from "react";
import { formatElapsed } from "@/lib/kitchen";

/** Live elapsed timer for kitchen tickets (client-only). */
export function useKitchenElapsed(createdAt: string): string {
  const [label, setLabel] = useState(() =>
    formatElapsed(Math.max(0, Date.now() - new Date(createdAt).getTime()))
  );

  useEffect(() => {
    const tick = () => {
      setLabel(
        formatElapsed(Math.max(0, Date.now() - new Date(createdAt).getTime()))
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [createdAt]);

  return label;
}
