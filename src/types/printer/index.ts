export const THERMAL_PAPER_WIDTHS = ["58mm", "80mm"] as const;
export type ThermalPaperWidth = (typeof THERMAL_PAPER_WIDTHS)[number];

export const PRINTER_CONNECTION_TYPES = [
  "network",
  "usb",
  "bluetooth",
] as const;
export type PrinterConnectionType = (typeof PRINTER_CONNECTION_TYPES)[number];

export const PRINTER_ROLES = [
  "receipt",
  "kitchen",
  "billing",
] as const;
export type PrinterRole = (typeof PRINTER_ROLES)[number];

export const PRINTER_STATUSES = [
  "connected",
  "disconnected",
  "unknown",
  "error",
] as const;
export type PrinterStatus = (typeof PRINTER_STATUSES)[number];

export type PrinterConfig = {
  id: string;
  restaurantId: string;
  branchId: string;
  name: string;
  type: PrinterRole;
  connectionType: PrinterConnectionType;
  address: string;
  port: number;
  paperWidth: ThermalPaperWidth;
  characterWidth: number;
  autoCut: boolean;
  openCashDrawer: boolean;
  printLogo: boolean;
  printFooter: boolean;
  footerText: string;
  autoPrint: boolean;
  isDefault: boolean;
  isActive: boolean;
  status: PrinterStatus;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePrinterInput = {
  branchId: string;
  name: string;
  type?: PrinterRole;
  connectionType: PrinterConnectionType;
  address: string;
  port?: number;
  paperWidth?: ThermalPaperWidth;
  characterWidth?: number;
  autoCut?: boolean;
  openCashDrawer?: boolean;
  printLogo?: boolean;
  printFooter?: boolean;
  footerText?: string;
  autoPrint?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
};

export type UpdatePrinterInput = Partial<CreatePrinterInput>;

export type PrintJobResult = {
  success: boolean;
  jobId: string;
  status: "PRINTED" | "QUEUED" | "FAILED" | "FALLBACK_BROWSER";
  transport: "network" | "bridge" | "browser";
  printerName: string;
  paperWidth: ThermalPaperWidth;
  previewText: string;
  rawPayloadBase64?: string;
  error?: string;
};

export type PrintReceiptInput = {
  billId: string;
  printerId?: string;
  branchId?: string;
  isReprint?: boolean;
};
