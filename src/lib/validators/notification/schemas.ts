import { z } from "zod";
import {
  ACTIVITY_CATEGORIES,
  ANNOUNCEMENT_SCOPES,
  ANNOUNCEMENT_STATUSES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  SYSTEM_EVENT_TYPES,
} from "@/types/notification";

const optionalObjectId = z.preprocess(
  (value) => {
    if (value === "" || value === undefined) return null;
    return value;
  },
  z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid id")
    .nullable()
    .optional()
);

const optionalDate = z.preprocess(
  (value) => {
    if (value === "" || value == null) return null;
    return value;
  },
  z.string().trim().nullable().optional()
);

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export const notificationCategorySchema = z.enum(NOTIFICATION_CATEGORIES);
export const notificationPrioritySchema = z.enum(NOTIFICATION_PRIORITIES);
export const notificationStatusSchema = z.enum(NOTIFICATION_STATUSES);
export const systemEventTypeSchema = z.enum(SYSTEM_EVENT_TYPES);
export const announcementScopeSchema = z.enum(ANNOUNCEMENT_SCOPES);
export const announcementStatusSchema = z.enum(ANNOUNCEMENT_STATUSES);
export const activityCategorySchema = z.enum(ACTIVITY_CATEGORIES);

export const createNotificationSchema = z.object({
  restaurantId: optionalObjectId,
  branchId: optionalObjectId,
  userId: optionalObjectId,
  title: z.string().trim().min(1, "Title is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(2000),
  type: notificationTypeSchema.default("info"),
  category: notificationCategorySchema.default("system"),
  priority: notificationPrioritySchema.default("normal"),
  icon: z.string().trim().max(80).optional().or(z.literal("")),
  actionUrl: z.string().trim().max(500).optional().or(z.literal("")),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const searchNotificationSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  type: notificationTypeSchema.or(z.literal("all")).default("all"),
  category: notificationCategorySchema.or(z.literal("all")).default("all"),
  priority: notificationPrioritySchema.or(z.literal("all")).default("all"),
  status: notificationStatusSchema.or(z.literal("all")).default("all"),
  branchId: optionalObjectId,
  userId: optionalObjectId,
  dateFrom: optionalDate,
  dateTo: optionalDate,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["createdAt", "priority", "status", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  historyOnly: z.coerce.boolean().optional().default(false),
});

export const updateNotificationStatusSchema = z.object({
  id: z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid id"),
  status: notificationStatusSchema,
});

export const markNotificationsSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional(),
  markAll: z.boolean().optional().default(false),
});

export const channelPrefsSchema = z.object({
  inApp: z.boolean().default(true),
  email: z.boolean().default(false),
  sms: z.boolean().default(false),
  push: z.boolean().default(false),
  whatsapp: z.boolean().default(false),
});

export const updatePreferenceSchema = z.object({
  channels: channelPrefsSchema.partial().optional(),
  categories: z
    .record(notificationCategorySchema, z.boolean())
    .optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM")
    .optional(),
  quietHoursEnd: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM")
    .optional(),
});

export const createAnnouncementSchema = z.object({
  restaurantId: optionalObjectId,
  branchId: optionalObjectId,
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  scope: announcementScopeSchema.default("restaurant"),
  status: announcementStatusSchema.default("draft"),
  priority: notificationPrioritySchema.default("normal"),
  startsAt: optionalDate,
  endsAt: optionalDate,
});

export const searchAnnouncementSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  scope: announcementScopeSchema.or(z.literal("all")).default("all"),
  status: announcementStatusSchema.or(z.literal("all")).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchActivitySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  category: activityCategorySchema.or(z.literal("all")).default("all"),
  dateFrom: optionalDate,
  dateTo: optionalDate,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const emitSystemEventSchema = z.object({
  eventType: systemEventTypeSchema,
  restaurantId: optionalObjectId,
  branchId: optionalObjectId,
  userId: optionalObjectId,
  source: z.string().trim().max(80).default("system"),
  payload: z.record(z.string(), z.unknown()).optional(),
  title: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
  createNotification: z.boolean().optional().default(true),
  createActivity: z.boolean().optional().default(true),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type SearchNotificationInput = z.infer<typeof searchNotificationSchema>;
export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type SearchAnnouncementInput = z.infer<typeof searchAnnouncementSchema>;
export type SearchActivityInput = z.infer<typeof searchActivitySchema>;
export type EmitSystemEventInput = z.infer<typeof emitSystemEventSchema>;
