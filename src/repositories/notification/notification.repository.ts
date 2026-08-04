import type { SortOrder } from "mongoose";
import {
  buildPaginationMeta,
  connectToDatabase,
  handleDatabaseError,
  isValidObjectId,
  normalizePagination,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import { DEFAULT_CATEGORY_PREFERENCES } from "@/config/notification";
import {
  serializeActivity,
  serializeAnnouncement,
  serializeNotification,
  serializePreference,
  serializeSystemEvent,
} from "@/lib/notification/serializers";
import {
  ActivityLogModel,
  AnnouncementModel,
  NotificationModel,
  NotificationPreferenceModel,
  SystemEventModel,
} from "@/models/notification";
import type {
  ActivityListResult,
  ActivityLog,
  Announcement,
  AnnouncementListResult,
  Notification,
  NotificationCenterSummary,
  NotificationListResult,
  NotificationPreference,
  NotificationPriority,
  NotificationStatus,
  SystemEvent,
  SystemEventType,
  ActivityCategory,
} from "@/types/notification";
import type {
  CreateAnnouncementInput,
  CreateNotificationInput,
  SearchActivityInput,
  SearchAnnouncementInput,
  SearchNotificationInput,
  UpdatePreferenceInput,
} from "@/lib/validators/notification";

type Filter = Record<string, unknown>;

function optionalRef(id: string | null | undefined) {
  if (!id || !isValidObjectId(id)) return null;
  return toObjectId(id);
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildNotificationFilter(
  restaurantId: string | null,
  userId: string | null,
  input: SearchNotificationInput
): Filter {
  const filter: Filter = notDeletedFilter({});

  if (restaurantId && isValidObjectId(restaurantId)) {
    filter.restaurantId = toObjectId(restaurantId);
  }

  // User inbox: own notifications OR broadcast (userId null)
  if (userId && isValidObjectId(userId) && !input.userId) {
    filter.$or = [
      { userId: toObjectId(userId) },
      { userId: null },
    ];
  } else if (input.userId && isValidObjectId(input.userId)) {
    filter.userId = toObjectId(input.userId);
  }

  if (input.type && input.type !== "all") filter.type = input.type;
  if (input.category && input.category !== "all") {
    filter.category = input.category;
  }
  if (input.priority && input.priority !== "all") {
    filter.priority = input.priority;
  }
  if (input.status && input.status !== "all") {
    filter.status = input.status;
  } else if (input.historyOnly) {
    filter.status = { $in: ["read", "archived"] };
  }

  if (input.branchId && isValidObjectId(input.branchId)) {
    filter.branchId = toObjectId(input.branchId);
  }

  const created: Filter = {};
  if (input.dateFrom) {
    const from = parseDate(input.dateFrom);
    if (from) created.$gte = from;
  }
  if (input.dateTo) {
    const to = parseDate(input.dateTo);
    if (to) {
      to.setHours(23, 59, 59, 999);
      created.$lte = to;
    }
  }
  if (Object.keys(created).length) filter.createdAt = created;

  const q = input.q?.trim();
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const textOr = [{ title: regex }, { message: regex }];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or as Filter[] }, { $or: textOr }];
      delete filter.$or;
    } else {
      filter.$or = textOr;
    }
  }

  return filter;
}

async function createNotification(
  data: CreateNotificationInput & {
    priority?: NotificationPriority;
    status?: NotificationStatus;
    createdBy?: string | null;
  }
): Promise<Notification> {
  try {
    await connectToDatabase();
    const doc = await NotificationModel.create({
      restaurantId: optionalRef(data.restaurantId),
      branchId: optionalRef(data.branchId),
      userId: optionalRef(data.userId),
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type ?? "info",
      category: data.category ?? "system",
      priority: data.priority ?? "normal",
      status: data.status ?? "unread",
      icon: data.icon?.trim() ?? "",
      actionUrl: data.actionUrl?.trim() ?? "",
      metadata: data.metadata ?? {},
      createdBy: optionalRef(data.createdBy),
    });
    return serializeNotification(doc);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to create notification");
  }
}

async function findNotifications(
  restaurantId: string | null,
  userId: string | null,
  input: SearchNotificationInput
): Promise<NotificationListResult> {
  try {
    await connectToDatabase();
    const pagination = normalizePagination({
      page: input.page,
      pageSize: input.pageSize,
    });
    const skip = (pagination.page - 1) * pagination.pageSize;
    const filter = buildNotificationFilter(restaurantId, userId, input);
    const sortField = input.sortBy ?? "createdAt";
    const sort: Record<string, SortOrder> = {
      [sortField]: input.sortOrder === "asc" ? 1 : -1,
    };

    const [docs, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pagination.pageSize)
        .lean(),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments(
        buildNotificationFilter(restaurantId, userId, {
          ...input,
          status: "unread",
          historyOnly: false,
          page: 1,
          pageSize: 1,
          type: "all",
          category: "all",
          priority: "all",
          sortBy: "createdAt",
          sortOrder: "desc",
        })
      ),
    ]);

    return {
      items: docs.map((doc) =>
        serializeNotification(
          doc as unknown as Parameters<typeof serializeNotification>[0]
        )
      ),
      meta: buildPaginationMeta(
        total,
        pagination.page,
        pagination.pageSize
      ),
      unreadCount,
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to list notifications");
  }
}

async function getUnreadCount(
  restaurantId: string | null,
  userId: string | null
): Promise<number> {
  try {
    await connectToDatabase();
    const filter = buildNotificationFilter(restaurantId, userId, {
      status: "unread",
      type: "all",
      category: "all",
      priority: "all",
      page: 1,
      pageSize: 1,
      sortBy: "createdAt",
      sortOrder: "desc",
      historyOnly: false,
    });
    return NotificationModel.countDocuments(filter);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to count unread notifications");
  }
}

async function getCenterSummary(
  restaurantId: string | null,
  userId: string | null
): Promise<NotificationCenterSummary> {
  try {
    await connectToDatabase();
    const base = buildNotificationFilter(restaurantId, userId, {
      type: "all",
      category: "all",
      priority: "all",
      status: "all",
      page: 1,
      pageSize: 1,
      sortBy: "createdAt",
      sortOrder: "desc",
      historyOnly: false,
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalCount, unreadCount, criticalCount, todayCount] =
      await Promise.all([
        NotificationModel.countDocuments(base),
        NotificationModel.countDocuments({ ...base, status: "unread" }),
        NotificationModel.countDocuments({
          ...base,
          priority: "critical",
          status: "unread",
        }),
        NotificationModel.countDocuments({
          ...base,
          createdAt: { $gte: startOfDay },
        }),
      ]);

    return { totalCount, unreadCount, criticalCount, todayCount };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to load notification summary");
  }
}

async function markAsRead(
  ids: string[],
  restaurantId: string | null,
  userId: string | null
): Promise<number> {
  try {
    await connectToDatabase();
    const objectIds = ids.filter(isValidObjectId).map(toObjectId);
    if (!objectIds.length) return 0;

    const filter: Filter = notDeletedFilter({
      _id: { $in: objectIds },
      status: "unread",
    });
    if (restaurantId && isValidObjectId(restaurantId)) {
      filter.restaurantId = toObjectId(restaurantId);
    }
    if (userId && isValidObjectId(userId)) {
      filter.$or = [{ userId: toObjectId(userId) }, { userId: null }];
    }

    const result = await NotificationModel.updateMany(filter, {
      $set: { status: "read", readAt: new Date() },
    });
    return result.modifiedCount;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to mark notifications read");
  }
}

async function markAllRead(
  restaurantId: string | null,
  userId: string | null
): Promise<number> {
  try {
    await connectToDatabase();
    const filter = buildNotificationFilter(restaurantId, userId, {
      status: "unread",
      type: "all",
      category: "all",
      priority: "all",
      page: 1,
      pageSize: 1,
      sortBy: "createdAt",
      sortOrder: "desc",
      historyOnly: false,
    });
    const result = await NotificationModel.updateMany(filter, {
      $set: { status: "read", readAt: new Date() },
    });
    return result.modifiedCount;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to mark all notifications read");
  }
}

async function updateStatus(
  id: string,
  status: NotificationStatus,
  restaurantId: string | null
): Promise<Notification | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const filter: Filter = notDeletedFilter({ _id: toObjectId(id) });
    if (restaurantId && isValidObjectId(restaurantId)) {
      filter.restaurantId = toObjectId(restaurantId);
    }
    const update: Filter = { status };
    if (status === "read") update.readAt = new Date();
    if (status === "unread") update.readAt = null;

    const doc = await NotificationModel.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true }
    );
    return doc ? serializeNotification(doc) : null;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update notification status");
  }
}

async function getOrCreatePreference(
  restaurantId: string | null,
  userId: string
): Promise<NotificationPreference> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(userId)) {
      throw new Error("Invalid user id");
    }
    const filter: Filter = notDeletedFilter({
      userId: toObjectId(userId),
    });
    if (restaurantId && isValidObjectId(restaurantId)) {
      filter.restaurantId = toObjectId(restaurantId);
    }

    let doc = await NotificationPreferenceModel.findOne(filter);
    if (!doc) {
      doc = await NotificationPreferenceModel.create({
        restaurantId: optionalRef(restaurantId),
        userId: toObjectId(userId),
        channels: {
          inApp: true,
          email: false,
          sms: false,
          push: false,
          whatsapp: false,
        },
        categories: { ...DEFAULT_CATEGORY_PREFERENCES },
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
      });
    }
    return serializePreference(doc);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to load notification preferences");
  }
}

async function updatePreference(
  restaurantId: string | null,
  userId: string,
  input: UpdatePreferenceInput
): Promise<NotificationPreference> {
  try {
    await connectToDatabase();
    const existing = await getOrCreatePreference(restaurantId, userId);
    const filter: Filter = notDeletedFilter({
      _id: toObjectId(existing.id),
    });

    const $set: Filter = {};
    if (input.channels) {
      for (const [key, value] of Object.entries(input.channels)) {
        if (value !== undefined) $set[`channels.${key}`] = value;
      }
    }
    if (input.categories) {
      for (const [key, value] of Object.entries(input.categories)) {
        $set[`categories.${key}`] = value;
      }
    }
    if (input.quietHoursEnabled !== undefined) {
      $set.quietHoursEnabled = input.quietHoursEnabled;
    }
    if (input.quietHoursStart !== undefined) {
      $set.quietHoursStart = input.quietHoursStart;
    }
    if (input.quietHoursEnd !== undefined) {
      $set.quietHoursEnd = input.quietHoursEnd;
    }

    const doc = await NotificationPreferenceModel.findOneAndUpdate(
      filter,
      { $set },
      { new: true }
    );
    return serializePreference(doc!);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update notification preferences");
  }
}

async function createAnnouncement(
  data: CreateAnnouncementInput & { createdBy?: string | null }
): Promise<Announcement> {
  try {
    await connectToDatabase();
    const doc = await AnnouncementModel.create({
      restaurantId: optionalRef(data.restaurantId),
      branchId: optionalRef(data.branchId),
      title: data.title.trim(),
      body: data.body.trim(),
      scope: data.scope ?? "restaurant",
      status: data.status ?? "draft",
      priority: data.priority ?? "normal",
      startsAt: parseDate(data.startsAt),
      endsAt: parseDate(data.endsAt),
      createdBy: optionalRef(data.createdBy),
    });
    return serializeAnnouncement(doc);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to create announcement");
  }
}

async function findAnnouncements(
  restaurantId: string | null,
  input: SearchAnnouncementInput
): Promise<AnnouncementListResult> {
  try {
    await connectToDatabase();
    const pagination = normalizePagination({
      page: input.page,
      pageSize: input.pageSize,
    });
    const skip = (pagination.page - 1) * pagination.pageSize;
    const filter: Filter = notDeletedFilter({});
    if (restaurantId && isValidObjectId(restaurantId)) {
      filter.$or = [
        { restaurantId: toObjectId(restaurantId) },
        { scope: "system" },
        { restaurantId: null },
      ];
    }
    if (input.scope && input.scope !== "all") filter.scope = input.scope;
    if (input.status && input.status !== "all") filter.status = input.status;

    const q = input.q?.trim();
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$and = [
        ...(filter.$and ? (filter.$and as Filter[]) : []),
        { $or: [{ title: regex }, { body: regex }] },
      ];
    }

    const [docs, total] = await Promise.all([
      AnnouncementModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.pageSize)
        .lean(),
      AnnouncementModel.countDocuments(filter),
    ]);

    return {
      items: docs.map((doc) =>
        serializeAnnouncement(
          doc as unknown as Parameters<typeof serializeAnnouncement>[0]
        )
      ),
      meta: buildPaginationMeta(
        total,
        pagination.page,
        pagination.pageSize
      ),
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to list announcements");
  }
}

async function createActivity(data: {
  restaurantId?: string | null;
  branchId?: string | null;
  userId?: string | null;
  actorName?: string;
  category: ActivityCategory;
  action: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
}): Promise<ActivityLog> {
  try {
    await connectToDatabase();
    const doc = await ActivityLogModel.create({
      restaurantId: optionalRef(data.restaurantId),
      branchId: optionalRef(data.branchId),
      userId: optionalRef(data.userId),
      actorName: data.actorName ?? "",
      category: data.category,
      action: data.action,
      title: data.title,
      message: data.message,
      entityType: data.entityType ?? "",
      entityId: data.entityId ?? null,
      metadata: data.metadata ?? {},
      createdBy: optionalRef(data.createdBy),
    });
    return serializeActivity(doc);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to create activity log");
  }
}

async function findActivities(
  restaurantId: string | null,
  input: SearchActivityInput
): Promise<ActivityListResult> {
  try {
    await connectToDatabase();
    const pagination = normalizePagination({
      page: input.page,
      pageSize: input.pageSize,
    });
    const skip = (pagination.page - 1) * pagination.pageSize;
    const filter: Filter = notDeletedFilter({});
    if (restaurantId && isValidObjectId(restaurantId)) {
      filter.restaurantId = toObjectId(restaurantId);
    }
    if (input.category && input.category !== "all") {
      filter.category = input.category;
    }

    const created: Filter = {};
    if (input.dateFrom) {
      const from = parseDate(input.dateFrom);
      if (from) created.$gte = from;
    }
    if (input.dateTo) {
      const to = parseDate(input.dateTo);
      if (to) {
        to.setHours(23, 59, 59, 999);
        created.$lte = to;
      }
    }
    if (Object.keys(created).length) filter.createdAt = created;

    const q = input.q?.trim();
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: regex }, { message: regex }, { action: regex }];
    }

    const [docs, total] = await Promise.all([
      ActivityLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.pageSize)
        .lean(),
      ActivityLogModel.countDocuments(filter),
    ]);

    return {
      items: docs.map((doc) =>
        serializeActivity(
          doc as unknown as Parameters<typeof serializeActivity>[0]
        )
      ),
      meta: buildPaginationMeta(
        total,
        pagination.page,
        pagination.pageSize
      ),
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to list activity");
  }
}

async function createSystemEvent(data: {
  restaurantId?: string | null;
  branchId?: string | null;
  userId?: string | null;
  eventType: SystemEventType;
  source?: string;
  payload?: Record<string, unknown>;
}): Promise<SystemEvent> {
  try {
    await connectToDatabase();
    const doc = await SystemEventModel.create({
      restaurantId: optionalRef(data.restaurantId),
      branchId: optionalRef(data.branchId),
      userId: optionalRef(data.userId),
      eventType: data.eventType,
      source: data.source ?? "system",
      payload: data.payload ?? {},
      processed: false,
    });
    return serializeSystemEvent(doc);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to create system event");
  }
}

export const notificationRepository = {
  createNotification,
  findNotifications,
  getUnreadCount,
  getCenterSummary,
  markAsRead,
  markAllRead,
  updateStatus,
  getOrCreatePreference,
  updatePreference,
  createAnnouncement,
  findAnnouncements,
  createActivity,
  findActivities,
  createSystemEvent,
};
