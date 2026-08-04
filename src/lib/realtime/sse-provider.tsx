"use client";

import type { ReactNode } from "react";

/**
 * Server-Sent Events provider placeholder.
 * No live EventSource connection — architecture stub only.
 */
export type SseProviderProps = {
  children: ReactNode;
  /** Reserved for future SSE endpoint */
  url?: string;
  enabled?: boolean;
};

export function SseProvider({ children, enabled = false }: SseProviderProps) {
  if (enabled) {
    // FUTURE: open EventSource here
  }
  return <>{children}</>;
}

export function useSsePlaceholder() {
  return {
    connected: false,
    status: "placeholder" as const,
  };
}
