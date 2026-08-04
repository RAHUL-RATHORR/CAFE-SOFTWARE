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

const billLineItemSchema = new Schema(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      default: null,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    price: { type: Number, required: true, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 1, max: 999 },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, trim: true, maxlength: 255, default: "" },
    modifiers: { type: [String], default: [] },
  },
  { _id: false }
);

const billSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    items: { type: [billLineItemSchema], default: [] },
    subtotal: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    discountConfig: {
      kind: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "fixed",
      },
      value: { type: Number, min: 0, default: 0 },
      amount: { type: Number, min: 0, default: 0 },
      couponCode: { type: String, trim: true, maxlength: 64, default: "" },
    },
    tax: { type: Number, required: true, min: 0, default: 0 },
    taxConfig: {
      kind: {
        type: String,
        enum: ["gst", "vat", "custom"],
        default: "gst",
      },
      label: { type: String, trim: true, maxlength: 64, default: "GST" },
      rate: { type: Number, min: 0, default: 5 },
      amount: { type: Number, min: 0, default: 0 },
    },
    serviceCharge: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0, default: 0 },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "partially-paid", "refunded", "failed"],
      required: true,
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "wallet", "bank-transfer", "multiple"],
      required: true,
      default: "cash",
    },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    cashierId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    splitConfig: {
      type: {
        enabled: { type: Boolean, default: false },
        mode: {
          type: String,
          enum: ["by-item", "equal", "custom", null],
          default: null,
        },
        parties: {
          type: [
            {
              label: String,
              amount: Number,
              itemIndexes: [Number],
            },
          ],
          default: [],
        },
      },
      default: () => ({ enabled: false, mode: null, parties: [] }),
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "bills",
  }
);

billSchema.index(
  { restaurantId: 1, invoiceNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
billSchema.index({ restaurantId: 1, paymentStatus: 1, isDeleted: 1 });
billSchema.index({ restaurantId: 1, orderId: 1 });
billSchema.index({ restaurantId: 1, createdAt: -1 });

export type BillDocument = InferSchemaType<typeof billSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BillModel: Model<BillDocument> =
  models.Bill ?? model<BillDocument>("Bill", billSchema);
