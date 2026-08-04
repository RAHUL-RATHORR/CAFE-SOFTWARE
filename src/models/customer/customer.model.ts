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

const customerAddressSchema = new Schema(
  {
    label: { type: String, trim: true, maxlength: 80, default: "Home" },
    addressLine1: { type: String, trim: true, maxlength: 160, default: "" },
    addressLine2: { type: String, trim: true, maxlength: 160, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    state: { type: String, trim: true, maxlength: 80, default: "" },
    country: { type: String, trim: true, maxlength: 80, default: "" },
    postalCode: { type: String, trim: true, maxlength: 24, default: "" },
    landmark: { type: String, trim: true, maxlength: 120, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const customerNoteSchema = new Schema(
  {
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const customerStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ["active", "inactive", "blocked", "vip"],
      required: true,
    },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    note: { type: String, trim: true, maxlength: 255, default: "" },
  },
  { _id: false }
);

const customerSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    customerCode: {
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
      required: true,
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
    dateOfBirth: { type: Date, default: null },
    anniversary: { type: Date, default: null },
    gender: {
      type: String,
      enum: ["female", "male", "non-binary", "prefer-not-to-say", "other", null],
      default: null,
    },
    avatar: { type: String, trim: true, maxlength: 500, default: "" },
    addresses: { type: [customerAddressSchema], default: [] },
    tags: { type: [String], default: [] },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    noteEntries: { type: [customerNoteSchema], default: [] },
    loyaltyPoints: { type: Number, min: 0, default: 0 },
    /** FUTURE PLACEHOLDER — loyalty enrichment */
    loyaltyMeta: {
      rewardLevel: { type: String, default: null },
      membershipTier: { type: String, default: null },
      couponCodes: { type: [String], default: [] },
      referralCode: { type: String, default: null },
    },
    totalOrders: { type: Number, min: 0, default: 0 },
    totalSpent: { type: Number, min: 0, default: 0 },
    lastVisit: { type: Date, default: null, index: true },
    preferredOrderType: {
      type: String,
      enum: ["dine-in", "take-away", "delivery", "any"],
      default: "any",
    },
    preferredTable: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantTable",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked", "vip"],
      required: true,
      default: "active",
      index: true,
    },
    statusHistory: { type: [customerStatusHistorySchema], default: [] },
  }),
  {
    ...baseSchemaOptions,
    collection: "customers",
  }
);

customerSchema.index(
  { restaurantId: 1, customerCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
customerSchema.index(
  { restaurantId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
customerSchema.index({ restaurantId: 1, email: 1 });
customerSchema.index({ restaurantId: 1, status: 1, isDeleted: 1 });
customerSchema.index({ restaurantId: 1, tags: 1 });
customerSchema.index({ restaurantId: 1, fullName: 1 });
customerSchema.index({ restaurantId: 1, createdAt: -1 });

export type CustomerDocument = InferSchemaType<typeof customerSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CustomerModel: Model<CustomerDocument> =
  models.Customer ?? model<CustomerDocument>("Customer", customerSchema);
