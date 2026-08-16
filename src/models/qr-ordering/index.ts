import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";
import { QR_CODE_TYPES } from "@/types/qr-ordering";
import { ORDER_STATUSES } from "@/types/order";

const guestCartItemSchema = new Schema(
  {
    key: { type: String, required: true },
    menuItemId: { type: String, default: null },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, trim: true, maxlength: 255, default: "" },
    isVeg: { type: Boolean, default: true },
    image: { type: String, trim: true, default: "" },
    customizations: {
      type: [
        new Schema(
          {
            groupId: { type: String, default: "" },
            groupName: { type: String, default: "" },
            optionId: { type: String, default: "" },
            optionName: { type: String, default: "" },
            priceDelta: { type: Number, default: 0 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { _id: false }
);

/* QRCode */
const qrCodeSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantTable",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: QR_CODE_TYPES,
      default: "restaurant",
      index: true,
    },
    code: { type: String, required: true, trim: true, maxlength: 300, index: true },
    token: { type: String, required: true, trim: true, maxlength: 80, unique: true },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  }),
  baseSchemaOptions
);

qrCodeSchema.index({ restaurantId: 1, type: 1, tableId: 1 });
qrCodeSchema.index({ token: 1, isActive: 1, isDeleted: 1 });
/** At most one active table QR per table */
qrCodeSchema.index(
  { tableId: 1, type: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "table",
      isActive: true,
      isDeleted: false,
      tableId: { $type: "objectId" },
    },
  }
);

export type QrCodeDocument = InferSchemaType<typeof qrCodeSchema> & {
  _id: Schema.Types.ObjectId;
};

export const QrCodeModel: Model<QrCodeDocument> =
  models.QRCode || model<QrCodeDocument>("QRCode", qrCodeSchema);

/* CustomerSession */
const customerSessionSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantTable",
      default: null,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      unique: true,
      index: true,
    },
    guestName: { type: String, trim: true, maxlength: 120, default: "" },
    guestPhone: { type: String, trim: true, maxlength: 32, default: "" },
    guestEmail: { type: String, trim: true, maxlength: 160, default: "" },
    cartSnapshot: { type: [guestCartItemSchema], default: [] },
    expiresAt: { type: Date, default: null },
  }),
  baseSchemaOptions
);

export type CustomerSessionDocument = InferSchemaType<
  typeof customerSessionSchema
> & { _id: Schema.Types.ObjectId };

export const CustomerSessionModel: Model<CustomerSessionDocument> =
  models.CustomerSession ||
  model<CustomerSessionDocument>("CustomerSession", customerSessionSchema);

/* PublicOrderPlaceholder */
const publicOrderPlaceholderSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "RestaurantTable",
      default: null,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    trackingToken: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      unique: true,
      index: true,
    },
    orderNumber: { type: String, required: true, trim: true, maxlength: 40 },
    guestName: { type: String, trim: true, maxlength: 120, default: "" },
    guestPhone: { type: String, trim: true, maxlength: 32, default: "" },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    estimatedMinutes: { type: Number, default: null, min: 0 },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
  }),
  baseSchemaOptions
);

publicOrderPlaceholderSchema.index({ restaurantId: 1, createdAt: -1 });
publicOrderPlaceholderSchema.index({ restaurantId: 1, tableId: 1, createdAt: -1 });
publicOrderPlaceholderSchema.index(
  { restaurantId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      idempotencyKey: { $type: "string", $gt: "" },
    },
  }
);

export type PublicOrderPlaceholderDocument = InferSchemaType<
  typeof publicOrderPlaceholderSchema
> & { _id: Schema.Types.ObjectId };

export const PublicOrderPlaceholderModel: Model<PublicOrderPlaceholderDocument> =
  models.PublicOrderPlaceholder ||
  model<PublicOrderPlaceholderDocument>(
    "PublicOrderPlaceholder",
    publicOrderPlaceholderSchema
  );
