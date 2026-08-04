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
 * Menu category model — tenant-scoped with optional branch scope.
 */
const categorySchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
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
      maxlength: 500,
      default: "",
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    color: {
      type: String,
      trim: true,
      default: "#2563EB",
      maxlength: 32,
    },
    icon: {
      type: String,
      trim: true,
      default: "",
      maxlength: 64,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "categories",
  }
);

categorySchema.index(
  { restaurantId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);
categorySchema.index({ restaurantId: 1, displayOrder: 1 });
categorySchema.index({ restaurantId: 1, isDeleted: 1, isActive: 1 });
categorySchema.index({ restaurantId: 1, createdAt: -1 });

export type CategoryDocument = InferSchemaType<typeof categorySchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CategoryModel: Model<CategoryDocument> =
  models.Category ?? model<CategoryDocument>("Category", categorySchema);
