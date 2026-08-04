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

export type RestaurantTableActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_TABLE_NUMBER"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

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
