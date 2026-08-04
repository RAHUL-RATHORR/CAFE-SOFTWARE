import type {
  BrandSettingsDocument,
  BranchSettingsDocument,
  DeviceSettingsDocument,
  InvoiceSettingsDocument,
  NotificationSettingsDocument,
  PrinterSettingsDocument,
  ReceiptSettingsDocument,
  RestaurantSettingsDocument,
  SecuritySettingsDocument,
  SystemPreferencesDocument,
  TaxSettingsDocument,
} from "@/models/settings";
import type {
  BrandSettings,
  BranchSettingsData,
  DeviceSettings,
  InvoiceSettings,
  NotificationSettings,
  PrinterSettings,
  ReceiptSettings,
  RestaurantSettings,
  SecuritySettings,
  SystemPreferencesSettings,
  TaxSettings,
} from "@/types/settings";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function toIso(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  const date = new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

export function serializeRestaurantSettings(
  doc: RestaurantSettingsDocument
): RestaurantSettings {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    restaurantName: doc.restaurantName ?? "",
    legalName: doc.legalName ?? "",
    logo: doc.logo ?? "",
    email: doc.email ?? "",
    phone: doc.phone ?? "",
    website: doc.website ?? "",
    gstNumber: doc.gstNumber ?? "",
    fssaiNumber: doc.fssaiNumber ?? "",
    businessAddress: doc.businessAddress ?? "",
    currency: doc.currency ?? "INR",
    timezone: doc.timezone ?? "Asia/Kolkata",
    language: doc.language ?? "en-IN",
    openingHours: doc.openingHours ?? "09:00",
    closingHours: doc.closingHours ?? "22:00",
    businessStatus: doc.businessStatus as RestaurantSettings["businessStatus"],
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeBranchSettings(
  doc: BranchSettingsDocument
): BranchSettingsData {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    branchName: doc.branchName ?? "",
    address: doc.address ?? "",
    city: doc.city ?? "",
    state: doc.state ?? "",
    country: doc.country ?? "",
    postalCode: doc.postalCode ?? "",
    phone: doc.phone ?? "",
    email: doc.email ?? "",
    workingHoursStart: doc.workingHoursStart ?? "09:00",
    workingHoursEnd: doc.workingHoursEnd ?? "22:00",
    managerName: doc.managerName ?? "",
    status: doc.status as BranchSettingsData["status"],
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeTaxSettings(doc: TaxSettingsDocument): TaxSettings {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    taxMode: doc.taxMode as TaxSettings["taxMode"],
    roundingRule: doc.roundingRule as TaxSettings["roundingRule"],
    profiles: (doc.profiles ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      gstPercent: p.gstPercent ?? 0,
      cgstPercent: p.cgstPercent ?? 0,
      sgstPercent: p.sgstPercent ?? 0,
      igstPercent: p.igstPercent ?? 0,
      vatPercent: p.vatPercent ?? 0,
      serviceChargePercent: p.serviceChargePercent ?? 0,
      isDefault: Boolean(p.isDefault),
    })),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeReceiptSettings(
  doc: ReceiptSettingsDocument
): ReceiptSettings {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    header: doc.header ?? "",
    footer: doc.footer ?? "",
    logo: doc.logo ?? "",
    qrEnabled: Boolean(doc.qrEnabled),
    barcodeEnabled: Boolean(doc.barcodeEnabled),
    invoicePrefix: doc.invoicePrefix ?? "INV-",
    receiptPrefix: doc.receiptPrefix ?? "RCP-",
    receiptNotes: doc.receiptNotes ?? "",
    termsAndConditions: doc.termsAndConditions ?? "",
    printLayout: doc.printLayout as ReceiptSettings["printLayout"],
    paperSize: doc.paperSize as ReceiptSettings["paperSize"],
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeInvoiceSettings(
  doc: InvoiceSettingsDocument
): InvoiceSettings {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    invoicePrefix: doc.invoicePrefix ?? "INV-",
    nextInvoiceNumber: doc.nextInvoiceNumber ?? 1,
    invoiceNotes: doc.invoiceNotes ?? "",
    defaultTerms: doc.defaultTerms ?? "",
    invoiceFooter: doc.invoiceFooter ?? "",
    autoNumbering: Boolean(doc.autoNumbering),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializePrinterSettings(
  doc: PrinterSettingsDocument
): PrinterSettings {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    printers: (doc.printers ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role as PrinterSettings["printers"][number]["role"],
      connectionType:
        p.connectionType as PrinterSettings["printers"][number]["connectionType"],
      address: p.address ?? "",
      enabled: Boolean(p.enabled),
    })),
    printQueueEnabled: Boolean(doc.printQueueEnabled),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeDeviceSettings(
  doc: DeviceSettingsDocument
): DeviceSettings {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    devices: (doc.devices ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type as DeviceSettings["devices"][number]["type"],
      status: d.status as DeviceSettings["devices"][number]["status"],
      identifier: d.identifier ?? "",
      notes: d.notes ?? "",
    })),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeNotificationSettings(
  doc: NotificationSettingsDocument
): NotificationSettings {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    orderNotifications: Boolean(doc.orderNotifications),
    kitchenAlerts: Boolean(doc.kitchenAlerts),
    billingAlerts: Boolean(doc.billingAlerts),
    inventoryAlerts: Boolean(doc.inventoryAlerts),
    purchaseAlerts: Boolean(doc.purchaseAlerts),
    systemAlerts: Boolean(doc.systemAlerts),
    emailEnabled: Boolean(doc.emailEnabled),
    smsEnabled: Boolean(doc.smsEnabled),
    pushEnabled: Boolean(doc.pushEnabled),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeBrandSettings(
  doc: BrandSettingsDocument
): BrandSettings {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    primaryColor: doc.primaryColor ?? "#0F766E",
    secondaryColor: doc.secondaryColor ?? "#134E4A",
    logo: doc.logo ?? "",
    favicon: doc.favicon ?? "",
    theme: doc.theme as BrandSettings["theme"],
    receiptBranding: Boolean(doc.receiptBranding),
    invoiceBranding: Boolean(doc.invoiceBranding),
    emailBranding: Boolean(doc.emailBranding),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeSecuritySettings(
  doc: SecuritySettingsDocument
): SecuritySettings {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    minPasswordLength: doc.minPasswordLength ?? 8,
    requireUppercase: Boolean(doc.requireUppercase),
    requireNumber: Boolean(doc.requireNumber),
    requireSpecialChar: Boolean(doc.requireSpecialChar),
    sessionTimeoutMinutes: doc.sessionTimeoutMinutes ?? 60,
    maxLoginAttempts: doc.maxLoginAttempts ?? 5,
    lockoutMinutes: doc.lockoutMinutes ?? 15,
    mfaEnabled: Boolean(doc.mfaEnabled),
    allowedDevicesEnabled: Boolean(doc.allowedDevicesEnabled),
    ipRestrictionEnabled: Boolean(doc.ipRestrictionEnabled),
    auditLoginEvents: Boolean(doc.auditLoginEvents),
    auditSettingsChanges: Boolean(doc.auditSettingsChanges),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeSystemPreferences(
  doc: SystemPreferencesDocument
): SystemPreferencesSettings {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    dateFormat: doc.dateFormat ?? "dd/MM/yyyy",
    timeFormat: (doc.timeFormat as "12h" | "24h") ?? "12h",
    currencyFormat: doc.currencyFormat ?? "symbol",
    numberFormat: doc.numberFormat ?? "en-IN",
    defaultLanguage: doc.defaultLanguage ?? "en-IN",
    defaultBranchId: idToString(doc.defaultBranchId),
    theme: doc.theme as SystemPreferencesSettings["theme"],
    paginationSize: doc.paginationSize ?? 20,
    timezone: doc.timezone ?? "Asia/Kolkata",
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}
