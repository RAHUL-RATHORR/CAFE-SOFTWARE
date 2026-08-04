/**
 * Real-time foundation placeholders for the Orders module.
 * FUTURE PLACEHOLDER: no live transport is wired yet.
 */

export type OrderRealtimeChannel =
  | "orders.live"
  | "orders.kitchen"
  | "orders.notifications";

export type OrderRealtimeEventType =
  | "order.created"
  | "order.updated"
  | "order.status_changed"
  | "order.deleted"
  | "kitchen.ticket"
  | "push.notification";

export type OrderRealtimeEvent = {
  type: OrderRealtimeEventType;
  channel: OrderRealtimeChannel;
  orderId: string;
  restaurantId: string;
  payload?: Record<string, unknown>;
  emittedAt: string;
};

/** FUTURE PLACEHOLDER — WebSocket client connection */
export function connectOrderWebSocket(restaurantId: string): null {
  void restaurantId;
  return null;
}

/** FUTURE PLACEHOLDER — subscribe to live order updates */
export function subscribeToOrderLiveUpdates(
  restaurantId: string,
  onEvent: (event: OrderRealtimeEvent) => void
): () => void {
  void restaurantId;
  void onEvent;
  return () => undefined;
}

/** FUTURE PLACEHOLDER — push notification bridge */
export function enqueueOrderPushNotification(
  event: OrderRealtimeEvent
): void {
  void event;
}

/** FUTURE PLACEHOLDER — kitchen display event fan-out */
export function emitKitchenOrderEvent(event: OrderRealtimeEvent): void {
  void event;
}

export const orderRealtimeProviders = {
  websocket: "pending",
  push: "pending",
  kitchen: "pending",
} as const;
