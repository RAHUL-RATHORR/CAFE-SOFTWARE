/**
 * Reports & Analytics domain types.
 */

export const REPORT_KINDS = [
  "executive",
  "sales",
  "orders",
  "revenue",
  "customers",
  "inventory",
  "purchases",
  "kitchen",
  "staff",
  "payments",
  "taxes",
] as const;

export type ReportKind = (typeof REPORT_KINDS)[number];

export const REPORT_DATE_PRESETS = [
  "today",
  "yesterday",
  "week",
  "month",
  "quarter",
  "year",
  "custom",
] as const;

export type ReportDatePreset = (typeof REPORT_DATE_PRESETS)[number];

export type ReportChartPoint = {
  label: string;
  value: number;
  secondary?: number;
};

export type ReportNamedValue = {
  id: string;
  label: string;
  value: number;
  meta?: string;
};

export type ReportKpi = {
  id: string;
  title: string;
  value: string;
  description?: string;
  accent?: "primary" | "success" | "warning" | "danger";
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    label: string;
  };
};

export type ReportTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
};

export type ReportTableRow = Record<string, string | number | null>;

export type ReportTableResult = {
  columns: ReportTableColumn[];
  rows: ReportTableRow[];
  meta: import("@/types/database").PaginationMeta;
  totals?: Record<string, string | number>;
};

export type ReportFiltersState = {
  preset: ReportDatePreset;
  dateFrom: string;
  dateTo: string;
  branchId: string;
  categoryId: string;
  menuItemId: string;
  customerId: string;
  employeeId: string;
  paymentMethod: string;
  orderType: string;
  orderStatus: string;
  q: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

export type ExecutiveDashboardData = {
  kpis: ReportKpi[];
  revenueTrend: ReportChartPoint[];
  ordersByStatus: ReportChartPoint[];
  salesByOrderType: ReportChartPoint[];
  topSellingItems: ReportNamedValue[];
  topCustomers: ReportNamedValue[];
  topCategories: ReportNamedValue[];
  recentSales: ReportNamedValue[];
  recentPayments: ReportNamedValue[];
  recentPurchases: ReportNamedValue[];
  lowStockItems: ReportNamedValue[];
  kitchenPerformance: ReportChartPoint[];
};

export type ModuleReportData = {
  kind: ReportKind;
  title: string;
  description: string;
  kpis: ReportKpi[];
  charts: {
    id: string;
    title: string;
    type: "line" | "bar" | "area" | "pie" | "donut";
    points: ReportChartPoint[];
  }[];
  table: ReportTableResult;
  summary: ReportNamedValue[];
};

/** Export foundation — no external integrations */
export type ReportExportFormat = "pdf" | "excel" | "csv" | "print" | "email";

export type ReportExportRequest = {
  kind: ReportKind;
  format: ReportExportFormat;
  filters: Partial<ReportFiltersState>;
};

export type ReportExportPlaceholder = {
  supported: true;
  formats: ReportExportFormat[];
  scheduledReportsPlaceholder: true;
  emailReportPlaceholder: true;
  message: string;
};

/** Saved reports / filters foundation */
export type SavedReportPlaceholder = {
  id: string;
  name: string;
  kind: ReportKind;
  filters: Partial<ReportFiltersState>;
  createdAt: string;
};

export type ReportActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT"
  | "EXPORT_NOT_READY";

export type ReportActionError = {
  code: ReportActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type ReportActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ReportActionError };
