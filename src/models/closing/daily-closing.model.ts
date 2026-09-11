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

const dailyClosingSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    businessDate: {
      type: Date,
      required: true,
      index: true,
    },
    openedAt: {
      type: Date,
      required: true,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    totalOrders: { type: Number, min: 0, default: 0 },
    grossSales: { type: Number, min: 0, default: 0 },
    discounts: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    netSales: { type: Number, min: 0, default: 0 },
    cashExpected: { type: Number, min: 0, default: 0 },
    cashActual: { type: Number, min: 0, default: 0 },
    cashDifference: { type: Number, default: 0 },
    upiAmount: { type: Number, min: 0, default: 0 },
    cardAmount: { type: Number, min: 0, default: 0 },
    otherAmount: { type: Number, min: 0, default: 0 },
    refundAmount: { type: Number, min: 0, default: 0 },
    cancelledOrderCount: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      required: true,
      default: "OPEN",
      index: true,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "daily_closings",
  }
);

dailyClosingSchema.index(
  { restaurantId: 1, branchId: 1, businessDate: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

dailyClosingSchema.index({ restaurantId: 1, branchId: 1, status: 1 });
dailyClosingSchema.index({ restaurantId: 1, businessDate: -1 });

export type DailyClosingDocument = InferSchemaType<typeof dailyClosingSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const DailyClosingModel: Model<DailyClosingDocument> =
  models.DailyClosing ?? model<DailyClosingDocument>("DailyClosing", dailyClosingSchema);
