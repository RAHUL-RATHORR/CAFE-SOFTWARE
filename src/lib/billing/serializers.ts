import { getCustomerLabel } from "@/config/orders";
import type { BillDocument } from "@/models/billing";
import type { PaymentDocument } from "@/models/billing";
import type {
  Bill,
  BillLineItem,
  BillPaymentMethod,
  BillPaymentStatus,
  DiscountType,
  Payment,
  PaymentRecordStatus,
  TaxType,
} from "@/types/billing";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

export function serializeBillLineItem(item: {
  menuItemId?: unknown;
  name?: string;
  price?: number;
  quantity?: number;
  discount?: number;
  tax?: number;
  subtotal?: number;
  notes?: string;
  modifiers?: string[];
}): BillLineItem {
  return {
    menuItemId: idToString(item.menuItemId),
    name: item.name ?? "",
    price: item.price ?? 0,
    quantity: item.quantity ?? 1,
    discount: item.discount ?? 0,
    tax: item.tax ?? 0,
    subtotal: item.subtotal ?? 0,
    notes: item.notes ?? "",
    modifiers: item.modifiers ?? [],
  };
}

export function serializeBill(
  doc: BillDocument,
  labels?: { orderNumber?: string | null; customerLabel?: string | null }
): Bill {
  const customerId = idToString(doc.customerId);
  const amountPaid = doc.amountPaid ?? 0;
  const grandTotal = doc.grandTotal ?? 0;
  const discountConfig = doc.discountConfig as {
    kind?: DiscountType;
    type?: DiscountType;
    value?: number;
    amount?: number;
    couponCode?: string;
  } | null;
  const taxConfig = doc.taxConfig as {
    kind?: TaxType;
    type?: TaxType;
    label?: string;
    rate?: number;
    amount?: number;
  } | null;
  const splitConfig = doc.splitConfig as {
    enabled?: boolean;
    mode?: Bill["splitConfig"]["mode"];
    parties?: Bill["splitConfig"]["parties"];
  } | null;

  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    orderId: idToString(doc.orderId),
    orderNumber: labels?.orderNumber ?? null,
    customerId,
    customerLabel:
      labels?.customerLabel ?? getCustomerLabel(customerId) ?? null,
    invoiceNumber: doc.invoiceNumber,
    items: (doc.items ?? []).map((item) =>
      serializeBillLineItem(item as Parameters<typeof serializeBillLineItem>[0])
    ),
    subtotal: doc.subtotal ?? 0,
    discount: doc.discount ?? 0,
    discountConfig: {
      type: (discountConfig?.kind ?? discountConfig?.type ?? "fixed") as DiscountType,
      value: discountConfig?.value ?? 0,
      amount: discountConfig?.amount ?? doc.discount ?? 0,
      couponCode: discountConfig?.couponCode ?? "",
    },
    tax: doc.tax ?? 0,
    taxConfig: {
      type: (taxConfig?.kind ?? taxConfig?.type ?? "gst") as TaxType,
      label: taxConfig?.label ?? "GST",
      rate: taxConfig?.rate ?? 0,
      amount: taxConfig?.amount ?? doc.tax ?? 0,
    },
    serviceCharge: doc.serviceCharge ?? 0,
    grandTotal,
    amountPaid,
    amountDue: Math.max(0, Math.round((grandTotal - amountPaid) * 100) / 100),
    paymentStatus: (doc.paymentStatus ?? "pending") as BillPaymentStatus,
    paymentMethod: (doc.paymentMethod ?? "cash") as BillPaymentMethod,
    notes: doc.notes ?? "",
    cashierId: idToString(doc.cashierId),
    splitConfig: {
      enabled: Boolean(splitConfig?.enabled),
      mode: splitConfig?.mode ?? null,
      parties: splitConfig?.parties ?? [],
    },
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt ?? ""),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt ?? ""),
  };
}

export function serializePayment(
  doc: PaymentDocument,
  invoiceNumber?: string | null
): Payment {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    billId: idToString(doc.billId) ?? "",
    invoiceNumber: invoiceNumber ?? null,
    amount: doc.amount ?? 0,
    method: (doc.method ?? "cash") as BillPaymentMethod,
    status: (doc.status ?? "completed") as PaymentRecordStatus,
    reference: doc.reference ?? "",
    notes: doc.notes ?? "",
    refundAmount: doc.refundAmount ?? 0,
    refundedAt:
      doc.refundedAt instanceof Date
        ? doc.refundedAt.toISOString()
        : doc.refundedAt
          ? String(doc.refundedAt)
          : null,
    createdBy: idToString(doc.createdBy),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt ?? ""),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt ?? ""),
  };
}

export function formatBillingMoney(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatBillingDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function derivePaymentStatus(
  grandTotal: number,
  amountPaid: number
): BillPaymentStatus {
  if (amountPaid <= 0) return "pending";
  if (amountPaid + 0.001 >= grandTotal) return "paid";
  return "partially-paid";
}
