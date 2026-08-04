import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";

const shiftSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },
    shiftName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8,
    },
    breakDuration: { type: Number, min: 0, max: 480, default: 30 },
    workingHours: { type: Number, min: 0, max: 24, default: 0 },
    weekDays: {
      type: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  }),
  baseSchemaOptions
);

shiftSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
shiftSchema.index({ restaurantId: 1, employeeId: 1 });

export type ShiftDocument = InferSchemaType<typeof shiftSchema> & {
  _id: Schema.Types.ObjectId;
};

export const ShiftModel: Model<ShiftDocument> =
  (models.Shift as Model<ShiftDocument>) ||
  model<ShiftDocument>("Shift", shiftSchema);
