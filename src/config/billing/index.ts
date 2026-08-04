import type {
  BillPaymentMethod,
  BillPaymentStatus,
  DiscountType,
  TaxType,
} from "@/types/billing";

export const BILL_PAYMENT_STATUS_LABELS: Record<BillPaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  "partially-paid": "Partially Paid",
  refunded: "Refunded",
  failed: "Failed",
};

export const BILL_PAYMENT_STATUS_VARIANTS: Record<
  BillPaymentStatus,
  "secondary" | "success" | "warning" | "danger" | "info"
> = {
  pending: "secondary",
  paid: "success",
  "partially-paid": "warning",
  refunded: "danger",
  failed: "danger",
};

export const BILL_PAYMENT_METHOD_LABELS: Record<BillPaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  wallet: "Wallet",
  "bank-transfer": "Bank Transfer",
  multiple: "Multiple Payments",
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Percentage",
  fixed: "Fixed Amount",
};

export const TAX_TYPE_LABELS: Record<TaxType, string> = {
  gst: "GST",
  vat: "VAT",
  custom: "Custom Tax",
};

export const DEFAULT_TAX_RATE = 5;
export const DEFAULT_SERVICE_CHARGE_RATE = 0;
