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
 * Menu item model — tenant-scoped with category assignment.
 */
const menuItemSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
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
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 240,
      default: "",
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 64,
      default: "",
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    /** Gallery placeholder — no cloud upload yet */
    gallery: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    taxRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    preparationTime: {
      type: Number,
      min: 0,
      default: 0,
    },
    calories: {
      type: Number,
      min: 0,
      default: null,
    },
    isVeg: {
      type: Boolean,
      default: true,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "menu_items",
  }
);

menuItemSchema.index(
  { restaurantId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);
menuItemSchema.index(
  { restaurantId: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      sku: { $type: "string", $gt: "" },
    },
  }
);
menuItemSchema.index({ restaurantId: 1, categoryId: 1, isDeleted: 1 });
menuItemSchema.index({ restaurantId: 1, isAvailable: 1, isFeatured: 1 });
menuItemSchema.index({ restaurantId: 1, displayOrder: 1 });
menuItemSchema.index({ restaurantId: 1, createdAt: -1 });

export type MenuItemDocument = InferSchemaType<typeof menuItemSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const MenuItemModel: Model<MenuItemDocument> =
  models.MenuItem ?? model<MenuItemDocument>("MenuItem", menuItemSchema);
