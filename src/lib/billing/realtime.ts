/**
 * Real-time foundation placeholders for Billing & POS.
 * FUTURE PLACEHOLDER: no live transport is wired yet.
 */

export type BillingRealtimeChannel =
  | "billing.cart"
  | "billing.payments"
  | "billing.kitchen";

export type BillingRealtimeEventType =
  | "cart.updated"
  | "payment.created"
  | "payment.refunded"
  | "bill.paid"
  | "kitchen.sync";

export type BillingRealtimeEvent = {
  type: BillingRealtimeEventType;
  channel: BillingRealtimeChannel;
  billId?: string;
  restaurantId: string;
  payload?: Record<string, unknown>;
  emittedAt: string;
};

export function connectBillingWebSocket(restaurantId: string): null {
  void restaurantId;
  return null;
}

export function subscribeToLiveCartSync(
  restaurantId: string,
  onEvent: (event: BillingRealtimeEvent) => void
): () => void {
  void restaurantId;
  void onEvent;
  return () => undefined;
}

export function emitKitchenBillingSync(event: BillingRealtimeEvent): void {
  void event;
}

export function emitPaymentEvent(event: BillingRealtimeEvent): void {
  void event;
}

export const billingRealtimeProviders = {
  cartSync: "pending",
  kitchenSync: "pending",
  paymentEvents: "pending",
} as const;
