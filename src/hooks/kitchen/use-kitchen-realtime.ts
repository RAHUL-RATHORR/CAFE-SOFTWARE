"use client";

import { useEffect, useRef, useState } from "react";
import { playKitchenChime } from "@/lib/kitchen/kitchen-audio";
import type { KitchenRealtimePayload } from "@/types/kitchen";

export type ConnectionState = "connected" | "reconnecting" | "disconnected";

export type UseKitchenRealtimeOptions = {
  branchId?: string | null;
  onNewOrder?: (payload: KitchenRealtimePayload) => void;
  onOrderUpdated?: (payload: KitchenRealtimePayload) => void;
  onOrderCancelled?: (payload: KitchenRealtimePayload) => void;
  onSyncRequired?: () => void;
};

export function useKitchenRealtime(options: UseKitchenRealtimeOptions) {
  const {
    branchId,
    onNewOrder,
    onOrderUpdated,
    onOrderCancelled,
    onSyncRequired,
  } = options;

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionState>("reconnecting");
  const [newOrderAlert, setNewOrderAlert] = useState<{
    orderNumber: string;
    tableLabel?: string | null;
    time: string;
  } | null>(null);

  const callbacksRef = useRef({
    onNewOrder,
    onOrderUpdated,
    onOrderCancelled,
    onSyncRequired,
  });

  useEffect(() => {
    callbacksRef.current = {
      onNewOrder,
      onOrderUpdated,
      onOrderCancelled,
      onSyncRequired,
    };
  });

  const alertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wasReconnectingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let eventSource: EventSource | null = null;
    let isDisposed = false;

    function connect() {
      if (isDisposed) return;

      const url = new URL("/api/kitchen/events", window.location.origin);
      if (branchId?.trim()) {
        url.searchParams.set("branchId", branchId.trim());
      }

      eventSource = new EventSource(url.toString());

      eventSource.onopen = () => {
        if (isDisposed) return;
        setConnectionStatus("connected");
        // If we were reconnecting, synchronize state from server to guarantee accuracy
        if (wasReconnectingRef.current) {
          wasReconnectingRef.current = false;
          callbacksRef.current.onSyncRequired?.();
        }
      };

      eventSource.onmessage = (event) => {
        if (isDisposed) return;
        try {
          const data: KitchenRealtimePayload = JSON.parse(event.data);
          if (data.type === "NEW_ORDER") {
            playKitchenChime();
            setNewOrderAlert({
              orderNumber: data.orderNumber,
              tableLabel: data.order?.tableLabel,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            });
            if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
            alertTimerRef.current = setTimeout(() => {
              setNewOrderAlert(null);
            }, 7000);
            callbacksRef.current.onNewOrder?.(data);
          } else if (data.type === "ORDER_UPDATED") {
            callbacksRef.current.onOrderUpdated?.(data);
          } else if (data.type === "ORDER_CANCELLED") {
            callbacksRef.current.onOrderCancelled?.(data);
          }
        } catch {
          // Heartbeat or malformed frame
        }
      };

      eventSource.onerror = () => {
        if (isDisposed) return;
        wasReconnectingRef.current = true;
        setConnectionStatus(navigator.onLine ? "reconnecting" : "disconnected");
      };
    }

    connect();

    const handleOnline = () => {
      setConnectionStatus("reconnecting");
    };

    const handleOffline = () => {
      setConnectionStatus("disconnected");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isDisposed = true;
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [branchId]);

  return {
    connectionStatus,
    newOrderAlert,
    dismissAlert: () => setNewOrderAlert(null),
  };
}
