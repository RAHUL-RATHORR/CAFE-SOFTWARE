import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";
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

/* ------------------------------------------------------------------ */
/* Notification                                                         */
/* ------------------------------------------------------------------ */

const notificationSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: "info",
      index: true,
    },
    category: {
      type: String,
      enum: NOTIFICATION_CATEGORIES,
      default: "system",
      index: true,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: "normal",
      index: true,
    },
    status: {
      type: String,
      enum: NOTIFICATION_STATUSES,
      default: "unread",
      index: true,
    },
    icon: { type: String, trim: true, maxlength: 80, default: "" },
    actionUrl: { type: String, trim: true, maxlength: 500, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  }),
  baseSchemaOptions
);

notificationSchema.index({ restaurantId: 1, userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: Schema.Types.ObjectId;
};

export const NotificationModel: Model<NotificationDocument> =
  models.Notification ||
  model<NotificationDocument>("Notification", notificationSchema);

/* ------------------------------------------------------------------ */
/* NotificationPreference                                               */
/* ------------------------------------------------------------------ */

const channelPrefsSchema = new Schema(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
  },
  { _id: false }
);

const notificationPreferenceSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    channels: { type: channelPrefsSchema, default: () => ({}) },
    categories: { type: Schema.Types.Mixed, default: {} },
    quietHoursEnabled: { type: Boolean, default: false },
    quietHoursStart: { type: String, trim: true, default: "22:00" },
    quietHoursEnd: { type: String, trim: true, default: "07:00" },
  }),
  baseSchemaOptions
);

notificationPreferenceSchema.index(
  { restaurantId: 1, userId: 1 },
  { unique: true }
);

export type NotificationPreferenceDocument = InferSchemaType<
  typeof notificationPreferenceSchema
> & { _id: Schema.Types.ObjectId };

export const NotificationPreferenceModel: Model<NotificationPreferenceDocument> =
  models.NotificationPreference ||
  model<NotificationPreferenceDocument>(
    "NotificationPreference",
    notificationPreferenceSchema
  );

/* ------------------------------------------------------------------ */
/* Announcement                                                         */
/* ------------------------------------------------------------------ */

const announcementSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    scope: {
      type: String,
      enum: ANNOUNCEMENT_SCOPES,
      default: "restaurant",
      index: true,
    },
    status: {
      type: String,
      enum: ANNOUNCEMENT_STATUSES,
      default: "draft",
      index: true,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITIES,
      default: "normal",
      index: true,
    },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  }),
  baseSchemaOptions
);

announcementSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

export type AnnouncementDocument = InferSchemaType<typeof announcementSchema> & {
  _id: Schema.Types.ObjectId;
};

export const AnnouncementModel: Model<AnnouncementDocument> =
  models.Announcement ||
  model<AnnouncementDocument>("Announcement", announcementSchema);

/* ------------------------------------------------------------------ */
/* ActivityLog                                                          */
/* ------------------------------------------------------------------ */

const activityLogSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    actorName: { type: String, trim: true, maxlength: 160, default: "" },
    category: {
      type: String,
      enum: ACTIVITY_CATEGORIES,
      default: "system",
      index: true,
    },
    action: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    entityType: { type: String, trim: true, maxlength: 80, default: "" },
    entityId: { type: String, trim: true, maxlength: 80, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  }),
  baseSchemaOptions
);

activityLogSchema.index({ restaurantId: 1, category: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

export type ActivityLogDocument = InferSchemaType<typeof activityLogSchema> & {
  _id: Schema.Types.ObjectId;
};

export const ActivityLogModel: Model<ActivityLogDocument> =
  models.ActivityLog ||
  model<ActivityLogDocument>("ActivityLog", activityLogSchema);

/* ------------------------------------------------------------------ */
/* SystemEvent                                                          */
/* ------------------------------------------------------------------ */

const systemEventSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    eventType: {
      type: String,
      enum: SYSTEM_EVENT_TYPES,
      required: true,
      index: true,
    },
    source: { type: String, trim: true, maxlength: 80, default: "system" },
    payload: { type: Schema.Types.Mixed, default: {} },
    processed: { type: Boolean, default: false, index: true },
  }),
  baseSchemaOptions
);

systemEventSchema.index({ eventType: 1, createdAt: -1 });
systemEventSchema.index({ restaurantId: 1, createdAt: -1 });

export type SystemEventDocument = InferSchemaType<typeof systemEventSchema> & {
  _id: Schema.Types.ObjectId;
};

export const SystemEventModel: Model<SystemEventDocument> =
  models.SystemEvent ||
  model<SystemEventDocument>("SystemEvent", systemEventSchema);
