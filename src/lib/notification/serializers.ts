import type {
  ActivityLogDocument,
  AnnouncementDocument,
  NotificationDocument,
  NotificationPreferenceDocument,
  SystemEventDocument,
} from "@/models/notification";
import { DEFAULT_CATEGORY_PREFERENCES } from "@/config/notification";
import type {
  ActivityLog,
  Announcement,
  Notification,
  NotificationCategoryId,
  NotificationPreference,
  SystemEvent,
} from "@/types/notification";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function serializeNotification(doc: NotificationDocument): Notification {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId),
    branchId: idToString(doc.branchId),
    userId: idToString(doc.userId),
    title: doc.title,
    message: doc.message,
    type: doc.type as Notification["type"],
    category: doc.category as Notification["category"],
    priority: doc.priority as Notification["priority"],
    status: doc.status as Notification["status"],
    icon: doc.icon ?? "",
    actionUrl: doc.actionUrl ?? "",
    metadata: (doc.metadata as Record<string, unknown>) ?? {},
    readAt: toIsoDate(doc.readAt),
    createdAt: toIsoDate(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoDate(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function serializePreference(
  doc: NotificationPreferenceDocument
): NotificationPreference {
  const categories = {
    ...DEFAULT_CATEGORY_PREFERENCES,
    ...((doc.categories as Partial<Record<NotificationCategoryId, boolean>>) ??
      {}),
  };

  const channels = doc.channels as
    | {
        inApp?: boolean;
        email?: boolean;
        sms?: boolean;
        push?: boolean;
        whatsapp?: boolean;
      }
    | undefined;

  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId),
    userId: idToString(doc.userId) ?? "",
    channels: {
      inApp: channels?.inApp ?? true,
      email: channels?.email ?? false,
      sms: channels?.sms ?? false,
      push: channels?.push ?? false,
      whatsapp: channels?.whatsapp ?? false,
    },
    categories,
    quietHoursEnabled: Boolean(doc.quietHoursEnabled),
    quietHoursStart: doc.quietHoursStart || "22:00",
    quietHoursEnd: doc.quietHoursEnd || "07:00",
    createdAt: toIsoDate(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoDate(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function serializeAnnouncement(doc: AnnouncementDocument): Announcement {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId),
    branchId: idToString(doc.branchId),
    title: doc.title,
    body: doc.body,
    scope: doc.scope as Announcement["scope"],
    status: doc.status as Announcement["status"],
    priority: doc.priority as Announcement["priority"],
    startsAt: toIsoDate(doc.startsAt),
    endsAt: toIsoDate(doc.endsAt),
    createdBy: idToString(doc.createdBy),
    createdAt: toIsoDate(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIsoDate(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function serializeActivity(doc: ActivityLogDocument): ActivityLog {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId),
    branchId: idToString(doc.branchId),
    userId: idToString(doc.userId),
    actorName: doc.actorName ?? "",
    category: doc.category as ActivityLog["category"],
    action: doc.action,
    title: doc.title,
    message: doc.message,
    entityType: doc.entityType ?? "",
    entityId: idToString(doc.entityId),
    metadata: (doc.metadata as Record<string, unknown>) ?? {},
    createdAt: toIsoDate(doc.createdAt) ?? new Date().toISOString(),
  };
}

export function serializeSystemEvent(doc: SystemEventDocument): SystemEvent {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId),
    branchId: idToString(doc.branchId),
    userId: idToString(doc.userId),
    eventType: doc.eventType as SystemEvent["eventType"],
    source: doc.source ?? "system",
    payload: (doc.payload as Record<string, unknown>) ?? {},
    processed: Boolean(doc.processed),
    createdAt: toIsoDate(doc.createdAt) ?? new Date().toISOString(),
  };
}

export {
  formatRelativeTime,
  formatNotificationDateTime,
} from "./formatters";
