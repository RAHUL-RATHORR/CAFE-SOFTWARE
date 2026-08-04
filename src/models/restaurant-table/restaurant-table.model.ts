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
import { tenantScopeDefinition } from "@/models/shared";

/**
 * Restaurant dining table model — tenant-scoped seating foundation.
 */
const restaurantTableSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    floorId: {
      type: Schema.Types.ObjectId,
      ref: "Floor",
      default: null,
      index: true,
    },
    tableNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },
    tableName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    shape: {
      type: String,
      enum: ["round", "square", "rectangle", "oval", "custom"],
      default: "square",
    },
    status: {
      type: String,
      enum: [
        "available",
        "reserved",
        "occupied",
        "cleaning",
        "out-of-service",
      ],
      default: "available",
      index: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    /** QR payload placeholder — no real QR generation yet */
    qrCodePlaceholder: {
      type: String,
      trim: true,
      maxlength: 255,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "restaurant_tables",
  }
);

restaurantTableSchema.index(
  { restaurantId: 1, tableNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);
restaurantTableSchema.index({ restaurantId: 1, status: 1, isDeleted: 1 });
restaurantTableSchema.index({ restaurantId: 1, floorId: 1 });
restaurantTableSchema.index({ restaurantId: 1, displayOrder: 1 });
restaurantTableSchema.index({ restaurantId: 1, createdAt: -1 });

export type RestaurantTableDocument = InferSchemaType<
  typeof restaurantTableSchema
> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const RestaurantTableModel: Model<RestaurantTableDocument> =
  models.RestaurantTable ??
  model<RestaurantTableDocument>("RestaurantTable", restaurantTableSchema);
