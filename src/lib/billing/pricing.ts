import { DEFAULT_TAX_RATE } from "@/config/billing";
import type {
  BillDiscount,
  BillLineItem,
  BillTax,
  DiscountType,
  TaxType,
} from "@/types/billing";

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeLineSubtotal(input: {
  price: number;
  quantity: number;
  discount?: number;
  tax?: number;
}): number {
  return roundMoney(
    Math.max(
      0,
      input.quantity * input.price - (input.discount ?? 0) + (input.tax ?? 0)
    )
  );
}

export function computeDiscountAmount(
  subtotal: number,
  type: DiscountType,
  value: number
): number {
  if (value <= 0 || subtotal <= 0) return 0;
  if (type === "percentage") {
    return roundMoney(Math.min(subtotal, (subtotal * value) / 100));
  }
  return roundMoney(Math.min(subtotal, Math.max(0, value)));
}

export function computeTaxAmount(
  taxableBase: number,
  rate: number
): number {
  return roundMoney((taxableBase * rate) / 100);
}

export function computeBillTotals(input: {
  items: Array<{
    price: number;
    quantity: number;
    discount?: number;
    tax?: number;
    subtotal?: number;
  }>;
  discountType?: DiscountType;
  discountValue?: number;
  taxType?: TaxType;
  taxLabel?: string;
  taxRate?: number;
  serviceCharge?: number;
}) {
  const normalizedItems = input.items.map((item) => {
    const discount = roundMoney(item.discount ?? 0);
    const tax = roundMoney(item.tax ?? 0);
    const price = roundMoney(item.price);
    const subtotal =
      item.subtotal != null
        ? roundMoney(item.subtotal)
        : computeLineSubtotal({
            price,
            quantity: item.quantity,
            discount,
            tax,
          });
    return { price, quantity: item.quantity, discount, tax, subtotal };
  });

  const itemsSubtotal = roundMoney(
    normalizedItems.reduce((sum, item) => sum + item.subtotal, 0)
  );

  const discountType = input.discountType ?? "fixed";
  const discountValue = input.discountValue ?? 0;
  const discountAmount = computeDiscountAmount(
    itemsSubtotal,
    discountType,
    discountValue
  );

  const afterDiscount = Math.max(0, itemsSubtotal - discountAmount);
  const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
  const taxAmount = computeTaxAmount(afterDiscount, taxRate);
  const serviceCharge = roundMoney(input.serviceCharge ?? 0);
  const grandTotal = roundMoney(afterDiscount + taxAmount + serviceCharge);

  const discountConfig: BillDiscount = {
    type: discountType,
    value: discountValue,
    amount: discountAmount,
    couponCode: "",
  };

  const taxConfig: BillTax = {
    type: input.taxType ?? "gst",
    label: input.taxLabel ?? "GST",
    rate: taxRate,
    amount: taxAmount,
  };

  return {
    items: normalizedItems,
    subtotal: itemsSubtotal,
    discount: discountAmount,
    discountConfig,
    tax: taxAmount,
    taxConfig,
    serviceCharge,
    grandTotal,
  };
}

export function calculateGstTaxBreakdown(input: {
  taxableAmount: number;
  taxRate?: number;
  taxMode?: "exclusive" | "inclusive";
  isInterState?: boolean;
  customCgstRate?: number;
  customSgstRate?: number;
  customIgstRate?: number;
}): import("@/types/billing").GstBreakdown {
  const taxableAmount = Math.max(0, roundMoney(input.taxableAmount));
  const taxRate = Math.max(0, input.taxRate ?? DEFAULT_TAX_RATE);
  const taxMode = input.taxMode ?? "exclusive";
  const isInterState = Boolean(input.isInterState);

  let baseAmount = taxableAmount;
  let totalTax = 0;

  if (taxMode === "inclusive") {
    baseAmount = roundMoney(taxableAmount / (1 + taxRate / 100));
    totalTax = roundMoney(taxableAmount - baseAmount);
  } else {
    totalTax = roundMoney((taxableAmount * taxRate) / 100);
  }

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = input.customIgstRate ?? taxRate;
    igstAmount = totalTax;
  } else {
    cgstRate = input.customCgstRate ?? roundMoney(taxRate / 2);
    sgstRate = input.customSgstRate ?? roundMoney(taxRate / 2);
    cgstAmount = roundMoney(totalTax / 2);
    sgstAmount = roundMoney(totalTax - cgstAmount);
  }

  return {
    taxableAmount: baseAmount,
    taxRate,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTax,
    taxMode,
    isInterState,
  };
}

export function calculateCashChange(
  totalDue: number,
  cashReceived: number
): {
  isValid: boolean;
  changeAmount: number;
  shortfall: number;
} {
  const due = roundMoney(Math.max(0, totalDue));
  const received = roundMoney(Math.max(0, cashReceived));
  if (received < due) {
    return {
      isValid: false,
      changeAmount: 0,
      shortfall: roundMoney(due - received),
    };
  }
  return {
    isValid: true,
    changeAmount: roundMoney(received - due),
    shortfall: 0,
  };
}

export function validateSplitPayments(
  totalDue: number,
  tenders: import("@/types/billing").PosPaymentTender[]
): {
  isValid: boolean;
  totalPaid: number;
  remainingDue: number;
  error?: string;
} {
  const due = roundMoney(Math.max(0, totalDue));
  const totalPaid = roundMoney(
    tenders.reduce((sum, t) => sum + Math.max(0, t.amount), 0)
  );
  const remainingDue = roundMoney(Math.max(0, due - totalPaid));
  if (tenders.length === 0) {
    return {
      isValid: false,
      totalPaid: 0,
      remainingDue: due,
      error: "No payment tenders provided",
    };
  }
  for (const t of tenders) {
    if (t.amount <= 0) {
      return {
        isValid: false,
        totalPaid,
        remainingDue,
        error: "Tender amounts must be positive",
      };
    }
  }
  if (totalPaid < due) {
    return {
      isValid: false,
      totalPaid,
      remainingDue,
      error: `Payment incomplete. Shortfall: ₹${remainingDue}`,
    };
  }
  return { isValid: true, totalPaid, remainingDue: 0 };
}

export function buildInvoiceNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${y}${m}${d}-${suffix}`;
}

export function normalizeBillLines(
  items: Array<{
    menuItemId?: string | null;
    name: string;
    price: number;
    quantity: number;
    discount?: number;
    tax?: number;
    subtotal?: number;
    notes?: string;
    modifiers?: string[];
  }>
): BillLineItem[] {
  return items.map((item) => ({
    menuItemId: item.menuItemId ?? null,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    discount: item.discount ?? 0,
    tax: item.tax ?? 0,
    subtotal:
      item.subtotal ??
      computeLineSubtotal({
        price: item.price,
        quantity: item.quantity,
        discount: item.discount,
        tax: item.tax,
      }),
    notes: item.notes ?? "",
    modifiers: item.modifiers ?? [],
  }));
}
