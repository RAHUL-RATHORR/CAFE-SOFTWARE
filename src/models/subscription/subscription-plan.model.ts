import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { SAAS_FEATURE_KEYS } from "@/types/subscription";

const subscriptionPlanSchema = new Schema(
  withBaseFields({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 80,
      index: true,
    },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    monthlyPrice: { type: Number, required: true, min: 0, default: 0 },
    yearlyPrice: { type: Number, required: true, min: 0, default: 0 },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 3,
      default: "USD",
    },
    trialDays: { type: Number, min: 0, max: 365, default: 14 },
    maxBranches: { type: Number, min: 0, default: 1 },
    maxUsers: { type: Number, min: 0, default: 3 },
    maxOrdersPerMonth: { type: Number, min: 0, default: 200 },
    maxMenuItems: { type: Number, min: 0, default: 50 },
    maxTables: { type: Number, min: 0, default: 10 },
    storageLimit: { type: Number, min: 0, default: 500 },
    features: {
      type: [String],
      enum: SAAS_FEATURE_KEYS,
      default: [],
    },
    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 100, index: true },
  }),
  baseSchemaOptions
);

subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });

export type SubscriptionPlanDocument = InferSchemaType<
  typeof subscriptionPlanSchema
> & { _id: Schema.Types.ObjectId };

export const SubscriptionPlanModel: Model<SubscriptionPlanDocument> =
  models.SubscriptionPlan ||
  model<SubscriptionPlanDocument>("SubscriptionPlan", subscriptionPlanSchema);
