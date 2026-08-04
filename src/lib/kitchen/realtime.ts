/**
 * Real-time foundation placeholders for Kitchen Display System.
 * FUTURE PLACEHOLDER: no live transport is wired yet.
 */

export type KitchenRealtimeChannel =
  | "kitchen.live"
  | "kitchen.events"
  | "kitchen.notifications";

export type KitchenRealtimeEventType =
  | "ticket.created"
  | "ticket.updated"
  | "ticket.status_changed"
  | "ticket.completed"
  | "kitchen.alert";

export type KitchenRealtimeEvent = {
  type: KitchenRealtimeEventType;
  channel: KitchenRealtimeChannel;
  orderId: string;
  restaurantId: string;
  payload?: Record<string, unknown>;
  emittedAt: string;
};

/** FUTURE PLACEHOLDER — WebSocket client */
export function connectKitchenWebSocket(restaurantId: string): null {
  void restaurantId;
  return null;
}

/** FUTURE PLACEHOLDER — polling loop hook */
export function startKitchenPolling(
  restaurantId: string,
  intervalMs: number,
  onTick: () => void
): () => void {
  void restaurantId;
  void intervalMs;
  void onTick;
  return () => undefined;
}

/** FUTURE PLACEHOLDER — subscribe to kitchen events */
export function subscribeToKitchenEvents(
  restaurantId: string,
  onEvent: (event: KitchenRealtimeEvent) => void
): () => void {
  void restaurantId;
  void onEvent;
  return () => undefined;
}

/** FUTURE PLACEHOLDER — notification bridge */
export function notifyKitchenEvent(event: KitchenRealtimeEvent): void {
  void event;
}

export const kitchenRealtimeProviders = {
  websocket: "pending",
  polling: "pending",
  notifications: "pending",
} as const;
