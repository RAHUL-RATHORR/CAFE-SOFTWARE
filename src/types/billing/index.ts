/**
 * Billing & POS domain types.
 */

export const BILL_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "partially-paid",
  "refunded",
  "failed",
] as const;

export type BillPaymentStatus = (typeof BILL_PAYMENT_STATUSES)[number];

export const BILL_PAYMENT_METHODS = [
  "cash",
  "card",
  "upi",
  "wallet",
  "bank-transfer",
  "multiple",
] as const;

export type BillPaymentMethod = (typeof BILL_PAYMENT_METHODS)[number];

export const DISCOUNT_TYPES = ["percentage", "fixed"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const TAX_TYPES = ["gst", "vat", "custom"] as const;
export type TaxType = (typeof TAX_TYPES)[number];

export const SPLIT_MODES = ["by-item", "equal", "custom"] as const;
export type SplitMode = (typeof SPLIT_MODES)[number];

export type BillLineItem = {
  menuItemId: string | null;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  tax: number;
  subtotal: number;
  notes: string;
  /** FUTURE PLACEHOLDER — modifiers */
  modifiers: string[];
};

export type BillDiscount = {
  type: DiscountType;
  value: number;
  amount: number;
  /** FUTURE PLACEHOLDER — coupon codes */
  couponCode: string;
};

export type BillTax = {
  type: TaxType;
  label: string;
  rate: number;
  amount: number;
};

export type BillSplitConfig = {
  enabled: boolean;
  mode: SplitMode | null;
  /** FUTURE PLACEHOLDER — split party allocations */
  parties: Array<{
    label: string;
    amount: number;
    itemIndexes: number[];
  }>;
};

export type Bill = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  orderId: string | null;
  orderNumber: string | null;
  customerId: string | null;
  customerLabel: string | null;
  invoiceNumber: string;
  items: BillLineItem[];
  subtotal: number;
  discount: number;
  discountConfig: BillDiscount;
  tax: number;
  taxConfig: BillTax;
  serviceCharge: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: BillPaymentStatus;
  paymentMethod: BillPaymentMethod;
  notes: string;
  cashierId: string | null;
  splitConfig: BillSplitConfig;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentRecordStatus =
  | "completed"
  | "pending"
  | "failed"
  | "refunded";

export type Payment = {
  id: string;
  restaurantId: string;
  billId: string;
  invoiceNumber: string | null;
  amount: number;
  method: BillPaymentMethod;
  status: PaymentRecordStatus;
  reference: string;
  notes: string;
  refundAmount: number;
  refundedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  bill: Bill;
  payments: Payment[];
  issuedAt: string;
  restaurantName: string;
};

export type Receipt = {
  bill: Bill;
  payments: Payment[];
  printedAt: string | null;
  /** FUTURE PLACEHOLDER — printer / email delivery */
  delivery: {
    print: "pending";
    email: "pending";
  };
};

export type BillListResult = {
  items: Bill[];
  meta: import("@/types/database").PaginationMeta;
};

export type BillSortField =
  | "invoiceNumber"
  | "paymentStatus"
  | "grandTotal"
  | "createdAt"
  | "updatedAt";

export type BillingSummary = {
  dailySales: {
    billsCount: number;
    grossTotal: number;
    netCollected: number;
  };
  paymentSummary: Array<{
    method: BillPaymentMethod;
    count: number;
    amount: number;
  }>;
  cashierSummary: Array<{
    cashierId: string;
    billsCount: number;
    collected: number;
  }>;
  refundSummary: {
    count: number;
    amount: number;
  };
};

export type PosCatalogItem = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string | null;
  isAvailable: boolean;
  image: string;
};

export type PosCatalogCategory = {
  id: string;
  name: string;
};

export type PosCatalog = {
  categories: PosCatalogCategory[];
  items: PosCatalogItem[];
};

export type PosCartItem = {
  key: string;
  menuItemId: string | null;
  name: string;
  price: number;
  quantity: number;
  notes: string;
  modifiers: string[];
};

export type BillingActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_INVOICE"
  | "PAYMENT_INVALID"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type BillingActionError = {
  code: BillingActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type BillingActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: BillingActionError };
