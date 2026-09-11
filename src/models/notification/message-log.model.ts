import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";

export const NOTIFICATION_CHANNELS = ["WHATSAPP", "EMAIL", "SMS"] as const;
export const OUTBOUND_STATUSES = ["QUEUED", "PROCESSING", "SENT", "FAILED", "CANCELLED"] as const;
export const NOTIFICATION_EVENT_TYPES = [
  "ORDER_RECEIVED",
  "ORDER_CONFIRMED",
  "ORDER_PREPARING",
  "ORDER_READY",
  "ORDER_SERVED",
  "ORDER_CANCELLED",
  "PAYMENT_SUCCESS",
  "PAYMENT_PENDING",
  "PAYMENT_FAILED",
  "PAYMENT_REFUNDED",
  "INVOICE_GENERATED",
  "LOW_STOCK",
  "DAILY_CLOSING_COMPLETED",
  "TEST_MESSAGE"
] as const;

const messageLogSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    referenceKey: { type: String, trim: true, index: true }, // For idempotency e.g. ORDER_CONFIRMED:1045:WHATSAPP
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
      index: true,
    },
    recipient: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, default: "" },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "NotificationTemplate",
      default: null,
    },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: OUTBOUND_STATUSES,
      default: "QUEUED",
      index: true,
    },
    provider: { type: String, trim: true, default: "system" },
    providerMessageId: { type: String, trim: true, default: null },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    errorCode: { type: String, trim: true, default: null },
    errorMessage: { type: String, trim: true, default: null },
  }),
  baseSchemaOptions
);

messageLogSchema.index({ restaurantId: 1, createdAt: -1 });
messageLogSchema.index({ restaurantId: 1, branchId: 1, createdAt: -1 });

export type MessageLogDocument = InferSchemaType<typeof messageLogSchema> & {
  _id: Schema.Types.ObjectId;
};

export const MessageLogModel: Model<MessageLogDocument> =
  models.MessageLog || model<MessageLogDocument>("MessageLog", messageLogSchema);
