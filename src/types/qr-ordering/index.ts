/**
 * QR Ordering & Customer Self-Service Portal types.
 */

import type { Category } from "@/types/category";
import type { MenuItem } from "@/types/menu-item";
import type {
  OrderLineCustomization,
  RestaurantOrder,
  RestaurantOrderStatus,
} from "@/types/order";

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

export type PublicBranchInfo = {
  id: string | null;
  name: string;
};

export type PublicOrderingPayload = {
  tableToken: string;
  restaurant: PublicRestaurantInfo;
  branch: PublicBranchInfo;
  table: PublicTableInfo;
  categories: Category[];
  featuredItems: MenuItem[];
  items: MenuItem[];
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
    dynamicPayload: string;
    validated: boolean;
    expired: boolean;
  };
};

export type GuestCartCustomization = {
  groupId: string;
  optionIds: string[];
};

export type GuestCartItem = {
  key: string;
  menuItemId: string | null;
  name: string;
  /** Display-only; server recomputes authoritative price */
  price: number;
  quantity: number;
  notes: string;
  isVeg: boolean;
  image: string;
  customizations: GuestCartCustomization[];
  customizationRows?: OrderLineCustomization[];
};

export type GuestOrderSummary = {
  subtotal: number;
  tax: number;
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
  restaurantName?: string;
  tableLabel?: string;
};

export type GuestOrderConfirmation = {
  orderNumber: string;
  trackingToken: string;
  tableLabel: string;
  grandTotal: number;
  currency: string;
  statusLabel: string;
};

export type CustomerProfilePlaceholder = {
  orderHistory: unknown[];
  favoriteItems: unknown[];
  savedPreferences: Record<string, unknown>;
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
  | "QR_EXPIRED"
  | "QR_REVOKED"
  | "TABLE_UNAVAILABLE"
  | "BRANCH_UNAVAILABLE"
  | "ORDERING_UNAVAILABLE"
  | "ITEM_UNAVAILABLE"
  | "PRICE_MISMATCH"
  | "FORBIDDEN";

export type QrOrderingActionError = {
  code: QrOrderingActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type QrOrderingActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: QrOrderingActionError };
