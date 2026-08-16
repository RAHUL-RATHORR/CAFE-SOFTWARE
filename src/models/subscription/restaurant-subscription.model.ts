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
  SAAS_SUBSCRIPTION_STATUSES,
  BILLING_CYCLES,
  PAYMENT_PROVIDER_STATUSES,
} from "@/types/subscription";

const pendingPlanChangeSchema = new Schema(
  {
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", default: null },
    mode: { type: String, enum: ["upgrade", "downgrade"], required: true },
    billingCycle: { type: String, enum: BILLING_CYCLES, default: null },
    scheduledFor: { type: Date, default: null },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { _id: false }
);

const restaurantSubscriptionSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    planId: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: SAAS_SUBSCRIPTION_STATUSES,
      default: "trialing",
      index: true,
    },
    billingCycle: {
      type: String,
      enum: BILLING_CYCLES,
      default: "monthly",
    },
    trialStart: { type: Date, default: null },
    trialEnd: { type: Date, default: null },
    subscriptionStart: { type: Date, default: null },
    subscriptionEnd: { type: Date, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    gracePeriodEnd: { type: Date, default: null },
    renewalDate: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    pendingPlanChange: { type: pendingPlanChangeSchema, default: null },
    provider: { type: String, trim: true, maxlength: 40, default: null },
    providerSubscriptionId: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_PROVIDER_STATUSES,
      default: "not_configured",
    },
    licenseKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
      index: true,
    },
  }),
  baseSchemaOptions
);

restaurantSubscriptionSchema.index(
  { restaurantId: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export type RestaurantSubscriptionDocument = InferSchemaType<
  typeof restaurantSubscriptionSchema
> & { _id: Schema.Types.ObjectId };

export const RestaurantSubscriptionModel: Model<RestaurantSubscriptionDocument> =
  models.RestaurantSubscription ||
  model<RestaurantSubscriptionDocument>(
    "RestaurantSubscription",
    restaurantSubscriptionSchema
  );
