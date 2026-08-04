/**
 * Purchase order domain types.
 */

import type { InventoryUnit } from "@/types/inventory";

export const PURCHASE_STATUSES = [
  "draft",
  "pending",
  "approved",
  "ordered",
  "partially-received",
  "received",
  "cancelled",
] as const;

export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export type PurchaseItem = {
  ingredientId: string | null;
  name: string;
  quantity: number;
  unit: InventoryUnit;
  unitPrice: number;
  discount: number;
  tax: number;
  subtotal: number;
  /** FUTURE — quantity received against this line */
  quantityReceived: number;
};

export type PurchaseStatusHistoryEntry = {
  status: PurchaseStatus;
  changedAt: string;
  changedBy: string | null;
  note: string;
};

/** Goods receipt foundation — no automatic inventory updates */
export type GoodsReceiptFoundation = {
  /** FUTURE PLACEHOLDER — GRN number */
  grnNumber: string | null;
  /** FUTURE PLACEHOLDER — quality check status */
  qualityCheckStatus: "pending" | "passed" | "failed" | "skipped";
  /** FUTURE PLACEHOLDER — inventory sync flag */
  inventoryUpdatePending: boolean;
  /** Architecture marker */
  inventoryUpdatePlaceholder: true;
  receivedNotes: string;
};

export type PurchaseOrder = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  vendorId: string | null;
  vendorName: string | null;
  purchaseNumber: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  grandTotal: number;
  expectedDelivery: string | null;
  receivedDate: string | null;
  notes: string;
  statusHistory: PurchaseStatusHistoryEntry[];
  goodsReceipt: GoodsReceiptFoundation;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderListResult = {
  items: PurchaseOrder[];
  meta: import("@/types/database").PaginationMeta;
};

export type PurchaseSortField =
  | "purchaseNumber"
  | "status"
  | "grandTotal"
  | "expectedDelivery"
  | "receivedDate"
  | "createdAt";

export type PurchaseFormOptions = {
  vendors: Array<{ value: string; label: string; meta?: string }>;
  ingredients: Array<{
    value: string;
    label: string;
    meta?: string;
    unit?: InventoryUnit;
  }>;
};

export type PurchaseActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_PURCHASE"
  | "INVALID_STATUS"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type PurchaseActionError = {
  code: PurchaseActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type PurchaseActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: PurchaseActionError };
