import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";

const vendorSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    vendorCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
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
    gstNumber: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "",
    },
    address: { type: String, trim: true, maxlength: 255, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    state: { type: String, trim: true, maxlength: 80, default: "" },
    country: { type: String, trim: true, maxlength: 80, default: "" },
    postalCode: { type: String, trim: true, maxlength: 24, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
      index: true,
    },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  }),
  baseSchemaOptions
);

vendorSchema.index(
  { restaurantId: 1, vendorCode: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } },
  }
);
vendorSchema.index(
  { restaurantId: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: { $ne: true } },
  }
);

export type VendorDocument = InferSchemaType<typeof vendorSchema> & {
  _id: Schema.Types.ObjectId;
};

export const VendorModel: Model<VendorDocument> =
  (models.Vendor as Model<VendorDocument>) ||
  model<VendorDocument>("Vendor", vendorSchema);
