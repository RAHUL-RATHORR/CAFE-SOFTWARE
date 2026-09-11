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

export type GstBreakdown = {
  taxableAmount: number;
  taxRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  taxMode: "exclusive" | "inclusive";
  isInterState: boolean;
};

export type PosCartLineCustomization = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
};

export type PosCustomizationOption = {
  id: string;
  name: string;
  priceDelta: number;
  isDefault?: boolean;
};

export type PosItemCustomizationGroup = {
  id: string;
  name: string;
  minSelections?: number;
  maxSelections?: number;
  isRequired?: boolean;
  options: PosCustomizationOption[];
};

export type PosPaymentTender = {
  method: "cash" | "upi" | "card" | "other";
  amount: number;
  reference?: string;
  cashReceived?: number;
  changeGiven?: number;
};

export type PosCheckoutInput = {
  branchId: string;
  tableId?: string | null;
  orderType: "dine-in" | "take-away" | "delivery";
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    notes?: string;
    customizations?: PosCartLineCustomization[];
  }>;
  discountType?: "fixed" | "percentage";
  discountValue?: number;
  couponCode?: string;
  isInterState?: boolean;
  paymentTenders: PosPaymentTender[];
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
};

export type PosCheckoutResult = {
  bill: Bill;
  order: import("@/types/order").RestaurantOrder;
  invoiceNumber: string;
  changeAmount: number;
  gstBreakdown: GstBreakdown;
};

export type PosTableOption = {
  id: string;
  tableNumber: string;
  tableName: string;
  status: "available" | "occupied" | "reserved" | "inactive";
  capacity: number;
  location?: string;
};

export type PosBranchOption = {
  id: string;
  name: string;
  branchCode: string;
  isMainBranch?: boolean;
  gstin?: string;
  address?: string;
};

export type InvoicePrintData = {
  invoiceNumber: string;
  orderNumber: string | null;
  issuedAt: string;
  restaurantName: string;
  legalName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  branchName: string;
  branchAddress: string;
  branchGstin: string;
  tableLabel: string | null;
  orderType: string;
  customerLabel: string | null;
  customerPhone: string | null;
  cashierName: string | null;
  items: Array<{
    name: string;
    quantity: number;
    rate: number;
    discount: number;
    amount: number;
    notes?: string;
    customizations?: string[];
  }>;
  subtotal: number;
  discount: number;
  discountLabel: string;
  taxableAmount: number;
  gstBreakdown: GstBreakdown;
  serviceCharge: number;
  grandTotal: number;
  amountPaid: number;
  changeGiven: number;
  paymentStatus: BillPaymentStatus;
  payments: Array<{
    method: string;
    amount: number;
    reference: string;
    timestamp: string;
  }>;
  footerNote: string;
};

export type PosCatalogItem = {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string | null;
  isAvailable: boolean;
  image: string;
  isVeg?: boolean;
  customizationGroups?: PosItemCustomizationGroup[];
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
  customizations?: PosCartLineCustomization[];
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

