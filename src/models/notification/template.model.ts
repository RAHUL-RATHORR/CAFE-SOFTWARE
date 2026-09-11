import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";
import { NOTIFICATION_CHANNELS, NOTIFICATION_EVENT_TYPES } from "./message-log.model";

const notificationTemplateSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    templateKey: { type: String, required: true, trim: true, index: true },
    channel: {
      type: String,
      enum: NOTIFICATION_CHANNELS,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: NOTIFICATION_EVENT_TYPES,
      required: true,
    },
    language: { type: String, default: "en", trim: true },
    subject: { type: String, trim: true, default: "" }, // Mainly for email
    body: { type: String, required: true }, // The actual template string
    variables: [{ type: String, trim: true }], // e.g. ["customerName", "orderNumber"]
    isActive: { type: Boolean, default: true },
  }),
  baseSchemaOptions
);

notificationTemplateSchema.index(
  { restaurantId: 1, templateKey: 1, channel: 1, language: 1 },
  { unique: true }
);

export type NotificationTemplateDocument = InferSchemaType<typeof notificationTemplateSchema> & {
  _id: Schema.Types.ObjectId;
};

export const NotificationTemplateModel: Model<NotificationTemplateDocument> =
  models.NotificationTemplate || model<NotificationTemplateDocument>("NotificationTemplate", notificationTemplateSchema);
