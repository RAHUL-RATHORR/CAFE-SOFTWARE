import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import {
  baseSchemaOptions,
  withBaseFields,
} from "@/models/base";
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
} from "@/models/shared";

const restaurantSchema = new Schema(
  withBaseFields({
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    logo: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 3,
      default: "USD",
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
      default: "UTC",
    },
    subscriptionPlan: {
      type: String,
      enum: [...SUBSCRIPTION_PLANS],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: [...SUBSCRIPTION_STATUSES],
      default: "trialing",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "restaurants",
  }
);

restaurantSchema.index({ email: 1 });
restaurantSchema.index({ isActive: 1 });
restaurantSchema.index({ isDeleted: 1, isActive: 1 });

export type RestaurantDocument = InferSchemaType<typeof restaurantSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const RestaurantModel: Model<RestaurantDocument> =
  models.Restaurant ??
  model<RestaurantDocument>("Restaurant", restaurantSchema);
