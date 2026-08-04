/**
 * Enterprise Notification Center & Real-Time Event Foundation types.
 */

import type { PaginationMeta } from "@/types/database";

export const NOTIFICATION_TYPES = [
  "success",
  "info",
  "warning",
  "error",
  "system",
  "order",
  "kitchen",
  "billing",
  "inventory",
  "customer",
  "purchase",
  "staff",
  "subscription",
  "admin",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CATEGORIES = [
  "orders",
  "kitchen",
  "billing",
  "inventory",
  "customers",
  "purchases",
  "staff",
  "subscription",
  "admin",
  "system",
  "security",
  "announcements",
] as const;

export type NotificationCategoryId =
  (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_PRIORITIES = [
  "low",
  "normal",
  "high",
  "critical",
] as const;

export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export const NOTIFICATION_STATUSES = ["unread", "read", "archived"] as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const SYSTEM_EVENT_TYPES = [
  "order.created",
  "order.updated",
  "kitchen.status_changed",
  "payment.completed",
  "inventory.low_stock",
  "purchase.received",
  "customer.registered",
  "subscription.updated",
  "employee.added",
  "system.alert",
] as const;

export type SystemEventType = (typeof SYSTEM_EVENT_TYPES)[number];

export const ANNOUNCEMENT_SCOPES = [
  "system",
  "restaurant",
  "branch",
  "maintenance",
  "release-notes",
] as const;

export type AnnouncementScope = (typeof ANNOUNCEMENT_SCOPES)[number];

export const ANNOUNCEMENT_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;

export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

export const ACTIVITY_CATEGORIES = [
  "order",
  "billing",
  "inventory",
  "admin",
  "staff",
  "kitchen",
  "customer",
  "purchase",
  "subscription",
  "system",
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export type Notification = {
  id: string;
  restaurantId: string | null;
  branchId: string | null;
  userId: string | null;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategoryId;
  priority: NotificationPriority;
  status: NotificationStatus;
  icon: string;
  actionUrl: string;
  metadata: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationListResult = {
  items: Notification[];
  meta: PaginationMeta;
  unreadCount: number;
};

export type NotificationChannelPrefs = {
  inApp: boolean;
  /** FUTURE PLACEHOLDER — email delivery */
  email: boolean;
  /** FUTURE PLACEHOLDER — SMS delivery */
  sms: boolean;
  /** FUTURE PLACEHOLDER — push providers */
  push: boolean;
  /** FUTURE PLACEHOLDER — WhatsApp */
  whatsapp: boolean;
};

export type NotificationPreference = {
  id: string;
  restaurantId: string | null;
  userId: string;
  channels: NotificationChannelPrefs;
  categories: Partial<Record<NotificationCategoryId, boolean>>;
  /** FUTURE PLACEHOLDER — quiet hours window */
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  createdAt: string;
  updatedAt: string;
};

export type Announcement = {
  id: string;
  restaurantId: string | null;
  branchId: string | null;
  title: string;
  body: string;
  scope: AnnouncementScope;
  status: AnnouncementStatus;
  priority: NotificationPriority;
  startsAt: string | null;
  endsAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementListResult = {
  items: Announcement[];
  meta: PaginationMeta;
};

export type ActivityLog = {
  id: string;
  restaurantId: string | null;
  branchId: string | null;
  userId: string | null;
  actorName: string;
  category: ActivityCategory;
  action: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ActivityListResult = {
  items: ActivityLog[];
  meta: PaginationMeta;
};

export type SystemEvent = {
  id: string;
  restaurantId: string | null;
  branchId: string | null;
  userId: string | null;
  eventType: SystemEventType;
  source: string;
  payload: Record<string, unknown>;
  processed: boolean;
  createdAt: string;
};

export type NotificationCenterSummary = {
  unreadCount: number;
  totalCount: number;
  criticalCount: number;
  todayCount: number;
};

export type NotificationActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type NotificationActionError = {
  code: NotificationActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type NotificationActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: NotificationActionError };

/** Maps domain notification type → UI category for legacy drawer. */
export function notificationTypeToCategory(
  type: NotificationType
): NotificationCategoryId {
  switch (type) {
    case "order":
      return "orders";
    case "kitchen":
      return "kitchen";
    case "billing":
      return "billing";
    case "inventory":
      return "inventory";
    case "customer":
      return "customers";
    case "purchase":
      return "purchases";
    case "staff":
      return "staff";
    case "subscription":
      return "subscription";
    case "admin":
      return "admin";
    case "system":
    case "success":
    case "info":
    case "warning":
    case "error":
    default:
      return "system";
  }
}
