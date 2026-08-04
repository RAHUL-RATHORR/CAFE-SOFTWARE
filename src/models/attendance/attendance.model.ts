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
 * Attendance foundation model — check-in/out architecture only.
 * No biometric or device integrations.
 */
const attendanceSchema = new Schema(
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
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    workingHours: { type: Number, min: 0, default: 0 },
    lateMinutes: { type: Number, min: 0, default: 0 },
    overtimeMinutes: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half-day", "on-leave"],
      default: "present",
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
  }),
  baseSchemaOptions
);

attendanceSchema.index(
  { restaurantId: 1, employeeId: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } },
  }
);

export type AttendanceDocument = InferSchemaType<typeof attendanceSchema> & {
  _id: Schema.Types.ObjectId;
};

export const AttendanceModel: Model<AttendanceDocument> =
  (models.Attendance as Model<AttendanceDocument>) ||
  model<AttendanceDocument>("Attendance", attendanceSchema);
