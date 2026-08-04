/**
 * Vendor domain types.
 */

export const VENDOR_STATUSES = ["active", "inactive", "blocked"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export type Vendor = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  vendorCode: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  status: VendorStatus;
  rating: number;
  notes: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VendorListResult = {
  items: Vendor[];
  meta: import("@/types/database").PaginationMeta;
};

export type VendorSortField =
  | "companyName"
  | "vendorCode"
  | "email"
  | "phone"
  | "status"
  | "rating"
  | "createdAt";

export type VendorSelectOption = {
  value: string;
  label: string;
  meta?: string;
};

export type VendorActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_VENDOR"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type VendorActionError = {
  code: VendorActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type VendorActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: VendorActionError };
