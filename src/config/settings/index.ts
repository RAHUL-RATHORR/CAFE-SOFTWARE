import type { LucideIcon } from "lucide-react";
import {
  Building2,
  GitBranch,
  Briefcase,
  Percent,
  Coins,
  Receipt,
  FileText,
  Printer,
  MonitorSmartphone,
  Bell,
  Shield,
  Palette,
  SlidersHorizontal,
} from "lucide-react";
import type {
  BrandSettings,
  DeviceSettings,
  InvoiceSettings,
  NotificationSettings,
  PrinterSettings,
  ReceiptSettings,
  RestaurantSettings,
  SecuritySettings,
  SystemPreferencesSettings,
  TaxSettings,
  BranchSettingsData,
} from "@/types/settings";

export type SettingsNavItem = {
  id: string;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  permission?: string;
};

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: "restaurant",
    href: "/settings/restaurant",
    label: "Restaurant",
    description: "Identity, contact, and business hours",
    icon: Building2,
  },
  {
    id: "branches",
    href: "/settings/branches",
    label: "Branches",
    description: "Outlet information and hours",
    icon: GitBranch,
  },
  {
    id: "business",
    href: "/settings/business",
    label: "Business",
    description: "Legal name, GST, FSSAI, and status",
    icon: Briefcase,
  },
  {
    id: "tax",
    href: "/settings/tax",
    label: "Tax",
    description: "GST profiles and rounding rules",
    icon: Percent,
  },
  {
    id: "currency",
    href: "/settings/currency",
    label: "Currency & timezone",
    description: "Currency, timezone, and language",
    icon: Coins,
  },
  {
    id: "receipt",
    href: "/settings/receipt",
    label: "Receipt",
    description: "Receipt layout and prefixes",
    icon: Receipt,
  },
  {
    id: "invoice",
    href: "/settings/invoice",
    label: "Invoice",
    description: "Invoice numbering and terms",
    icon: FileText,
  },
  {
    id: "printers",
    href: "/settings/printers",
    label: "Printers",
    description: "Printer foundation (no hardware)",
    icon: Printer,
    permission: "settings.printers",
  },
  {
    id: "devices",
    href: "/settings/devices",
    label: "Devices",
    description: "POS and display foundations",
    icon: MonitorSmartphone,
    permission: "settings.devices",
  },
  {
    id: "notifications",
    href: "/settings/notifications",
    label: "Notifications",
    description: "Operational alert preferences",
    icon: Bell,
  },
  {
    id: "security",
    href: "/settings/security",
    label: "Security",
    description: "Password and session policies",
    icon: Shield,
    permission: "settings.security",
  },
  {
    id: "branding",
    href: "/settings/branding",
    label: "Branding",
    description: "Colors, logo, and theme",
    icon: Palette,
    permission: "settings.branding",
  },
  {
    id: "preferences",
    href: "/settings/preferences",
    label: "Preferences",
    description: "Formats, theme, and pagination",
    icon: SlidersHorizontal,
  },
];

export const TAX_MODE_LABELS = {
  inclusive: "Tax inclusive",
  exclusive: "Tax exclusive",
} as const;

export const ROUNDING_RULE_LABELS = {
  none: "No rounding",
  nearest: "Nearest",
  up: "Round up",
  down: "Round down",
} as const;

export const PAPER_SIZE_LABELS = {
  "58mm": "58mm thermal",
  "80mm": "80mm thermal",
  A4: "A4",
  Letter: "Letter",
} as const;

export const PRINT_LAYOUT_LABELS = {
  compact: "Compact",
  standard: "Standard",
  detailed: "Detailed",
} as const;

export const PRINTER_ROLE_LABELS = {
  kitchen: "Kitchen printer",
  billing: "Billing printer",
  receipt: "Receipt printer",
  label: "Label printer",
} as const;

export const PRINTER_CONNECTION_LABELS = {
  network: "Network (placeholder)",
  usb: "USB (placeholder)",
  bluetooth: "Bluetooth (placeholder)",
  placeholder: "Unassigned",
} as const;

export const DEVICE_TYPE_LABELS = {
  "pos-terminal": "POS terminal",
  "kitchen-display": "Kitchen display",
  tablet: "Tablet",
  mobile: "Mobile",
  desktop: "Desktop",
  scanner: "Scanner (placeholder)",
  "cash-drawer": "Cash drawer (placeholder)",
  "customer-display": "Customer display (placeholder)",
} as const;

export function defaultRestaurantSettings(
  restaurantId: string
): Omit<RestaurantSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    restaurantName: "",
    legalName: "",
    logo: "",
    email: "",
    phone: "",
    website: "",
    gstNumber: "",
    fssaiNumber: "",
    businessAddress: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    language: "en-IN",
    openingHours: "09:00",
    closingHours: "22:00",
    businessStatus: "open",
  };
}

export function defaultTaxSettings(
  restaurantId: string
): Omit<TaxSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    taxMode: "exclusive",
    roundingRule: "nearest",
    profiles: [
      {
        id: "default",
        name: "Standard GST",
        gstPercent: 5,
        cgstPercent: 2.5,
        sgstPercent: 2.5,
        igstPercent: 5,
        vatPercent: 0,
        serviceChargePercent: 0,
        isDefault: true,
      },
    ],
  };
}

export function defaultReceiptSettings(
  restaurantId: string
): Omit<ReceiptSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    header: "Thank you for dining with us",
    footer: "Visit again soon",
    logo: "",
    qrEnabled: false,
    barcodeEnabled: false,
    invoicePrefix: "INV-",
    receiptPrefix: "RCP-",
    receiptNotes: "",
    termsAndConditions: "",
    printLayout: "standard",
    paperSize: "80mm",
  };
}

export function defaultInvoiceSettings(
  restaurantId: string
): Omit<InvoiceSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    invoicePrefix: "INV-",
    nextInvoiceNumber: 1,
    invoiceNotes: "",
    defaultTerms: "Payment due upon receipt.",
    invoiceFooter: "",
    autoNumbering: true,
  };
}

export function defaultPrinterSettings(
  restaurantId: string
): Omit<PrinterSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    printers: [
      {
        id: "kitchen-1",
        name: "Kitchen printer",
        role: "kitchen",
        connectionType: "placeholder",
        address: "",
        enabled: false,
      },
      {
        id: "billing-1",
        name: "Billing printer",
        role: "billing",
        connectionType: "placeholder",
        address: "",
        enabled: false,
      },
      {
        id: "receipt-1",
        name: "Receipt printer",
        role: "receipt",
        connectionType: "placeholder",
        address: "",
        enabled: false,
      },
      {
        id: "label-1",
        name: "Label printer",
        role: "label",
        connectionType: "placeholder",
        address: "",
        enabled: false,
      },
    ],
    printQueueEnabled: false,
  };
}

export function defaultDeviceSettings(
  restaurantId: string
): Omit<DeviceSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    devices: [
      {
        id: "pos-1",
        name: "Main POS",
        type: "pos-terminal",
        status: "active",
        identifier: "",
        notes: "",
      },
      {
        id: "kds-1",
        name: "Kitchen display",
        type: "kitchen-display",
        status: "inactive",
        identifier: "",
        notes: "",
      },
    ],
  };
}

export function defaultNotificationSettings(
  restaurantId: string
): Omit<NotificationSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    orderNotifications: true,
    kitchenAlerts: true,
    billingAlerts: true,
    inventoryAlerts: true,
    purchaseAlerts: true,
    systemAlerts: true,
    emailEnabled: false,
    smsEnabled: false,
    pushEnabled: false,
  };
}

export function defaultBrandSettings(
  restaurantId: string
): Omit<BrandSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    primaryColor: "#0F766E",
    secondaryColor: "#134E4A",
    logo: "",
    favicon: "",
    theme: "system",
    receiptBranding: true,
    invoiceBranding: true,
    emailBranding: false,
  };
}

export function defaultSecuritySettings(
  restaurantId: string
): Omit<SecuritySettings, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: false,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    lockoutMinutes: 15,
    mfaEnabled: false,
    allowedDevicesEnabled: false,
    ipRestrictionEnabled: false,
    auditLoginEvents: true,
    auditSettingsChanges: true,
  };
}

export function defaultSystemPreferences(
  restaurantId: string
): Omit<SystemPreferencesSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    dateFormat: "dd/MM/yyyy",
    timeFormat: "12h",
    currencyFormat: "symbol",
    numberFormat: "en-IN",
    defaultLanguage: "en-IN",
    defaultBranchId: null,
    theme: "system",
    paginationSize: 20,
    timezone: "Asia/Kolkata",
  };
}

export function defaultBranchSettings(
  restaurantId: string
): Omit<BranchSettingsData, "id" | "createdAt" | "updatedAt"> {
  return {
    restaurantId,
    branchId: null,
    branchName: "Main branch",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    phone: "",
    email: "",
    workingHoursStart: "09:00",
    workingHoursEnd: "22:00",
    managerName: "",
    status: "active",
  };
}
