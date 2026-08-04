import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { baseSchemaOptions, withBaseFields } from "@/models/base";
import { tenantScopeDefinition } from "@/models/shared";
import {
  BUSINESS_STATUSES,
  DEVICE_STATUSES,
  DEVICE_TYPES,
  PAPER_SIZES,
  PRINT_LAYOUTS,
  PRINTER_CONNECTION_TYPES,
  PRINTER_ROLES,
  ROUNDING_RULES,
  TAX_MODES,
  THEME_PRESETS,
} from "@/types/settings";

function tenantUnique() {
  return {
    ...tenantScopeDefinition,
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
      index: true,
    },
  };
}

/* RestaurantSettings */
const restaurantSettingsSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    restaurantName: { type: String, trim: true, maxlength: 160, default: "" },
    legalName: { type: String, trim: true, maxlength: 200, default: "" },
    logo: { type: String, trim: true, maxlength: 500, default: "" },
    email: { type: String, trim: true, lowercase: true, maxlength: 160, default: "" },
    phone: { type: String, trim: true, maxlength: 32, default: "" },
    website: { type: String, trim: true, maxlength: 200, default: "" },
    gstNumber: { type: String, trim: true, maxlength: 32, default: "" },
    fssaiNumber: { type: String, trim: true, maxlength: 32, default: "" },
    businessAddress: { type: String, trim: true, maxlength: 500, default: "" },
    currency: { type: String, trim: true, uppercase: true, maxlength: 3, default: "INR" },
    timezone: { type: String, trim: true, maxlength: 80, default: "Asia/Kolkata" },
    language: { type: String, trim: true, maxlength: 20, default: "en-IN" },
    openingHours: { type: String, trim: true, maxlength: 10, default: "09:00" },
    closingHours: { type: String, trim: true, maxlength: 10, default: "22:00" },
    businessStatus: {
      type: String,
      enum: BUSINESS_STATUSES,
      default: "open",
    },
  }),
  baseSchemaOptions
);

export type RestaurantSettingsDocument = InferSchemaType<
  typeof restaurantSettingsSchema
> & { _id: Schema.Types.ObjectId };

export const RestaurantSettingsModel: Model<RestaurantSettingsDocument> =
  models.RestaurantSettings ||
  model<RestaurantSettingsDocument>(
    "RestaurantSettings",
    restaurantSettingsSchema
  );

/* TaxSettings */
const taxProfileSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, trim: true, maxlength: 80, default: "Standard" },
    gstPercent: { type: Number, default: 0, min: 0, max: 100 },
    cgstPercent: { type: Number, default: 0, min: 0, max: 100 },
    sgstPercent: { type: Number, default: 0, min: 0, max: 100 },
    igstPercent: { type: Number, default: 0, min: 0, max: 100 },
    vatPercent: { type: Number, default: 0, min: 0, max: 100 },
    serviceChargePercent: { type: Number, default: 0, min: 0, max: 100 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const taxSettingsSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    taxMode: { type: String, enum: TAX_MODES, default: "exclusive" },
    roundingRule: {
      type: String,
      enum: ROUNDING_RULES,
      default: "nearest",
    },
    profiles: { type: [taxProfileSchema], default: [] },
  }),
  baseSchemaOptions
);

export type TaxSettingsDocument = InferSchemaType<typeof taxSettingsSchema> & {
  _id: Schema.Types.ObjectId;
};

export const TaxSettingsModel: Model<TaxSettingsDocument> =
  models.TaxSettings ||
  model<TaxSettingsDocument>("TaxSettings", taxSettingsSchema);

/* ReceiptSettings */
const receiptSettingsSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    header: { type: String, trim: true, maxlength: 500, default: "" },
    footer: { type: String, trim: true, maxlength: 500, default: "" },
    logo: { type: String, trim: true, maxlength: 500, default: "" },
    qrEnabled: { type: Boolean, default: false },
    barcodeEnabled: { type: Boolean, default: false },
    invoicePrefix: { type: String, trim: true, maxlength: 20, default: "INV-" },
    receiptPrefix: { type: String, trim: true, maxlength: 20, default: "RCP-" },
    receiptNotes: { type: String, trim: true, maxlength: 1000, default: "" },
    termsAndConditions: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },
    printLayout: {
      type: String,
      enum: PRINT_LAYOUTS,
      default: "standard",
    },
    paperSize: { type: String, enum: PAPER_SIZES, default: "80mm" },
  }),
  baseSchemaOptions
);

export type ReceiptSettingsDocument = InferSchemaType<
  typeof receiptSettingsSchema
> & { _id: Schema.Types.ObjectId };

export const ReceiptSettingsModel: Model<ReceiptSettingsDocument> =
  models.ReceiptSettings ||
  model<ReceiptSettingsDocument>("ReceiptSettings", receiptSettingsSchema);

/* InvoiceSettings — supports /settings/invoice */
const invoiceSettingsSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    invoicePrefix: { type: String, trim: true, maxlength: 20, default: "INV-" },
    nextInvoiceNumber: { type: Number, default: 1, min: 1 },
    invoiceNotes: { type: String, trim: true, maxlength: 2000, default: "" },
    defaultTerms: { type: String, trim: true, maxlength: 2000, default: "" },
    invoiceFooter: { type: String, trim: true, maxlength: 500, default: "" },
    autoNumbering: { type: Boolean, default: true },
  }),
  baseSchemaOptions
);

export type InvoiceSettingsDocument = InferSchemaType<
  typeof invoiceSettingsSchema
> & { _id: Schema.Types.ObjectId };

export const InvoiceSettingsModel: Model<InvoiceSettingsDocument> =
  models.InvoiceSettings ||
  model<InvoiceSettingsDocument>("InvoiceSettings", invoiceSettingsSchema);

/* PrinterSettings */
const printerConfigSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, trim: true, maxlength: 120, default: "" },
    role: { type: String, enum: PRINTER_ROLES, default: "receipt" },
    connectionType: {
      type: String,
      enum: PRINTER_CONNECTION_TYPES,
      default: "placeholder",
    },
    address: { type: String, trim: true, maxlength: 200, default: "" },
    enabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const printerSettingsSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    printers: { type: [printerConfigSchema], default: [] },
    printQueueEnabled: { type: Boolean, default: false },
  }),
  baseSchemaOptions
);

export type PrinterSettingsDocument = InferSchemaType<
  typeof printerSettingsSchema
> & { _id: Schema.Types.ObjectId };

export const PrinterSettingsModel: Model<PrinterSettingsDocument> =
  models.PrinterSettings ||
  model<PrinterSettingsDocument>("PrinterSettings", printerSettingsSchema);

/* DeviceSettings */
const deviceConfigSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, trim: true, maxlength: 120, default: "" },
    type: { type: String, enum: DEVICE_TYPES, default: "pos-terminal" },
    status: { type: String, enum: DEVICE_STATUSES, default: "inactive" },
    identifier: { type: String, trim: true, maxlength: 120, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { _id: false }
);

const deviceSettingsSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    devices: { type: [deviceConfigSchema], default: [] },
  }),
  baseSchemaOptions
);

export type DeviceSettingsDocument = InferSchemaType<
  typeof deviceSettingsSchema
> & { _id: Schema.Types.ObjectId };

export const DeviceSettingsModel: Model<DeviceSettingsDocument> =
  models.DeviceSettings ||
  model<DeviceSettingsDocument>("DeviceSettings", deviceSettingsSchema);

/* NotificationSettings */
const notificationSettingsSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    orderNotifications: { type: Boolean, default: true },
    kitchenAlerts: { type: Boolean, default: true },
    billingAlerts: { type: Boolean, default: true },
    inventoryAlerts: { type: Boolean, default: true },
    purchaseAlerts: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
    pushEnabled: { type: Boolean, default: false },
  }),
  baseSchemaOptions
);

export type NotificationSettingsDocument = InferSchemaType<
  typeof notificationSettingsSchema
> & { _id: Schema.Types.ObjectId };

export const NotificationSettingsModel: Model<NotificationSettingsDocument> =
  models.NotificationSettings ||
  model<NotificationSettingsDocument>(
    "NotificationSettings",
    notificationSettingsSchema
  );

/* BrandSettings */
const brandSettingsSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    primaryColor: { type: String, trim: true, maxlength: 20, default: "#0F766E" },
    secondaryColor: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "#134E4A",
    },
    logo: { type: String, trim: true, maxlength: 500, default: "" },
    favicon: { type: String, trim: true, maxlength: 500, default: "" },
    theme: { type: String, enum: THEME_PRESETS, default: "system" },
    receiptBranding: { type: Boolean, default: true },
    invoiceBranding: { type: Boolean, default: true },
    emailBranding: { type: Boolean, default: false },
  }),
  baseSchemaOptions
);

export type BrandSettingsDocument = InferSchemaType<
  typeof brandSettingsSchema
> & { _id: Schema.Types.ObjectId };

export const BrandSettingsModel: Model<BrandSettingsDocument> =
  models.BrandSettings ||
  model<BrandSettingsDocument>("BrandSettings", brandSettingsSchema);

/* SecuritySettings */
const securitySettingsSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    minPasswordLength: { type: Number, default: 8, min: 6, max: 128 },
    requireUppercase: { type: Boolean, default: true },
    requireNumber: { type: Boolean, default: true },
    requireSpecialChar: { type: Boolean, default: false },
    sessionTimeoutMinutes: { type: Number, default: 60, min: 5, max: 1440 },
    maxLoginAttempts: { type: Number, default: 5, min: 1, max: 50 },
    lockoutMinutes: { type: Number, default: 15, min: 1, max: 1440 },
    mfaEnabled: { type: Boolean, default: false },
    allowedDevicesEnabled: { type: Boolean, default: false },
    ipRestrictionEnabled: { type: Boolean, default: false },
    auditLoginEvents: { type: Boolean, default: true },
    auditSettingsChanges: { type: Boolean, default: true },
  }),
  baseSchemaOptions
);

export type SecuritySettingsDocument = InferSchemaType<
  typeof securitySettingsSchema
> & { _id: Schema.Types.ObjectId };

export const SecuritySettingsModel: Model<SecuritySettingsDocument> =
  models.SecuritySettings ||
  model<SecuritySettingsDocument>("SecuritySettings", securitySettingsSchema);

/* SystemPreferences */
const systemPreferencesSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    dateFormat: { type: String, trim: true, maxlength: 40, default: "dd/MM/yyyy" },
    timeFormat: { type: String, enum: ["12h", "24h"], default: "12h" },
    currencyFormat: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "symbol",
    },
    numberFormat: { type: String, trim: true, maxlength: 20, default: "en-IN" },
    defaultLanguage: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "en-IN",
    },
    defaultBranchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    theme: { type: String, enum: THEME_PRESETS, default: "system" },
    paginationSize: { type: Number, default: 20, min: 5, max: 100 },
    timezone: { type: String, trim: true, maxlength: 80, default: "Asia/Kolkata" },
  }),
  baseSchemaOptions
);

export type SystemPreferencesDocument = InferSchemaType<
  typeof systemPreferencesSchema
> & { _id: Schema.Types.ObjectId };

export const SystemPreferencesModel: Model<SystemPreferencesDocument> =
  models.SystemPreferences ||
  model<SystemPreferencesDocument>(
    "SystemPreferences",
    systemPreferencesSchema
  );

/* BranchSettings — tenant-level branch defaults / selected branch snapshot */
const branchSettingsSchema = new Schema(
  withBaseFields({
    ...tenantUnique(),
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    branchName: { type: String, trim: true, maxlength: 160, default: "" },
    address: { type: String, trim: true, maxlength: 500, default: "" },
    city: { type: String, trim: true, maxlength: 100, default: "" },
    state: { type: String, trim: true, maxlength: 100, default: "" },
    country: { type: String, trim: true, maxlength: 100, default: "India" },
    postalCode: { type: String, trim: true, maxlength: 20, default: "" },
    phone: { type: String, trim: true, maxlength: 32, default: "" },
    email: { type: String, trim: true, maxlength: 160, default: "" },
    workingHoursStart: {
      type: String,
      trim: true,
      maxlength: 10,
      default: "09:00",
    },
    workingHoursEnd: {
      type: String,
      trim: true,
      maxlength: 10,
      default: "22:00",
    },
    managerName: { type: String, trim: true, maxlength: 120, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  }),
  baseSchemaOptions
);

export type BranchSettingsDocument = InferSchemaType<
  typeof branchSettingsSchema
> & { _id: Schema.Types.ObjectId };

export const BranchSettingsModel: Model<BranchSettingsDocument> =
  models.BranchSettings ||
  model<BranchSettingsDocument>("BranchSettings", branchSettingsSchema);
