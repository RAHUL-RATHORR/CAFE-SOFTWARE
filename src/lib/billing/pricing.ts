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
  if (type === "percentage") {
    return roundMoney(Math.min(subtotal, (subtotal * value) / 100));
  }
  return roundMoney(Math.min(subtotal, value));
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
