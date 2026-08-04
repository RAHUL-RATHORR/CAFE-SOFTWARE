/**
 * Integration helpers — call from Orders, Kitchen, Billing, etc.
 * Creates SystemEvent + optional Notification + ActivityLog.
 * No external delivery channels.
 */

import { eventDispatcher } from "@/lib/realtime/event-dispatcher";
import type {
  NotificationCategoryId,
  NotificationType,
  SystemEventType,
} from "@/types/notification";

export type EmitDomainEventInput = {
  eventType: SystemEventType;
  restaurantId?: string | null;
  branchId?: string | null;
  userId?: string | null;
  actorName?: string;
  source?: string;
  title?: string;
  message?: string;
  payload?: Record<string, unknown>;
  notificationType?: NotificationType;
  category?: NotificationCategoryId;
  actionUrl?: string;
  createNotification?: boolean;
  createActivity?: boolean;
};

const EVENT_DEFAULTS: Record<
  SystemEventType,
  {
    title: string;
    message: string;
    type: NotificationType;
    category: NotificationCategoryId;
  }
> = {
  "order.created": {
    title: "New order",
    message: "A new order was created.",
    type: "order",
    category: "orders",
  },
  "order.updated": {
    title: "Order updated",
    message: "An order was updated.",
    type: "order",
    category: "orders",
  },
  "kitchen.status_changed": {
    title: "Kitchen status changed",
    message: "A kitchen ticket status changed.",
    type: "kitchen",
    category: "kitchen",
  },
  "payment.completed": {
    title: "Payment completed",
    message: "A payment was completed.",
    type: "billing",
    category: "billing",
  },
  "inventory.low_stock": {
    title: "Low stock alert",
    message: "An inventory item is running low.",
    type: "inventory",
    category: "inventory",
  },
  "purchase.received": {
    title: "Purchase received",
    message: "A purchase order was received.",
    type: "purchase",
    category: "purchases",
  },
  "customer.registered": {
    title: "Customer registered",
    message: "A new customer was registered.",
    type: "customer",
    category: "customers",
  },
  "subscription.updated": {
    title: "Subscription updated",
    message: "Subscription details were updated.",
    type: "subscription",
    category: "subscription",
  },
  "employee.added": {
    title: "Employee added",
    message: "A new employee was added.",
    type: "staff",
    category: "staff",
  },
  "system.alert": {
    title: "System alert",
    message: "A system alert was raised.",
    type: "system",
    category: "system",
  },
};

/**
 * Primary integration entrypoint for domain modules.
 * Persists SystemEvent and optionally Notification + ActivityLog.
 */
export async function emitDomainEvent(input: EmitDomainEventInput) {
  const defaults = EVENT_DEFAULTS[input.eventType];
  return eventDispatcher.dispatch({
    eventType: input.eventType,
    restaurantId: input.restaurantId,
    branchId: input.branchId,
    userId: input.userId,
    actorName: input.actorName,
    source: input.source ?? input.eventType.split(".")[0],
    title: input.title ?? defaults.title,
    message: input.message ?? defaults.message,
    payload: input.payload,
    notificationType: input.notificationType ?? defaults.type,
    category: input.category ?? defaults.category,
    actionUrl: input.actionUrl,
    createNotification: input.createNotification ?? true,
    createActivity: input.createActivity ?? true,
  });
}

/** Convenience wrappers — prepared for module wiring. */
export const notificationIntegrations = {
  orderCreated: (input: Omit<EmitDomainEventInput, "eventType">) =>
    emitDomainEvent({ ...input, eventType: "order.created" }),
  orderUpdated: (input: Omit<EmitDomainEventInput, "eventType">) =>
    emitDomainEvent({ ...input, eventType: "order.updated" }),
  kitchenStatusChanged: (input: Omit<EmitDomainEventInput, "eventType">) =>
    emitDomainEvent({ ...input, eventType: "kitchen.status_changed" }),
  paymentCompleted: (input: Omit<EmitDomainEventInput, "eventType">) =>
    emitDomainEvent({ ...input, eventType: "payment.completed" }),
  lowStock: (input: Omit<EmitDomainEventInput, "eventType">) =>
    emitDomainEvent({ ...input, eventType: "inventory.low_stock" }),
  purchaseReceived: (input: Omit<EmitDomainEventInput, "eventType">) =>
    emitDomainEvent({ ...input, eventType: "purchase.received" }),
  customerRegistered: (input: Omit<EmitDomainEventInput, "eventType">) =>
    emitDomainEvent({ ...input, eventType: "customer.registered" }),
  subscriptionUpdated: (input: Omit<EmitDomainEventInput, "eventType">) =>
    emitDomainEvent({ ...input, eventType: "subscription.updated" }),
  employeeAdded: (input: Omit<EmitDomainEventInput, "eventType">) =>
    emitDomainEvent({ ...input, eventType: "employee.added" }),
  systemAlert: (input: Omit<EmitDomainEventInput, "eventType">) =>
    emitDomainEvent({ ...input, eventType: "system.alert" }),
};
