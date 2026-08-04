/**
 * Event dispatcher — persists SystemEvent and fans out to Notification / Activity.
 * Uses repository layer; publishes to in-process event bus.
 */

import { eventBus } from "@/lib/realtime/event-bus";
import { notificationRepository } from "@/repositories/notification";
import type {
  NotificationCategoryId,
  NotificationType,
  SystemEventType,
} from "@/types/notification";

export type DispatchEventInput = {
  eventType: SystemEventType;
  restaurantId?: string | null;
  branchId?: string | null;
  userId?: string | null;
  actorName?: string;
  source?: string;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
  notificationType?: NotificationType;
  category?: NotificationCategoryId;
  actionUrl?: string;
  createNotification?: boolean;
  createActivity?: boolean;
};

function activityCategoryFromEvent(
  eventType: SystemEventType
): import("@/types/notification").ActivityCategory {
  if (eventType.startsWith("order.")) return "order";
  if (eventType.startsWith("kitchen.")) return "kitchen";
  if (eventType.startsWith("payment.")) return "billing";
  if (eventType.startsWith("inventory.")) return "inventory";
  if (eventType.startsWith("purchase.")) return "purchase";
  if (eventType.startsWith("customer.")) return "customer";
  if (eventType.startsWith("subscription.")) return "subscription";
  if (eventType.startsWith("employee.")) return "staff";
  return "system";
}

export const eventDispatcher = {
  async dispatch(input: DispatchEventInput) {
    const systemEvent = await notificationRepository.createSystemEvent({
      restaurantId: input.restaurantId,
      branchId: input.branchId,
      userId: input.userId,
      eventType: input.eventType,
      source: input.source ?? "system",
      payload: {
        ...input.payload,
        title: input.title,
        message: input.message,
      },
    });

    let notification = null;
    if (input.createNotification !== false) {
      notification = await notificationRepository.createNotification({
        restaurantId: input.restaurantId,
        branchId: input.branchId,
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.notificationType ?? "info",
        category: input.category ?? "system",
        priority: input.eventType === "system.alert" ? "high" : "normal",
        actionUrl: input.actionUrl ?? "",
        metadata: {
          eventType: input.eventType,
          systemEventId: systemEvent.id,
          ...(input.payload ?? {}),
        },
        createdBy: input.userId,
      });
    }

    let activity = null;
    if (input.createActivity !== false) {
      activity = await notificationRepository.createActivity({
        restaurantId: input.restaurantId,
        branchId: input.branchId,
        userId: input.userId,
        actorName: input.actorName ?? "System",
        category: activityCategoryFromEvent(input.eventType),
        action: input.eventType,
        title: input.title,
        message: input.message,
        entityType: input.source ?? "system",
        entityId: null,
        metadata: {
          eventType: input.eventType,
          systemEventId: systemEvent.id,
          ...(input.payload ?? {}),
        },
        createdBy: input.userId,
      });
    }

    await eventBus.emit("system.event", {
      systemEvent,
      notification,
      activity,
    });
    await eventBus.emit(input.eventType, {
      systemEvent,
      notification,
      activity,
    });

    return { systemEvent, notification, activity };
  },
};
