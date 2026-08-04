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
  BILLING_CYCLES,
  INVOICE_FOUNDATION_STATUSES,
} from "@/types/subscription";

const invoiceFoundationSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantSubscription",
      default: null,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      default: null,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
      index: true,
    },
    amount: { type: Number, required: true, min: 0, default: 0 },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 3,
      default: "USD",
    },
    status: {
      type: String,
      enum: INVOICE_FOUNDATION_STATUSES,
      default: "draft",
      index: true,
    },
    billingCycle: {
      type: String,
      enum: BILLING_CYCLES,
      default: "monthly",
    },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    paymentPlaceholder: { type: String, trim: true, default: "" },
    refundPlaceholder: { type: String, trim: true, default: "" },
    couponPlaceholder: { type: String, trim: true, default: "" },
    taxPlaceholder: { type: Number, min: 0, default: 0 },
    issuedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  }),
  baseSchemaOptions
);

invoiceFoundationSchema.index({ restaurantId: 1, createdAt: -1 });

export type InvoiceFoundationDocument = InferSchemaType<
  typeof invoiceFoundationSchema
> & { _id: Schema.Types.ObjectId };

export const InvoiceFoundationModel: Model<InvoiceFoundationDocument> =
  models.InvoiceFoundation ||
  model<InvoiceFoundationDocument>(
    "InvoiceFoundation",
    invoiceFoundationSchema
  );
