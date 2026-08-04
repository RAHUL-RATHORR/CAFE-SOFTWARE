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
} from "@/types/subscription";

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
      default: "trial",
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
    renewalDate: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
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
