import type {
  ActivityCategory,
  AnnouncementScope,
  AnnouncementStatus,
  NotificationCategoryId,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  SystemEventType,
} from "@/types/notification";

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  success: "Success",
  info: "Info",
  warning: "Warning",
  error: "Error",
  system: "System",
  order: "Order",
  kitchen: "Kitchen",
  billing: "Billing",
  inventory: "Inventory",
  customer: "Customer",
  purchase: "Purchase",
  staff: "Staff",
  subscription: "Subscription",
  admin: "Admin",
};

export const NOTIFICATION_CATEGORY_LABELS: Record<
  NotificationCategoryId,
  string
> = {
  orders: "Orders",
  kitchen: "Kitchen",
  billing: "Billing",
  inventory: "Inventory",
  customers: "Customers",
  purchases: "Purchases",
  staff: "Staff",
  subscription: "Subscription",
  admin: "Admin",
  system: "System",
  security: "Security",
  announcements: "Announcements",
};

export const NOTIFICATION_PRIORITY_LABELS: Record<
  NotificationPriority,
  string
> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  critical: "Critical",
};

export const NOTIFICATION_PRIORITY_VARIANTS: Record<
  NotificationPriority,
  "secondary" | "primary" | "warning" | "danger"
> = {
  low: "secondary",
  normal: "primary",
  high: "warning",
  critical: "danger",
};

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  unread: "Unread",
  read: "Read",
  archived: "Archived",
};

export const NOTIFICATION_STATUS_VARIANTS: Record<
  NotificationStatus,
  "warning" | "success" | "secondary"
> = {
  unread: "warning",
  read: "success",
  archived: "secondary",
};

export const ANNOUNCEMENT_SCOPE_LABELS: Record<AnnouncementScope, string> = {
  system: "System",
  restaurant: "Restaurant",
  branch: "Branch",
  maintenance: "Maintenance",
  "release-notes": "Release notes",
};

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  order: "Orders",
  billing: "Billing",
  inventory: "Inventory",
  admin: "Admin",
  staff: "Staff",
  kitchen: "Kitchen",
  customer: "Customers",
  purchase: "Purchases",
  subscription: "Subscription",
  system: "System",
};

export const SYSTEM_EVENT_TYPE_LABELS: Record<SystemEventType, string> = {
  "order.created": "Order created",
  "order.updated": "Order updated",
  "kitchen.status_changed": "Kitchen status changed",
  "payment.completed": "Payment completed",
  "inventory.low_stock": "Low stock",
  "purchase.received": "Purchase received",
  "customer.registered": "Customer registered",
  "subscription.updated": "Subscription updated",
  "employee.added": "Employee added",
  "system.alert": "System alert",
};

export const DEFAULT_CATEGORY_PREFERENCES: Record<
  NotificationCategoryId,
  boolean
> = {
  orders: true,
  kitchen: true,
  billing: true,
  inventory: true,
  customers: true,
  purchases: true,
  staff: true,
  subscription: true,
  admin: true,
  system: true,
  security: true,
  announcements: true,
};

/** Integration modules prepared for event emission. */
export const NOTIFICATION_INTEGRATION_MODULES = [
  "orders",
  "kitchen",
  "billing",
  "inventory",
  "crm",
  "purchase",
  "reports",
  "staff",
  "subscription",
  "admin",
  "settings",
] as const;

export type NotificationIntegrationModule =
  (typeof NOTIFICATION_INTEGRATION_MODULES)[number];
