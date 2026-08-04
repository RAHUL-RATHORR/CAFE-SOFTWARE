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
 * Leave request foundation — approval / balance placeholders.
 */
const leaveRequestSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: ["casual", "sick", "earned", "unpaid", "other"],
      default: "casual",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, min: 0.5, default: 1 },
    reason: { type: String, trim: true, maxlength: 500, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    approvalNote: { type: String, trim: true, maxlength: 255, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  }),
  baseSchemaOptions
);

leaveRequestSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

export type LeaveRequestDocument = InferSchemaType<
  typeof leaveRequestSchema
> & {
  _id: Schema.Types.ObjectId;
};

export const LeaveRequestModel: Model<LeaveRequestDocument> =
  (models.LeaveRequest as Model<LeaveRequestDocument>) ||
  model<LeaveRequestDocument>("LeaveRequest", leaveRequestSchema);
