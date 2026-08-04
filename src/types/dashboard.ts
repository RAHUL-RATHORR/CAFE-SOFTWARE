export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type StatTrend = {
  value: number;
  direction: "up" | "down" | "neutral";
  label: string;
};

export type DashboardStat = {
  id: string;
  title: string;
  value: string;
  description?: string;
  trend: StatTrend;
  accent: "primary" | "success" | "warning" | "danger";
};

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  table: string;
  items: number;
  total: number;
  status: OrderStatus;
  time: string;
};

export type QuickAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: "order" | "tables" | "kitchen" | "billing" | "customers" | "reports";
};

export type SalesPeriod = "today" | "week" | "month" | "year";

export type TodaySummaryItem = {
  id: string;
  label: string;
  value: string;
};

export type PopularMenuItem = {
  id: string;
  name: string;
  category: string;
  orders: number;
  price: string;
};

export type KitchenActivityItem = {
  id: string;
  orderNumber: string;
  statusLabel: string;
  time: string;
  tone: "primary" | "success" | "warning" | "muted";
};

export type BreadcrumbItemData = {
  label: string;
  href?: string;
};
