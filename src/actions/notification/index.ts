"use server";

import { revalidatePath } from "next/cache";
import { resolveNotificationActor } from "@/actions/notification/context";
import {
  notificationFailure,
  notificationSuccess,
  zodFieldErrors,
} from "@/lib/notification";
import { eventDispatcher } from "@/lib/realtime/event-dispatcher";
import { notificationRepository } from "@/repositories/notification";
import {
  createAnnouncementSchema,
  createNotificationSchema,
  emitSystemEventSchema,
  markNotificationsSchema,
  searchActivitySchema,
  searchAnnouncementSchema,
  searchNotificationSchema,
  updateNotificationStatusSchema,
  updatePreferenceSchema,
} from "@/lib/validators/notification";
import type {
  ActivityListResult,
  Announcement,
  AnnouncementListResult,
  Notification,
  NotificationActionResult,
  NotificationCenterSummary,
  NotificationListResult,
  NotificationPreference,
} from "@/types/notification";

function revalidateNotificationPaths() {
  revalidatePath("/notifications");
  revalidatePath("/notifications/history");
  revalidatePath("/notifications/preferences");
  revalidatePath("/announcements");
  revalidatePath("/activity");
}

export async function getNotifications(
  input: unknown = {}
): Promise<NotificationActionResult<NotificationListResult>> {
  const actor = await resolveNotificationActor([
    "notifications.view",
    "notifications.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = searchNotificationSchema.safeParse(input);
  if (!parsed.success) {
    return notificationFailure(
      "VALIDATION_ERROR",
      "Invalid search filters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await notificationRepository.findNotifications(
      actor.data.restaurantId,
      actor.data.userId,
      parsed.data
    );
    return notificationSuccess(data);
  } catch {
    return notificationFailure(
      "DATABASE_ERROR",
      "Unable to load notifications."
    );
  }
}

export async function getNotificationHistory(
  input: unknown = {}
): Promise<NotificationActionResult<NotificationListResult>> {
  return getNotifications({
    ...(typeof input === "object" && input ? input : {}),
    historyOnly: true,
    status: "all",
  });
}

export async function getNotificationSummary(): Promise<
  NotificationActionResult<NotificationCenterSummary>
> {
  const actor = await resolveNotificationActor([
    "notifications.view",
    "notifications.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const data = await notificationRepository.getCenterSummary(
      actor.data.restaurantId,
      actor.data.userId
    );
    return notificationSuccess(data);
  } catch {
    return notificationFailure(
      "DATABASE_ERROR",
      "Unable to load notification summary."
    );
  }
}

export async function getUnreadNotificationCount(): Promise<
  NotificationActionResult<number>
> {
  const actor = await resolveNotificationActor([
    "notifications.view",
    "notifications.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const count = await notificationRepository.getUnreadCount(
      actor.data.restaurantId,
      actor.data.userId
    );
    return notificationSuccess(count);
  } catch {
    return notificationFailure(
      "DATABASE_ERROR",
      "Unable to count unread notifications."
    );
  }
}

export async function createNotificationAction(
  input: unknown
): Promise<NotificationActionResult<Notification>> {
  const actor = await resolveNotificationActor(["notifications.manage"]);
  if (!actor.success) return actor;

  const parsed = createNotificationSchema.safeParse(input);
  if (!parsed.success) {
    return notificationFailure(
      "VALIDATION_ERROR",
      "Invalid notification payload.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await notificationRepository.createNotification({
      ...parsed.data,
      restaurantId: parsed.data.restaurantId ?? actor.data.restaurantId,
      createdBy: actor.data.userId,
    });
    revalidateNotificationPaths();
    return notificationSuccess(data);
  } catch {
    return notificationFailure(
      "DATABASE_ERROR",
      "Unable to create notification."
    );
  }
}

export async function markNotificationsRead(
  input: unknown
): Promise<NotificationActionResult<{ modified: number }>> {
  const actor = await resolveNotificationActor([
    "notifications.view",
    "notifications.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = markNotificationsSchema.safeParse(input);
  if (!parsed.success) {
    return notificationFailure(
      "VALIDATION_ERROR",
      "Invalid mark-read payload.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const modified = parsed.data.markAll
      ? await notificationRepository.markAllRead(
          actor.data.restaurantId,
          actor.data.userId
        )
      : await notificationRepository.markAsRead(
          parsed.data.ids ?? [],
          actor.data.restaurantId,
          actor.data.userId
        );
    revalidateNotificationPaths();
    return notificationSuccess({ modified });
  } catch {
    return notificationFailure(
      "DATABASE_ERROR",
      "Unable to mark notifications as read."
    );
  }
}

export async function updateNotificationStatusAction(
  input: unknown
): Promise<NotificationActionResult<Notification>> {
  const actor = await resolveNotificationActor([
    "notifications.view",
    "notifications.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateNotificationStatusSchema.safeParse(input);
  if (!parsed.success) {
    return notificationFailure(
      "VALIDATION_ERROR",
      "Invalid status update.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await notificationRepository.updateStatus(
      parsed.data.id,
      parsed.data.status,
      actor.data.restaurantId
    );
    if (!data) {
      return notificationFailure("NOT_FOUND", "Notification not found.");
    }
    revalidateNotificationPaths();
    return notificationSuccess(data);
  } catch {
    return notificationFailure(
      "DATABASE_ERROR",
      "Unable to update notification."
    );
  }
}

/** Archive placeholder — sets status archived without hard delete. */
export async function archiveNotificationPlaceholder(
  id: string
): Promise<NotificationActionResult<Notification>> {
  return updateNotificationStatusAction({ id, status: "archived" });
}

/** Delete placeholder — soft-archives instead of permanent delete. */
export async function deleteNotificationPlaceholder(
  id: string
): Promise<NotificationActionResult<Notification>> {
  return archiveNotificationPlaceholder(id);
}

export async function getNotificationPreferences(): Promise<
  NotificationActionResult<NotificationPreference>
> {
  const actor = await resolveNotificationActor([
    "notifications.settings",
    "notifications.view",
    "notifications.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const data = await notificationRepository.getOrCreatePreference(
      actor.data.restaurantId,
      actor.data.userId
    );
    return notificationSuccess(data);
  } catch {
    return notificationFailure(
      "DATABASE_ERROR",
      "Unable to load preferences."
    );
  }
}

export async function updateNotificationPreferences(
  input: unknown
): Promise<NotificationActionResult<NotificationPreference>> {
  const actor = await resolveNotificationActor([
    "notifications.settings",
    "notifications.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updatePreferenceSchema.safeParse(input);
  if (!parsed.success) {
    return notificationFailure(
      "VALIDATION_ERROR",
      "Invalid preference payload.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await notificationRepository.updatePreference(
      actor.data.restaurantId,
      actor.data.userId,
      parsed.data
    );
    revalidatePath("/notifications/preferences");
    return notificationSuccess(data);
  } catch {
    return notificationFailure(
      "DATABASE_ERROR",
      "Unable to save preferences."
    );
  }
}

export async function getAnnouncements(
  input: unknown = {}
): Promise<NotificationActionResult<AnnouncementListResult>> {
  const actor = await resolveNotificationActor([
    "notifications.view",
    "announcements.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = searchAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return notificationFailure(
      "VALIDATION_ERROR",
      "Invalid announcement filters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await notificationRepository.findAnnouncements(
      actor.data.restaurantId,
      parsed.data
    );
    return notificationSuccess(data);
  } catch {
    return notificationFailure(
      "DATABASE_ERROR",
      "Unable to load announcements."
    );
  }
}

export async function createAnnouncementAction(
  input: unknown
): Promise<NotificationActionResult<Announcement>> {
  const actor = await resolveNotificationActor(["announcements.manage"]);
  if (!actor.success) return actor;

  const parsed = createAnnouncementSchema.safeParse(input);
  if (!parsed.success) {
    return notificationFailure(
      "VALIDATION_ERROR",
      "Invalid announcement payload.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await notificationRepository.createAnnouncement({
      ...parsed.data,
      restaurantId: parsed.data.restaurantId ?? actor.data.restaurantId,
      createdBy: actor.data.userId,
    });
    revalidatePath("/announcements");
    return notificationSuccess(data);
  } catch {
    return notificationFailure(
      "DATABASE_ERROR",
      "Unable to create announcement."
    );
  }
}

export async function getActivityFeed(
  input: unknown = {}
): Promise<NotificationActionResult<ActivityListResult>> {
  const actor = await resolveNotificationActor(["activity.view"]);
  if (!actor.success) return actor;

  const parsed = searchActivitySchema.safeParse(input);
  if (!parsed.success) {
    return notificationFailure(
      "VALIDATION_ERROR",
      "Invalid activity filters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await notificationRepository.findActivities(
      actor.data.restaurantId,
      parsed.data
    );
    return notificationSuccess(data);
  } catch {
    return notificationFailure("DATABASE_ERROR", "Unable to load activity.");
  }
}

export async function emitSystemEventAction(
  input: unknown
): Promise<
  NotificationActionResult<{
    systemEventId: string;
    notificationId: string | null;
    activityId: string | null;
  }>
> {
  const actor = await resolveNotificationActor([
    "notifications.manage",
    "announcements.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = emitSystemEventSchema.safeParse(input);
  if (!parsed.success) {
    return notificationFailure(
      "VALIDATION_ERROR",
      "Invalid event payload.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await eventDispatcher.dispatch({
      eventType: parsed.data.eventType,
      restaurantId: parsed.data.restaurantId ?? actor.data.restaurantId,
      branchId: parsed.data.branchId,
      userId: parsed.data.userId ?? actor.data.userId,
      actorName: actor.data.name ?? actor.data.email ?? "User",
      source: parsed.data.source,
      title: parsed.data.title ?? parsed.data.eventType,
      message: parsed.data.message ?? `Event ${parsed.data.eventType}`,
      payload: parsed.data.payload,
      createNotification: parsed.data.createNotification,
      createActivity: parsed.data.createActivity,
    });
    revalidateNotificationPaths();
    return notificationSuccess({
      systemEventId: result.systemEvent.id,
      notificationId: result.notification?.id ?? null,
      activityId: result.activity?.id ?? null,
    });
  } catch {
    return notificationFailure("DATABASE_ERROR", "Unable to emit event.");
  }
}
