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

const paymentSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    billId: {
      type: Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["cash", "card", "upi", "wallet", "bank-transfer", "multiple"],
      required: true,
      default: "cash",
    },
    status: {
      type: String,
      enum: ["completed", "pending", "failed", "refunded"],
      required: true,
      default: "completed",
      index: true,
    },
    reference: { type: String, trim: true, maxlength: 120, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    refundAmount: { type: Number, min: 0, default: 0 },
    refundedAt: { type: Date, default: null },
  }),
  {
    ...baseSchemaOptions,
    collection: "payments",
  }
);

paymentSchema.index({ restaurantId: 1, billId: 1, createdAt: -1 });
paymentSchema.index({ restaurantId: 1, status: 1 });
paymentSchema.index({ restaurantId: 1, method: 1 });

export type PaymentDocument = InferSchemaType<typeof paymentSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PaymentModel: Model<PaymentDocument> =
  models.Payment ?? model<PaymentDocument>("Payment", paymentSchema);
