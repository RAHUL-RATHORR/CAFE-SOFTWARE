"use client";

import type { ReactNode } from "react";

/**
 * WebSocket provider placeholder.
 * No Socket.io / Pusher / Ably / Firebase — architecture stub only.
 */
export type WebSocketProviderProps = {
  children: ReactNode;
  /** Reserved for future endpoint */
  url?: string;
  enabled?: boolean;
};

export function WebSocketProvider({
  children,
  enabled = false,
}: WebSocketProviderProps) {
  if (enabled) {
    // FUTURE: connect native WebSocket client here
  }
  return <>{children}</>;
}

export function useWebSocketPlaceholder() {
  return {
    connected: false,
    status: "placeholder" as const,
    send: (_event: string, _payload?: unknown) => {
      /* no-op */
    },
  };
}
