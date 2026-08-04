import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";
import { SAAS_FEATURE_KEYS } from "@/types/subscription";

const featureAccessSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    features: {
      type: [String],
      enum: SAAS_FEATURE_KEYS,
      default: [],
    },
    overrides: {
      type: Map,
      of: Boolean,
      default: {},
    },
  }),
  baseSchemaOptions
);

featureAccessSchema.index(
  { restaurantId: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export type FeatureAccessDocument = InferSchemaType<
  typeof featureAccessSchema
> & { _id: Schema.Types.ObjectId };

export const FeatureAccessModel: Model<FeatureAccessDocument> =
  models.FeatureAccess ||
  model<FeatureAccessDocument>("FeatureAccess", featureAccessSchema);
