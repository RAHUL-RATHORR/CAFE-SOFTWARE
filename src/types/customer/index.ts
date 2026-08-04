/**
 * Customer CRM domain types.
 */

export const CUSTOMER_STATUSES = [
  "active",
  "inactive",
  "blocked",
  "vip",
] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const CUSTOMER_GENDERS = [
  "female",
  "male",
  "non-binary",
  "prefer-not-to-say",
  "other",
] as const;

export type CustomerGender = (typeof CUSTOMER_GENDERS)[number];

export const CUSTOMER_ORDER_TYPES = [
  "dine-in",
  "take-away",
  "delivery",
  "any",
] as const;

export type CustomerPreferredOrderType =
  (typeof CUSTOMER_ORDER_TYPES)[number];

export type CustomerAddress = {
  label: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  landmark: string;
  isDefault: boolean;
};

export type CustomerNote = {
  id: string;
  body: string;
  createdBy: string | null;
  createdAt: string;
};

export type CustomerStatusHistoryEntry = {
  status: CustomerStatus;
  changedAt: string;
  changedBy: string | null;
  note: string;
};

export type CustomerLoyalty = {
  points: number;
  /** FUTURE PLACEHOLDER */
  rewardLevel: string | null;
  /** FUTURE PLACEHOLDER */
  membershipTier: string | null;
  /** FUTURE PLACEHOLDER */
  couponCodes: string[];
  /** FUTURE PLACEHOLDER */
  referralCode: string | null;
};

export type Customer = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  customerCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  anniversary: string | null;
  gender: CustomerGender | null;
  avatar: string;
  addresses: CustomerAddress[];
  tags: string[];
  notes: string;
  noteEntries: CustomerNote[];
  loyaltyPoints: number;
  loyalty: CustomerLoyalty;
  totalOrders: number;
  totalSpent: number;
  lastVisit: string | null;
  preferredOrderType: CustomerPreferredOrderType;
  preferredTable: string | null;
  status: CustomerStatus;
  statusHistory: CustomerStatusHistoryEntry[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListResult = {
  items: Customer[];
  meta: import("@/types/database").PaginationMeta;
};

export type CustomerSortField =
  | "fullName"
  | "customerCode"
  | "email"
  | "phone"
  | "status"
  | "totalOrders"
  | "totalSpent"
  | "lastVisit"
  | "loyaltyPoints"
  | "createdAt";

export type CustomerSelectOption = {
  value: string;
  label: string;
  meta?: string;
};

export type CustomerOrderHistoryItem = {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  grandTotal: number;
  createdAt: string;
};

export type CustomerVisitHistoryItem = {
  id: string;
  label: string;
  occurredAt: string;
  source: "order" | "bill" | "manual";
};

export type CustomerBillingSummary = {
  billsCount: number;
  totalBilled: number;
  totalPaid: number;
  lastInvoiceNumber: string | null;
};

export type CustomerProfile = {
  customer: Customer;
  orderHistory: CustomerOrderHistoryItem[];
  visitHistory: CustomerVisitHistoryItem[];
  billingSummary: CustomerBillingSummary;
};

export type CustomerActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_CUSTOMER"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type CustomerActionError = {
  code: CustomerActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type CustomerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: CustomerActionError };
