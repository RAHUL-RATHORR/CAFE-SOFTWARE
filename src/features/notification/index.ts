export {
  getNotifications,
  getNotificationHistory,
  getNotificationSummary,
  getUnreadNotificationCount,
  createNotificationAction,
  markNotificationsRead,
  updateNotificationStatusAction,
  archiveNotificationPlaceholder,
  deleteNotificationPlaceholder,
  getNotificationPreferences,
  updateNotificationPreferences,
  getAnnouncements,
  createAnnouncementAction,
  getActivityFeed,
  emitSystemEventAction,
} from "@/actions/notification";

export {
  NotificationCenterView,
  NotificationPreferencesView,
  AnnouncementCenterView,
  ActivityFeedView,
  NotificationBell,
  NotificationDrawer,
} from "@/components/notifications";

export {
  createNotificationSchema,
  searchNotificationSchema,
  updatePreferenceSchema,
  searchAnnouncementSchema,
  searchActivitySchema,
  emitSystemEventSchema,
} from "@/lib/validators/notification";

export { notificationRepository } from "@/repositories/notification";
export {
  NotificationModel,
  NotificationPreferenceModel,
  AnnouncementModel,
  ActivityLogModel,
  SystemEventModel,
} from "@/models/notification";

export {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  ANNOUNCEMENT_SCOPE_LABELS,
  ACTIVITY_CATEGORY_LABELS,
  SYSTEM_EVENT_TYPE_LABELS,
  NOTIFICATION_INTEGRATION_MODULES,
} from "@/config/notification";

export {
  emitDomainEvent,
  notificationIntegrations,
} from "@/lib/notification/integrations";

export type { EmitDomainEventInput } from "@/lib/notification/integrations";

export {
  eventBus,
  eventDispatcher,
  WebSocketProvider,
  SseProvider,
  DEFAULT_POLLING_STRATEGY,
  DEFAULT_RECONNECT_STRATEGY,
  offlineQueue,
} from "@/lib/realtime";

export type {
  Notification,
  NotificationPreference,
  Announcement,
  ActivityLog,
  SystemEvent,
  NotificationListResult,
  NotificationActionResult,
  SystemEventType,
} from "@/types/notification";

export {
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  SYSTEM_EVENT_TYPES,
} from "@/types/notification";
