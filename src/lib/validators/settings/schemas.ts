import { z } from "zod";
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

const optionalObjectId = z.preprocess(
  (value) => {
    if (value === "" || value === undefined) return null;
    return value;
  },
  z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid id")
    .nullable()
    .optional()
);

const hhmm = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM")
  .or(z.literal(""));

export const updateRestaurantSettingsSchema = z.object({
  restaurantName: z.string().trim().max(160).optional(),
  legalName: z.string().trim().max(200).optional(),
  logo: z.string().trim().max(500).optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional(),
  website: z.string().trim().max(200).optional(),
  gstNumber: z.string().trim().max(32).optional(),
  fssaiNumber: z.string().trim().max(32).optional(),
  businessAddress: z.string().trim().max(500).optional(),
  currency: z.string().trim().max(3).optional(),
  timezone: z.string().trim().max(80).optional(),
  language: z.string().trim().max(20).optional(),
  openingHours: hhmm.optional(),
  closingHours: hhmm.optional(),
  businessStatus: z.enum(BUSINESS_STATUSES).optional(),
});

export const updateBranchSettingsSchema = z.object({
  branchId: optionalObjectId,
  branchName: z.string().trim().max(160).optional(),
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(32).optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  workingHoursStart: hhmm.optional(),
  workingHoursEnd: hhmm.optional(),
  managerName: z.string().trim().max(120).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const taxProfileSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(80),
  gstPercent: z.number().min(0).max(100),
  cgstPercent: z.number().min(0).max(100),
  sgstPercent: z.number().min(0).max(100),
  igstPercent: z.number().min(0).max(100),
  vatPercent: z.number().min(0).max(100).default(0),
  serviceChargePercent: z.number().min(0).max(100).default(0),
  isDefault: z.boolean().default(false),
});

export const updateTaxSettingsSchema = z.object({
  taxMode: z.enum(TAX_MODES).optional(),
  roundingRule: z.enum(ROUNDING_RULES).optional(),
  profiles: z.array(taxProfileSchema).optional(),
});

export const updateReceiptSettingsSchema = z.object({
  header: z.string().trim().max(500).optional(),
  footer: z.string().trim().max(500).optional(),
  logo: z.string().trim().max(500).optional(),
  qrEnabled: z.boolean().optional(),
  barcodeEnabled: z.boolean().optional(),
  invoicePrefix: z.string().trim().max(20).optional(),
  receiptPrefix: z.string().trim().max(20).optional(),
  receiptNotes: z.string().trim().max(1000).optional(),
  termsAndConditions: z.string().trim().max(4000).optional(),
  printLayout: z.enum(PRINT_LAYOUTS).optional(),
  paperSize: z.enum(PAPER_SIZES).optional(),
});

export const updateInvoiceSettingsSchema = z.object({
  invoicePrefix: z.string().trim().max(20).optional(),
  nextInvoiceNumber: z.number().int().min(1).optional(),
  invoiceNotes: z.string().trim().max(2000).optional(),
  defaultTerms: z.string().trim().max(2000).optional(),
  invoiceFooter: z.string().trim().max(500).optional(),
  autoNumbering: z.boolean().optional(),
});

export const printerConfigSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().max(120),
  role: z.enum(PRINTER_ROLES),
  connectionType: z.enum(PRINTER_CONNECTION_TYPES),
  address: z.string().trim().max(200).default(""),
  enabled: z.boolean().default(false),
});

export const updatePrinterSettingsSchema = z.object({
  printers: z.array(printerConfigSchema).optional(),
  printQueueEnabled: z.boolean().optional(),
});

export const deviceConfigSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().max(120),
  type: z.enum(DEVICE_TYPES),
  status: z.enum(DEVICE_STATUSES),
  identifier: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(500).default(""),
});

export const updateDeviceSettingsSchema = z.object({
  devices: z.array(deviceConfigSchema).optional(),
});

export const updateNotificationSettingsSchema = z.object({
  orderNotifications: z.boolean().optional(),
  kitchenAlerts: z.boolean().optional(),
  billingAlerts: z.boolean().optional(),
  inventoryAlerts: z.boolean().optional(),
  purchaseAlerts: z.boolean().optional(),
  systemAlerts: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});

export const updateBrandSettingsSchema = z.object({
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Use a hex color")
    .optional(),
  secondaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Use a hex color")
    .optional(),
  logo: z.string().trim().max(500).optional(),
  favicon: z.string().trim().max(500).optional(),
  theme: z.enum(THEME_PRESETS).optional(),
  receiptBranding: z.boolean().optional(),
  invoiceBranding: z.boolean().optional(),
  emailBranding: z.boolean().optional(),
});

export const updateSecuritySettingsSchema = z.object({
  minPasswordLength: z.number().int().min(6).max(128).optional(),
  requireUppercase: z.boolean().optional(),
  requireNumber: z.boolean().optional(),
  requireSpecialChar: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().int().min(5).max(1440).optional(),
  maxLoginAttempts: z.number().int().min(1).max(50).optional(),
  lockoutMinutes: z.number().int().min(1).max(1440).optional(),
  mfaEnabled: z.boolean().optional(),
  allowedDevicesEnabled: z.boolean().optional(),
  ipRestrictionEnabled: z.boolean().optional(),
  auditLoginEvents: z.boolean().optional(),
  auditSettingsChanges: z.boolean().optional(),
});

export const updateSystemPreferencesSchema = z.object({
  dateFormat: z.string().trim().max(40).optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
  currencyFormat: z.string().trim().max(40).optional(),
  numberFormat: z.string().trim().max(20).optional(),
  defaultLanguage: z.string().trim().max(20).optional(),
  defaultBranchId: optionalObjectId,
  theme: z.enum(THEME_PRESETS).optional(),
  paginationSize: z.number().int().min(5).max(100).optional(),
  timezone: z.string().trim().max(80).optional(),
});

export type UpdateRestaurantSettingsInput = z.infer<
  typeof updateRestaurantSettingsSchema
>;
export type UpdateBranchSettingsInput = z.infer<
  typeof updateBranchSettingsSchema
>;
export type UpdateTaxSettingsInput = z.infer<typeof updateTaxSettingsSchema>;
export type UpdateReceiptSettingsInput = z.infer<
  typeof updateReceiptSettingsSchema
>;
export type UpdateInvoiceSettingsInput = z.infer<
  typeof updateInvoiceSettingsSchema
>;
export type UpdatePrinterSettingsInput = z.infer<
  typeof updatePrinterSettingsSchema
>;
export type UpdateDeviceSettingsInput = z.infer<
  typeof updateDeviceSettingsSchema
>;
export type UpdateNotificationSettingsInput = z.infer<
  typeof updateNotificationSettingsSchema
>;
export type UpdateBrandSettingsInput = z.infer<
  typeof updateBrandSettingsSchema
>;
export type UpdateSecuritySettingsInput = z.infer<
  typeof updateSecuritySettingsSchema
>;
export type UpdateSystemPreferencesInput = z.infer<
  typeof updateSystemPreferencesSchema
>;
