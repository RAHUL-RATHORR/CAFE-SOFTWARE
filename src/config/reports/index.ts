import type { ReportKind, ReportDatePreset } from "@/types/report";

export const REPORT_KIND_LABELS: Record<ReportKind, string> = {
  executive: "Executive Dashboard",
  sales: "Sales Report",
  orders: "Orders Report",
  revenue: "Revenue Report",
  customers: "Customer Report",
  inventory: "Inventory Report",
  purchases: "Purchase Report",
  kitchen: "Kitchen Report",
  staff: "Staff Performance",
  payments: "Payment Summary",
  taxes: "Tax Summary",
};

export const REPORT_NAV_ITEMS: Array<{
  kind: ReportKind;
  href: string;
  label: string;
  description: string;
}> = [
  {
    kind: "executive",
    href: "/reports",
    label: "Executive",
    description: "KPIs and operational overview",
  },
  {
    kind: "sales",
    href: "/reports/sales",
    label: "Sales",
    description: "Gross sales and item performance",
  },
  {
    kind: "orders",
    href: "/reports/orders",
    label: "Orders",
    description: "Volume, status, and order types",
  },
  {
    kind: "customers",
    href: "/reports/customers",
    label: "Customers",
    description: "Guests, loyalty, and spend",
  },
  {
    kind: "inventory",
    href: "/reports/inventory",
    label: "Inventory",
    description: "Stock value and low stock",
  },
  {
    kind: "purchases",
    href: "/reports/purchases",
    label: "Purchases",
    description: "Vendor spend and PO status",
  },
  {
    kind: "kitchen",
    href: "/reports/kitchen",
    label: "Kitchen",
    description: "Ticket flow and completion",
  },
  {
    kind: "staff",
    href: "/reports/staff",
    label: "Staff",
    description: "Chef and cashier activity",
  },
  {
    kind: "payments",
    href: "/reports/payments",
    label: "Payments",
    description: "Methods and settlement",
  },
  {
    kind: "taxes",
    href: "/reports/taxes",
    label: "Taxes",
    description: "Tax collected summary",
  },
];

export const REPORT_DATE_PRESET_LABELS: Record<ReportDatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This week",
  month: "This month",
  quarter: "This quarter",
  year: "This year",
  custom: "Custom",
};

export const REPORT_EXPORT_FORMATS = [
  "pdf",
  "excel",
  "csv",
  "print",
  "email",
] as const;
