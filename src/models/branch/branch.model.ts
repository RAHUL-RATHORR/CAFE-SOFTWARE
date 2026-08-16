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

const openingHoursDaySchema = new Schema(
  {
    day: {
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
      required: true,
    },
    open: { type: String, trim: true, default: "" },
    close: { type: String, trim: true, default: "" },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Branch / outlet model — multi-branch foundation under a restaurant tenant.
 * No CRUD or service layer in this module.
 */
const branchSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    branchCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 32,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    /** Placeholder — User binding arrives in a later module */
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
      default: "UTC",
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 3,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "coming-soon", "temporarily-closed"],
      default: "active",
      index: true,
    },
    openingHours: {
      timezone: { type: String, trim: true, default: "" },
      days: { type: [openingHoursDaySchema], default: [] },
      notes: { type: String, trim: true, maxlength: 500, default: "" },
    },
    coordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    /** Optional GSTIN for the outlet */
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 15,
      default: "",
    },
    /** Simple daily open/close placeholders (HH:mm) */
    openingTime: {
      type: String,
      trim: true,
      maxlength: 8,
      default: "",
    },
    closingTime: {
      type: String,
      trim: true,
      maxlength: 8,
      default: "",
    },
    isMainBranch: {
      type: Boolean,
      default: false,
      index: true,
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "branches",
  }
);

branchSchema.index({ restaurantId: 1, branchCode: 1 }, { unique: true });
branchSchema.index({ restaurantId: 1, isMainBranch: 1 });
branchSchema.index({ restaurantId: 1, isDeleted: 1, status: 1 });

export type BranchDocument = InferSchemaType<typeof branchSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const BranchModel: Model<BranchDocument> =
  models.Branch ?? model<BranchDocument>("Branch", branchSchema);
