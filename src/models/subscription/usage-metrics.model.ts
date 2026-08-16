import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";

const usageMetricsSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    periodKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 7,
      index: true,
    },
    users: { type: Number, min: 0, default: 0 },
    branches: { type: Number, min: 0, default: 0 },
    orders: { type: Number, min: 0, default: 0 },
    storage: { type: Number, min: 0, default: 0 },
    apiRequests: { type: Number, min: 0, default: 0 },
    menuItems: { type: Number, min: 0, default: 0 },
    customers: { type: Number, min: 0, default: 0 },
    inventoryItems: { type: Number, min: 0, default: 0 },
    tables: { type: Number, min: 0, default: 0 },
  }),
  baseSchemaOptions
);

usageMetricsSchema.index(
  { restaurantId: 1, periodKey: 1, isDeleted: 1 },
  { unique: true }
);

export type UsageMetricsDocument = InferSchemaType<typeof usageMetricsSchema> & {
  _id: Schema.Types.ObjectId;
};

export const UsageMetricsModel: Model<UsageMetricsDocument> =
  models.UsageMetrics ||
  model<UsageMetricsDocument>("UsageMetrics", usageMetricsSchema);
