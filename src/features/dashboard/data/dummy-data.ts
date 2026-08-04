import type {
  DashboardStat,
  KitchenActivityItem,
  PopularMenuItem,
  QuickAction,
  RecentOrder,
  SalesPeriod,
  TodaySummaryItem,
} from "@/types";

export const RESTAURANT_PLACEHOLDER_NAME = "Sunrise Cafe";

export const dashboardStats: DashboardStat[] = [
  {
    id: "revenue",
    title: "Revenue",
    value: "$12,480",
    description: "Total sales today",
    accent: "primary",
    trend: { value: 12.4, direction: "up", label: "vs yesterday" },
  },
  {
    id: "orders",
    title: "Today's Orders",
    value: "186",
    description: "Orders placed today",
    accent: "success",
    trend: { value: 8.1, direction: "up", label: "vs yesterday" },
  },
  {
    id: "tables",
    title: "Occupied Tables",
    value: "24/36",
    description: "Currently occupied",
    accent: "warning",
    trend: { value: 2.0, direction: "neutral", label: "occupancy steady" },
  },
  {
    id: "customers",
    title: "Customers",
    value: "1,284",
    description: "Active this month",
    accent: "danger",
    trend: { value: 3.6, direction: "down", label: "vs last month" },
  },
];

export const salesPeriodOptions: { value: SalesPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export const salesChartBars: Record<SalesPeriod, number[]> = {
  today: [28, 44, 36, 62, 48, 74, 58, 80, 66, 52, 70, 84],
  week: [42, 58, 36, 72, 64, 88, 54],
  month: [38, 46, 52, 41, 60, 55, 68, 72, 49, 63, 70, 78],
  year: [48, 52, 61, 58, 70, 74, 80, 76, 69, 82, 88, 92],
};

export const recentOrders: RecentOrder[] = [
  {
    id: "1",
    orderNumber: "ORD-1042",
    customer: "Ava Thompson",
    table: "T-12",
    items: 4,
    total: 68.5,
    status: "preparing",
    time: "2 min ago",
  },
  {
    id: "2",
    orderNumber: "ORD-1041",
    customer: "Noah Patel",
    table: "T-04",
    items: 2,
    total: 24.0,
    status: "completed",
    time: "5 min ago",
  },
  {
    id: "3",
    orderNumber: "ORD-1040",
    customer: "Mia Chen",
    table: "T-18",
    items: 6,
    total: 112.75,
    status: "pending",
    time: "8 min ago",
  },
  {
    id: "4",
    orderNumber: "ORD-1039",
    customer: "Liam Brooks",
    table: "T-07",
    items: 3,
    total: 41.2,
    status: "completed",
    time: "14 min ago",
  },
  {
    id: "5",
    orderNumber: "ORD-1038",
    customer: "Sophia Rivera",
    table: "T-21",
    items: 5,
    total: 89.9,
    status: "cancelled",
    time: "21 min ago",
  },
  {
    id: "6",
    orderNumber: "ORD-1037",
    customer: "Ethan Cole",
    table: "T-09",
    items: 2,
    total: 32.0,
    status: "preparing",
    time: "26 min ago",
  },
];

export const quickActions: QuickAction[] = [
  {
    id: "new-order",
    title: "New Order",
    description: "Start a dine-in or takeaway order",
    href: "/orders",
    icon: "order",
  },
  {
    id: "manage-tables",
    title: "Manage Tables",
    description: "Update floor status and seating",
    href: "/tables",
    icon: "tables",
  },
  {
    id: "kitchen",
    title: "Kitchen",
    description: "Monitor preparation queues",
    href: "/kitchen",
    icon: "kitchen",
  },
  {
    id: "billing",
    title: "Billing",
    description: "Process payments and receipts",
    href: "/billing",
    icon: "billing",
  },
  {
    id: "customers",
    title: "Customers",
    description: "View guest profiles and history",
    href: "/customers",
    icon: "customers",
  },
  {
    id: "reports",
    title: "Reports",
    description: "Review sales and performance",
    href: "/reports",
    icon: "reports",
  },
];

export const todaySummary: TodaySummaryItem[] = [
  { id: "revenue", label: "Total Revenue", value: "$12,480" },
  { id: "orders", label: "Total Orders", value: "186" },
  { id: "aov", label: "Average Order Value", value: "$67.10" },
  { id: "tables", label: "Active Tables", value: "24" },
  { id: "bills", label: "Pending Bills", value: "7" },
];

export const popularMenuItems: PopularMenuItem[] = [
  {
    id: "1",
    name: "Truffle Pasta",
    category: "Mains",
    orders: 48,
    price: "$22.00",
  },
  {
    id: "2",
    name: "Citrus Salmon",
    category: "Mains",
    orders: 41,
    price: "$28.50",
  },
  {
    id: "3",
    name: "Garden Bowl",
    category: "Salads",
    orders: 36,
    price: "$16.00",
  },
  {
    id: "4",
    name: "Espresso Affogato",
    category: "Desserts",
    orders: 33,
    price: "$9.50",
  },
];

export const kitchenActivity: KitchenActivityItem[] = [
  {
    id: "1",
    orderNumber: "#102",
    statusLabel: "Preparing",
    time: "1 min ago",
    tone: "primary",
  },
  {
    id: "2",
    orderNumber: "#103",
    statusLabel: "Ready",
    time: "3 min ago",
    tone: "success",
  },
  {
    id: "3",
    orderNumber: "#104",
    statusLabel: "Served",
    time: "7 min ago",
    tone: "muted",
  },
  {
    id: "4",
    orderNumber: "#101",
    statusLabel: "Pending",
    time: "9 min ago",
    tone: "warning",
  },
];
