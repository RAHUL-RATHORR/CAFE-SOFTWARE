/**
 * QR Ordering & Customer Self-Service Portal types.
 */

import type { Category } from "@/types/category";
import type { MenuItem } from "@/types/menu-item";
import type { RestaurantOrder, RestaurantOrderStatus } from "@/types/order";

export const QR_CODE_TYPES = ["restaurant", "branch", "table"] as const;
export type QrCodeType = (typeof QR_CODE_TYPES)[number];

export const PUBLIC_DIETARY_FILTERS = [
  "all",
  "veg",
  "non-veg",
  "vegan",
  "popular",
  "spicy",
] as const;
export type PublicDietaryFilter = (typeof PUBLIC_DIETARY_FILTERS)[number];

export type PublicRestaurantInfo = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  currency: string;
  timezone: string;
  address: string;
  phone: string;
};

export type PublicTableInfo = {
  id: string;
  tableNumber: string;
  tableName: string;
  capacity: number;
  status: string;
};

export type PublicMenuPayload = {
  restaurant: PublicRestaurantInfo;
  table: PublicTableInfo | null;
  categories: Category[];
  featuredItems: MenuItem[];
  items: MenuItem[];
  qr: {
    type: QrCodeType;
    code: string;
    /** FUTURE PLACEHOLDER — dynamic QR payload */
    dynamicPayload: string;
    /** FUTURE PLACEHOLDER — validation */
    validated: boolean;
    /** FUTURE PLACEHOLDER — expiration */
    expired: boolean;
  };
};

export type GuestCartItem = {
  key: string;
  menuItemId: string | null;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  isVeg: boolean;
  image: string;
};

export type GuestOrderSummary = {
  subtotal: number;
  /** FUTURE PLACEHOLDER — tax calculation */
  tax: number;
  /** FUTURE PLACEHOLDER — service charge */
  serviceCharge: number;
  grandTotal: number;
};

export type QrCodeRecord = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  tableId: string | null;
  type: QrCodeType;
  code: string;
  token: string;
  isActive: boolean;
  /** FUTURE PLACEHOLDER — expiration */
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSessionRecord = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  tableId: string | null;
  sessionToken: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  /** FUTURE PLACEHOLDER — cart snapshot sync */
  cartSnapshot: GuestCartItem[];
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicOrderPlaceholderRecord = {
  id: string;
  restaurantId: string;
  tableId: string | null;
  orderId: string | null;
  trackingToken: string;
  orderNumber: string;
  guestName: string;
  guestPhone: string;
  status: RestaurantOrderStatus;
  /** FUTURE PLACEHOLDER — ETA minutes */
  estimatedMinutes: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicOrderTrackPayload = {
  placeholder: PublicOrderPlaceholderRecord;
  order: RestaurantOrder | null;
  timeline: Array<{
    status: RestaurantOrderStatus;
    label: string;
    completed: boolean;
    active: boolean;
  }>;
};

export type CustomerProfilePlaceholder = {
  orderHistory: unknown[];
  favoriteItems: unknown[];
  savedPreferences: Record<string, unknown>;
  /** FUTURE PLACEHOLDER — loyalty */
  loyaltyPoints: number;
};

export type QrOrderingActionErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RESTAURANT_NOT_FOUND"
  | "TABLE_NOT_FOUND"
  | "ORDER_NOT_FOUND"
  | "EMPTY_CART"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "QR_INVALID"
  | "QR_EXPIRED";

export type QrOrderingActionError = {
  code: QrOrderingActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type QrOrderingActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: QrOrderingActionError };
