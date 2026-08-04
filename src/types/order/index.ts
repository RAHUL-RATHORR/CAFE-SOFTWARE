/**
 * Restaurant order domain types.
 * Named RestaurantOrder* to avoid collision with dashboard OrderStatus.
 */

export const ORDER_TYPES = ["dine-in", "take-away", "delivery"] as const;

export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
] as const;

export type RestaurantOrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "partially-paid",
  "paid",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "none",
  "cash",
  "card",
  "upi",
  "wallet",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ORDER_PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

export type OrderLineItem = {
  menuItemId: string | null;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  tax: number;
  subtotal: number;
  notes: string;
};

export type OrderStatusHistoryEntry = {
  status: RestaurantOrderStatus;
  changedAt: string;
  changedBy: string | null;
  note: string;
};

export type RestaurantOrder = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  tableId: string | null;
  tableLabel: string | null;
  customerId: string | null;
  customerLabel: string | null;
  orderNumber: string;
  orderType: OrderType;
  status: RestaurantOrderStatus;
  items: OrderLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  priority: OrderPriority;
  assignedChefId: string | null;
  assignedChefLabel: string | null;
  notes: string;
  kitchenNotes: string;
  statusHistory: OrderStatusHistoryEntry[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RestaurantOrderListResult = {
  items: RestaurantOrder[];
  meta: import("@/types/database").PaginationMeta;
};

export type RestaurantOrderSortField =
  | "orderNumber"
  | "orderType"
  | "status"
  | "paymentStatus"
  | "priority"
  | "grandTotal"
  | "createdAt"
  | "updatedAt";

export type OrderSelectOption = {
  value: string;
  label: string;
  meta?: string;
  price?: number;
};

export type OrderFormOptions = {
  tables: OrderSelectOption[];
  customers: OrderSelectOption[];
  menuItems: OrderSelectOption[];
};

export type OrderActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_ORDER_NUMBER"
  | "ORDER_LOCKED"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type OrderActionError = {
  code: OrderActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type OrderActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: OrderActionError };
