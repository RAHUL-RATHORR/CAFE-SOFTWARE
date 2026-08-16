/**
 * Dining / restaurant table domain types.
 * Named RestaurantTable to avoid collision with data-table UI types.
 */

export const RESTAURANT_TABLE_STATUSES = [
  "available",
  "reserved",
  "occupied",
  "cleaning",
  "out-of-service",
] as const;

export type RestaurantTableStatus = (typeof RESTAURANT_TABLE_STATUSES)[number];

export const RESTAURANT_TABLE_SHAPES = [
  "round",
  "square",
  "rectangle",
  "oval",
  "custom",
] as const;

export type RestaurantTableShape = (typeof RESTAURANT_TABLE_SHAPES)[number];

export type RestaurantTableQrSummary = {
  id: string;
  token: string;
  publicUrl: string;
  isActive: boolean;
};

export type RestaurantTable = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  floorId: string | null;
  floorLabel?: string | null;
  tableNumber: string;
  tableName: string;
  capacity: number;
  shape: RestaurantTableShape;
  status: RestaurantTableStatus;
  location: string;
  qrCodePlaceholder: string;
  notes: string;
  isActive: boolean;
  displayOrder: number;
  /** Active opaque table QR when available */
  qr?: RestaurantTableQrSummary | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RestaurantTableListResult = {
  items: RestaurantTable[];
  meta: import("@/types/database").PaginationMeta;
};

export type RestaurantTableSortField =
  | "tableNumber"
  | "tableName"
  | "capacity"
  | "status"
  | "displayOrder"
  | "createdAt"
  | "isActive";

export type BulkTablePreviewItem = {
  tableNumber: string;
  tableName: string;
  capacity: number;
  status: "creatable" | "skipped" | "conflict";
  reason?: string;
};

export type BulkTablePreviewResult = {
  branchId: string;
  creatable: BulkTablePreviewItem[];
  skipped: BulkTablePreviewItem[];
  conflicting: BulkTablePreviewItem[];
  requestedCount: number;
};

export type BulkTableCreateResult = {
  created: RestaurantTable[];
  skipped: BulkTablePreviewItem[];
  conflicting: BulkTablePreviewItem[];
};

export type RestaurantTableActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_TABLE_NUMBER"
  | "BRANCH_INACTIVE"
  | "QR_FEATURE_UNAVAILABLE"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT"
  | "PLAN_LIMIT_REACHED";

export type RestaurantTableActionError = {
  code: RestaurantTableActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type RestaurantTableActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: RestaurantTableActionError };

export type FloorOption = {
  value: string;
  label: string;
};
