import type {
  OrderSelectOption,
  OrderPriority,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  RestaurantOrderStatus,
} from "@/types/order";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  "dine-in": "Dine In",
  "take-away": "Take Away",
  delivery: "Delivery",
};

export const ORDER_STATUS_LABELS: Record<RestaurantOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_VARIANTS: Record<
  RestaurantOrderStatus,
  "secondary" | "info" | "warning" | "success" | "danger"
> = {
  pending: "secondary",
  confirmed: "info",
  preparing: "warning",
  ready: "info",
  served: "success",
  completed: "success",
  cancelled: "danger",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  "partially-paid": "Partially Paid",
  paid: "Paid",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_VARIANTS: Record<
  PaymentStatus,
  "secondary" | "warning" | "success" | "danger"
> = {
  pending: "secondary",
  "partially-paid": "warning",
  paid: "success",
  refunded: "danger",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  none: "None",
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  wallet: "Wallet",
  other: "Other",
};

export const ORDER_PRIORITY_LABELS: Record<OrderPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const ORDER_PRIORITY_VARIANTS: Record<
  OrderPriority,
  "secondary" | "info" | "warning" | "danger"
> = {
  low: "secondary",
  normal: "info",
  high: "warning",
  urgent: "danger",
};

/** Customer selection placeholders until Customer CRUD exists */
export const CUSTOMER_OPTIONS: OrderSelectOption[] = [
  { value: "67a000000000000000000201", label: "Walk-in Guest" },
  { value: "67a000000000000000000202", label: "Priya Sharma" },
  { value: "67a000000000000000000203", label: "Amit Patel" },
  { value: "67a000000000000000000204", label: "Sarah Khan" },
];

export const ORDER_TIMELINE_STATUSES: RestaurantOrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
];

export function getCustomerLabel(
  customerId: string | null | undefined
): string | null {
  if (!customerId) return null;
  return (
    CUSTOMER_OPTIONS.find((customer) => customer.value === customerId)
      ?.label ?? null
  );
}

export function isOrderEditable(status: RestaurantOrderStatus): boolean {
  return status !== "completed" && status !== "cancelled";
}
