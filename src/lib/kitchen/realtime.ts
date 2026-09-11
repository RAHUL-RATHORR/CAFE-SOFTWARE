/**
 * Real-time event bus infrastructure for DineFlow Kitchen Display System (KDS).
 * Connects server-side actions, database updates, and SSE streams.
 */

import { eventBus } from "@/lib/realtime/event-bus";
import type {
  KitchenRealtimeEventType as KdsEventType,
  KitchenRealtimePayload,
} from "@/types/kitchen";

export function buildKitchenChannel(
  restaurantId: string,
  branchId?: string | null
): string {
  const branchKey = branchId?.trim() ? branchId.trim() : "all";
  return `restaurant:${restaurantId}:branch:${branchKey}`;
}

export async function emitKitchenEvent(
  payload: KitchenRealtimePayload
): Promise<void> {
  const specificChannel = buildKitchenChannel(
    payload.restaurantId,
    payload.branchId
  );
  const globalRestaurantChannel = buildKitchenChannel(payload.restaurantId, null);

  await Promise.all([
    eventBus.emit("kitchen.stream", payload),
    eventBus.emit(specificChannel, payload),
    eventBus.emit(globalRestaurantChannel, payload),
  ]);
}

export function subscribeKitchenChannel(
  restaurantId: string,
  branchId: string | null | undefined,
  listener: (payload: KitchenRealtimePayload) => void
): () => void {
  const channel = buildKitchenChannel(restaurantId, branchId);
  return eventBus.on<KitchenRealtimePayload>(channel, (data) => {
    if (data.restaurantId !== restaurantId) return;
    if (branchId && data.branchId && data.branchId !== branchId) return;
    listener(data);
  });
}

// Backward compatibility aliases & placeholders
export type KitchenRealtimeChannel =
  | "kitchen.live"
  | "kitchen.events"
  | "kitchen.notifications";

export type KitchenRealtimeEventType =
  | "ticket.created"
  | "ticket.updated"
  | "ticket.status_changed"
  | "ticket.completed"
  | "kitchen.alert"
  | KdsEventType;

export type KitchenRealtimeEvent = {
  type: KitchenRealtimeEventType;
  channel: KitchenRealtimeChannel;
  orderId: string;
  restaurantId: string;
  payload?: Record<string, unknown>;
  emittedAt: string;
};

export function connectKitchenWebSocket(restaurantId: string): null {
  void restaurantId;
  return null;
}

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

export function subscribeToKitchenEvents(
  restaurantId: string,
  onEvent: (event: KitchenRealtimeEvent) => void
): () => void {
  void restaurantId;
  void onEvent;
  return () => undefined;
}

export function notifyKitchenEvent(event: KitchenRealtimeEvent): void {
  void event;
}

export const kitchenRealtimeProviders = {
  websocket: "pending",
  polling: "pending",
  notifications: "pending",
} as const;
