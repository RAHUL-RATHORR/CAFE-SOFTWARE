import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";

/**
 * Immutable Stock Movement Model — Audit ledger of all stock mutations.
 */
const stockMovementSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    ingredientId: {
      type: Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: [
        "OPENING_STOCK",
        "PURCHASE",
        "CONSUMPTION",
        "ADJUSTMENT_ADD",
        "ADJUSTMENT_REMOVE",
        "ADJUSTMENT_SET",
        "WASTE",
        "RETURN",
        "REVERSAL",
      ],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    normalizedQuantity: {
      type: Number,
      required: true,
    },
    beforeStock: {
      type: Number,
      required: true,
    },
    afterStock: {
      type: Number,
      required: true,
    },
    costPerUnit: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    referenceType: {
      type: String,
      enum: ["order", "purchase", "manual", "waste", "opening", "adjustment"],
      default: "manual",
    },
    referenceId: {
      type: String,
      default: null,
      index: true,
    },
    referenceKey: {
      type: String,
      default: null,
      index: true,
    },
    reason: {
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "stock_movements",
  }
);

stockMovementSchema.index({
  restaurantId: 1,
  branchId: 1,
  ingredientId: 1,
  createdAt: -1,
});
stockMovementSchema.index({
  restaurantId: 1,
  referenceKey: 1,
});
stockMovementSchema.index({
  restaurantId: 1,
  branchId: 1,
  movementType: 1,
  createdAt: -1,
});

export type StockMovementDocument = InferSchemaType<
  typeof stockMovementSchema
> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
};

export const StockMovementModel: Model<StockMovementDocument> =
  models.StockMovement ||
  model<StockMovementDocument>("StockMovement", stockMovementSchema);
