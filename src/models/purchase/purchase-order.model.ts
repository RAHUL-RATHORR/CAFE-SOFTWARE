import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";

const purchaseItemSchema = new Schema(
  {
    ingredientId: {
      type: Schema.Types.ObjectId,
      ref: "Ingredient",
      default: null,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    quantity: { type: Number, required: true, min: 0.001, max: 999999 },
    unit: {
      type: String,
      enum: ["kg", "g", "liter", "ml", "piece", "box", "dozen", "pack"],
      default: "piece",
    },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    quantityReceived: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const purchaseStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "approved",
        "ordered",
        "partially-received",
        "received",
        "cancelled",
      ],
      required: true,
    },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, trim: true, maxlength: 255, default: "" },
  },
  { _id: false }
);

const goodsReceiptSchema = new Schema(
  {
    grnNumber: { type: String, trim: true, maxlength: 40, default: null },
    qualityCheckStatus: {
      type: String,
      enum: ["pending", "passed", "failed", "skipped"],
      default: "pending",
    },
    inventoryUpdatePending: { type: Boolean, default: false },
    inventoryUpdatePlaceholder: { type: Boolean, default: true },
    receivedNotes: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
      index: true,
    },
    purchaseNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "approved",
        "ordered",
        "partially-received",
        "received",
        "cancelled",
      ],
      default: "draft",
      index: true,
    },
    items: { type: [purchaseItemSchema], default: [] },
    subtotal: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    shippingCost: { type: Number, min: 0, default: 0 },
    grandTotal: { type: Number, min: 0, default: 0 },
    expectedDelivery: { type: Date, default: null },
    receivedDate: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    statusHistory: { type: [purchaseStatusHistorySchema], default: [] },
    goodsReceipt: {
      type: goodsReceiptSchema,
      default: () => ({
        grnNumber: null,
        qualityCheckStatus: "pending",
        inventoryUpdatePending: false,
        inventoryUpdatePlaceholder: true,
        receivedNotes: "",
      }),
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  }),
  baseSchemaOptions
);

purchaseOrderSchema.index(
  { restaurantId: 1, purchaseNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } },
  }
);
purchaseOrderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
purchaseOrderSchema.index({ restaurantId: 1, vendorId: 1, createdAt: -1 });

export type PurchaseOrderDocument = InferSchemaType<
  typeof purchaseOrderSchema
> & {
  _id: Schema.Types.ObjectId;
};

export const PurchaseOrderModel: Model<PurchaseOrderDocument> =
  (models.PurchaseOrder as Model<PurchaseOrderDocument>) ||
  model<PurchaseOrderDocument>("PurchaseOrder", purchaseOrderSchema);
