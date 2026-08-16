import type { RestaurantOrderStatus } from "@/types/order";
import type { QrCodeType } from "@/types/qr-ordering";

export const QR_CODE_TYPE_LABELS: Record<QrCodeType, string> = {
  restaurant: "Restaurant QR",
  branch: "Branch QR",
  table: "Table QR",
};

/** Public-facing labels — pending maps to "Order Received". */
export const PUBLIC_ORDER_STATUS_LABELS: Record<RestaurantOrderStatus, string> =
  {
    pending: "Order Received",
    confirmed: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    served: "Served",
    completed: "Completed",
    cancelled: "Cancelled",
  };

export const PUBLIC_TRACKING_STEPS: RestaurantOrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "served",
  "completed",
];

export const PUBLIC_DIETARY_LABELS = {
  all: "All",
  veg: "Vegetarian",
  "non-veg": "Non-Vegetarian",
  vegan: "Vegan",
  popular: "Popular",
  spicy: "Spicy",
} as const;

export function buildPublicMenuPath(
  restaurantSlug: string,
  segment?: string,
  table?: string
) {
  const base = `/menu/${encodeURIComponent(restaurantSlug)}`;
  const path = segment ? `${base}/${segment}` : base;
  if (!table) return path;
  const params = new URLSearchParams({ table });
  return `${path}?${params.toString()}`;
}

export function buildPublicOrderPath(
  tableToken: string,
  segment?: "cart" | "checkout" | "confirmation"
) {
  const base = `/order/${encodeURIComponent(tableToken)}`;
  return segment ? `${base}/${segment}` : base;
}

export function buildPublicOrderStatusPath(publicOrderToken: string) {
  return `/order/status/${encodeURIComponent(publicOrderToken)}`;
}

export function buildQrPlaceholderCode(input: {
  type: QrCodeType;
  restaurantId: string;
  branchId?: string | null;
  tableId?: string | null;
  tableNumber?: string | null;
}) {
  if (input.type === "table") {
    return `dineflow://table/${input.restaurantId}/${input.tableNumber ?? input.tableId ?? "unknown"}`;
  }
  if (input.type === "branch") {
    return `dineflow://branch/${input.restaurantId}/${input.branchId ?? "main"}`;
  }
  return `dineflow://restaurant/${input.restaurantId}`;
}
