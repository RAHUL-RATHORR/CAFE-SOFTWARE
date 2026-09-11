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

/**
 * Thermal Printer Model — Tenant and branch scoped ESC/POS hardware configuration.
 */
const printerSchema = new Schema(
  withBaseFields({
    ...tenantScopeDefinition,
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    type: {
      type: String,
      enum: ["receipt", "kitchen", "billing"],
      default: "receipt",
    },
    connectionType: {
      type: String,
      enum: ["network", "usb", "bluetooth"],
      required: true,
      default: "network",
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
      default: "192.168.1.200",
    },
    port: {
      type: Number,
      min: 1,
      max: 65535,
      default: 9100,
    },
    paperWidth: {
      type: String,
      enum: ["58mm", "80mm"],
      default: "80mm",
    },
    characterWidth: {
      type: Number,
      min: 24,
      max: 80,
      default: 48,
    },
    autoCut: {
      type: Boolean,
      default: true,
    },
    openCashDrawer: {
      type: Boolean,
      default: false,
    },
    printLogo: {
      type: Boolean,
      default: false,
    },
    printFooter: {
      type: Boolean,
      default: true,
    },
    footerText: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "Thank you for dining with us! Please visit again.",
    },
    autoPrint: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["connected", "disconnected", "unknown", "error"],
      default: "unknown",
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
  }),
  {
    ...baseSchemaOptions,
    collection: "printers",
  }
);

printerSchema.index(
  { restaurantId: 1, branchId: 1, isDefault: 1 },
  { partialFilterExpression: { isDeleted: false, isDefault: true } }
);
printerSchema.index({ restaurantId: 1, branchId: 1, isDeleted: 1 });
printerSchema.index({ restaurantId: 1, isDeleted: 1 });

export type PrinterDocument = InferSchemaType<typeof printerSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const PrinterModel: Model<PrinterDocument> =
  models.Printer || model<PrinterDocument>("Printer", printerSchema);
