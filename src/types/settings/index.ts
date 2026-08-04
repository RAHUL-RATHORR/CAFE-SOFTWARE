/**
 * Enterprise Global Settings domain types.
 */

export const BUSINESS_STATUSES = ["open", "closed", "temporarily-closed"] as const;
export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

export const TAX_MODES = ["inclusive", "exclusive"] as const;
export type TaxMode = (typeof TAX_MODES)[number];

export const ROUNDING_RULES = ["none", "nearest", "up", "down"] as const;
export type RoundingRule = (typeof ROUNDING_RULES)[number];

export const PAPER_SIZES = ["58mm", "80mm", "A4", "Letter"] as const;
export type PaperSize = (typeof PAPER_SIZES)[number];

export const PRINT_LAYOUTS = ["compact", "standard", "detailed"] as const;
export type PrintLayout = (typeof PRINT_LAYOUTS)[number];

export const PRINTER_ROLES = [
  "kitchen",
  "billing",
  "receipt",
  "label",
] as const;
export type PrinterRole = (typeof PRINTER_ROLES)[number];

export const PRINTER_CONNECTION_TYPES = [
  "network",
  "usb",
  "bluetooth",
  "placeholder",
] as const;
export type PrinterConnectionType = (typeof PRINTER_CONNECTION_TYPES)[number];

export const DEVICE_TYPES = [
  "pos-terminal",
  "kitchen-display",
  "tablet",
  "mobile",
  "desktop",
  "scanner",
  "cash-drawer",
  "customer-display",
] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const DEVICE_STATUSES = ["active", "inactive", "offline"] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const THEME_PRESETS = ["system", "light", "dark", "brand"] as const;
export type ThemePreset = (typeof THEME_PRESETS)[number];

export type RestaurantSettings = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  legalName: string;
  logo: string;
  email: string;
  phone: string;
  website: string;
  gstNumber: string;
  fssaiNumber: string;
  businessAddress: string;
  currency: string;
  timezone: string;
  language: string;
  openingHours: string;
  closingHours: string;
  businessStatus: BusinessStatus;
  createdAt: string;
  updatedAt: string;
};

export type BranchSettingsData = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  branchName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  /** FUTURE PLACEHOLDER — manager assignment */
  managerName: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type TaxProfile = {
  id: string;
  name: string;
  gstPercent: number;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  /** FUTURE PLACEHOLDER — VAT */
  vatPercent: number;
  serviceChargePercent: number;
  isDefault: boolean;
};

export type TaxSettings = {
  id: string;
  restaurantId: string;
  taxMode: TaxMode;
  roundingRule: RoundingRule;
  profiles: TaxProfile[];
  createdAt: string;
  updatedAt: string;
};

export type ReceiptSettings = {
  id: string;
  restaurantId: string;
  header: string;
  footer: string;
  logo: string;
  /** FUTURE PLACEHOLDER — QR on receipt */
  qrEnabled: boolean;
  /** FUTURE PLACEHOLDER — barcode on receipt */
  barcodeEnabled: boolean;
  invoicePrefix: string;
  receiptPrefix: string;
  receiptNotes: string;
  termsAndConditions: string;
  printLayout: PrintLayout;
  paperSize: PaperSize;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceSettings = {
  id: string;
  restaurantId: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  invoiceNotes: string;
  defaultTerms: string;
  invoiceFooter: string;
  autoNumbering: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PrinterConfig = {
  id: string;
  name: string;
  role: PrinterRole;
  connectionType: PrinterConnectionType;
  /** FUTURE PLACEHOLDER — network address */
  address: string;
  enabled: boolean;
};

export type PrinterSettings = {
  id: string;
  restaurantId: string;
  printers: PrinterConfig[];
  /** FUTURE PLACEHOLDER — print queue */
  printQueueEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DeviceConfig = {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  /** FUTURE PLACEHOLDER — device identifier */
  identifier: string;
  notes: string;
};

export type DeviceSettings = {
  id: string;
  restaurantId: string;
  devices: DeviceConfig[];
  createdAt: string;
  updatedAt: string;
};

export type NotificationSettings = {
  id: string;
  restaurantId: string;
  orderNotifications: boolean;
  kitchenAlerts: boolean;
  billingAlerts: boolean;
  inventoryAlerts: boolean;
  purchaseAlerts: boolean;
  systemAlerts: boolean;
  /** FUTURE PLACEHOLDER channels */
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BrandSettings = {
  id: string;
  restaurantId: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  favicon: string;
  theme: ThemePreset;
  receiptBranding: boolean;
  invoiceBranding: boolean;
  /** FUTURE PLACEHOLDER — email branding */
  emailBranding: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SecuritySettings = {
  id: string;
  restaurantId: string;
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutMinutes: number;
  /** FUTURE PLACEHOLDER — MFA */
  mfaEnabled: boolean;
  /** FUTURE PLACEHOLDER — allowed devices */
  allowedDevicesEnabled: boolean;
  /** FUTURE PLACEHOLDER — IP restriction */
  ipRestrictionEnabled: boolean;
  auditLoginEvents: boolean;
  auditSettingsChanges: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SystemPreferencesSettings = {
  id: string;
  restaurantId: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  currencyFormat: string;
  numberFormat: string;
  defaultLanguage: string;
  defaultBranchId: string | null;
  theme: ThemePreset;
  paginationSize: number;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

/** Aggregated settings payload for getSettings() */
export type GlobalSettingsBundle = {
  restaurant: RestaurantSettings;
  branch: BranchSettingsData;
  tax: TaxSettings;
  receipt: ReceiptSettings;
  invoice: InvoiceSettings;
  printers: PrinterSettings;
  devices: DeviceSettings;
  notifications: NotificationSettings;
  branding: BrandSettings;
  security: SecuritySettings;
  preferences: SystemPreferencesSettings;
};

export type SettingsActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type SettingsActionError = {
  code: SettingsActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type SettingsActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: SettingsActionError };
