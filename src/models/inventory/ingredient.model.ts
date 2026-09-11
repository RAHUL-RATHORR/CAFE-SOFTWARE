import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";

/**
 * Ingredient / Raw Material Model — Tenant & branch scoped restaurant inventory item.
 */
const ingredientSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 64,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 64,
      default: "General",
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    unit: {
      type: String,
      enum: [
        "kg",
        "g",
        "liter",
        "ml",
        "piece",
        "packet",
        "box",
        "bottle",
      ],
      default: "kg",
    },
    currentStock: {
      type: Number,
      default: 0,
      // No min:0 constraint so policy can allow negative stock when enabled
    },
    minimumStock: {
      type: Number,
      min: 0,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      min: 0,
      default: 0,
    },
    maximumStock: {
      type: Number,
      min: 0,
      default: null,
    },
    costPerUnit: {
      type: Number,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      default: "active",
      index: true,
    },
    allowNegativeStock: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "ingredients",
  }
);

ingredientSchema.index(
  { restaurantId: 1, branchId: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);
ingredientSchema.index({ restaurantId: 1, branchId: 1, isDeleted: 1 });
ingredientSchema.index({ restaurantId: 1, branchId: 1, category: 1 });
ingredientSchema.index({ restaurantId: 1, branchId: 1, name: 1 });

export type IngredientDocument = InferSchemaType<typeof ingredientSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const IngredientModel: Model<IngredientDocument> =
  models.Ingredient || model<IngredientDocument>("Ingredient", ingredientSchema);
