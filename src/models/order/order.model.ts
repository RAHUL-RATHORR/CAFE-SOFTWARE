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
 * Restaurant order model — tenant-scoped order management.
 */
const orderLineItemSchema = new Schema(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 999,
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      min: 0,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 255,
      default: "",
    },
  },
  { _id: false }
);

const orderStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ],
      required: true,
    },
    changedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 255,
      default: "",
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantTable",
      default: null,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    orderType: {
      type: String,
      enum: ["dine-in", "take-away", "delivery"],
      required: true,
      default: "dine-in",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ],
      required: true,
      default: "pending",
      index: true,
    },
    items: {
      type: [orderLineItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partially-paid", "paid", "refunded"],
      required: true,
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["none", "cash", "card", "upi", "wallet", "other"],
      required: true,
      default: "none",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      required: true,
      default: "normal",
      index: true,
    },
    assignedChefId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    kitchenNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    statusHistory: {
      type: [orderStatusHistorySchema],
      default: [],
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "orders",
  }
);

orderSchema.index(
  { restaurantId: 1, orderNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);
orderSchema.index({ restaurantId: 1, status: 1, isDeleted: 1 });
orderSchema.index({ restaurantId: 1, orderType: 1 });
orderSchema.index({ restaurantId: 1, paymentStatus: 1 });
orderSchema.index({ restaurantId: 1, priority: 1, status: 1 });
orderSchema.index({ restaurantId: 1, tableId: 1 });
orderSchema.index({ restaurantId: 1, customerId: 1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const OrderModel: Model<OrderDocument> =
  models.Order ?? model<OrderDocument>("Order", orderSchema);
