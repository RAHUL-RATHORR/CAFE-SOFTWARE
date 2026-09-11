import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";

const recipeIngredientSchema = new Schema(
  {
    ingredientId: {
      type: Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.0001,
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
      required: true,
    },
    wastagePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false }
);

/**
 * Recipe / Bill of Materials (BOM) Model
 * Connects menu items, variants, and add-on options to raw ingredients.
 */
const recipeSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
      index: true,
    },
    variantId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    addonOptionId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    ingredients: {
      type: [recipeIngredientSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
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
    collection: "recipes",
  }
);

recipeSchema.index({
  restaurantId: 1,
  menuItemId: 1,
  variantId: 1,
  addonOptionId: 1,
  isDeleted: 1,
});
recipeSchema.index({ restaurantId: 1, isDeleted: 1 });
recipeSchema.index({ restaurantId: 1, branchId: 1, isDeleted: 1 });

export type RecipeDocument = InferSchemaType<typeof recipeSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const RecipeModel: Model<RecipeDocument> =
  models.Recipe || model<RecipeDocument>("Recipe", recipeSchema);
