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
 * Ingredient model — inventory foundation for purchase line items.
 * Stock mutations are placeholders until inventory module lands.
 */
const ingredientSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    ingredientCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    unit: {
      type: String,
      enum: ["kg", "g", "liter", "ml", "piece", "box", "dozen", "pack"],
      default: "piece",
    },
    currentStock: { type: Number, min: 0, default: 0 },
    reorderLevel: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  }),
  baseSchemaOptions
);

ingredientSchema.index(
  { restaurantId: 1, ingredientCode: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } },
  }
);
ingredientSchema.index({ restaurantId: 1, name: 1, isDeleted: 1 });

export type IngredientDocument = InferSchemaType<typeof ingredientSchema> & {
  _id: Schema.Types.ObjectId;
};

export const IngredientModel: Model<IngredientDocument> =
  (models.Ingredient as Model<IngredientDocument>) ||
  model<IngredientDocument>("Ingredient", ingredientSchema);
