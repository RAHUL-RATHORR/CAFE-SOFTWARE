import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import {
  DATABASE_USER_ROLES,
  tenantScopeDefinition,
} from "@/models/shared";

const emergencyContactSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 120, default: "" },
    phone: { type: String, trim: true, maxlength: 32, default: "" },
    relation: { type: String, trim: true, maxlength: 80, default: "" },
  },
  { _id: false }
);

const employeeSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: "",
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
      index: true,
    },
    avatar: { type: String, trim: true, maxlength: 500, default: "" },
    role: {
      type: String,
      enum: DATABASE_USER_ROLES,
      default: "waiter",
      index: true,
    },
    department: {
      type: String,
      enum: [
        "kitchen",
        "service",
        "cashier",
        "management",
        "cleaning",
        "delivery",
        "other",
      ],
      default: "service",
      index: true,
    },
    designation: {
      type: String,
      enum: [
        "head-chef",
        "sous-chef",
        "line-cook",
        "waiter",
        "host",
        "cashier",
        "manager",
        "supervisor",
        "cleaner",
        "other",
      ],
      default: "other",
      index: true,
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "intern"],
      default: "full-time",
    },
    joiningDate: { type: Date, default: null },
    salaryPlaceholder: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive", "on-leave", "terminated"],
      default: "active",
      index: true,
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({ name: "", phone: "", relation: "" }),
    },
    address: { type: String, trim: true, maxlength: 255, default: "" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  }),
  baseSchemaOptions
);

employeeSchema.index(
  { restaurantId: 1, employeeCode: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } },
  }
);
employeeSchema.index(
  { restaurantId: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } },
  }
);

export type EmployeeDocument = InferSchemaType<typeof employeeSchema> & {
  _id: Schema.Types.ObjectId;
};

export const EmployeeModel: Model<EmployeeDocument> =
  (models.Employee as Model<EmployeeDocument>) ||
  model<EmployeeDocument>("Employee", employeeSchema);
