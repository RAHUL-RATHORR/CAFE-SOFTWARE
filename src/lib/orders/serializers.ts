import { getCustomerLabel } from "@/config/orders";
import type { OrderDocument } from "@/models/order";
import type {
  OrderLineItem,
  OrderPriority,
  OrderStatusHistoryEntry,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  RestaurantOrder,
  RestaurantOrderStatus,
} from "@/types/order";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

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

export function serializeOrderLineItem(item: {
  menuItemId?: unknown;
  name?: string;
  price?: number;
  unitPrice?: number;
  quantity?: number;
  discount?: number;
  tax?: number;
  subtotal?: number;
  lineTotal?: number;
  notes?: string;
}): OrderLineItem {
  const quantity = item.quantity ?? 1;
  const price = item.price ?? item.unitPrice ?? 0;
  const discount = item.discount ?? 0;
  const tax = item.tax ?? 0;
  const subtotal =
    item.subtotal != null
      ? roundMoney(item.subtotal)
      : item.lineTotal != null
        ? roundMoney(item.lineTotal)
        : computeLineSubtotal({ price, quantity, discount, tax });

  return {
    menuItemId: idToString(item.menuItemId),
    name: item.name ?? "",
    price,
    quantity,
    discount,
    tax,
    subtotal,
    notes: item.notes ?? "",
  };
}

function serializeStatusHistory(
  entries: OrderDocument["statusHistory"] | undefined
): OrderStatusHistoryEntry[] {
  return (entries ?? []).map((entry) => ({
    status: entry.status as RestaurantOrderStatus,
    changedAt:
      entry.changedAt instanceof Date
        ? entry.changedAt.toISOString()
        : String(entry.changedAt ?? ""),
    changedBy: idToString(entry.changedBy),
    note: entry.note ?? "",
  }));
}

export function serializeOrder(
  doc: OrderDocument,
  labels?: { tableLabel?: string | null; customerLabel?: string | null }
): RestaurantOrder {
  const customerId = idToString(doc.customerId);
  const items = (doc.items ?? []).map((item) =>
    serializeOrderLineItem(item as Parameters<typeof serializeOrderLineItem>[0])
  );

  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    tableId: idToString(doc.tableId),
    tableLabel: labels?.tableLabel ?? null,
    customerId,
    customerLabel:
      labels?.customerLabel ?? getCustomerLabel(customerId) ?? null,
    orderNumber: doc.orderNumber,
    orderType: (doc.orderType ?? "dine-in") as OrderType,
    status: (doc.status ?? "pending") as RestaurantOrderStatus,
    items,
    subtotal: doc.subtotal ?? 0,
    discount: doc.discount ?? 0,
    tax: doc.tax ?? 0,
    serviceCharge: doc.serviceCharge ?? 0,
    grandTotal: doc.grandTotal ?? 0,
    paymentStatus: (doc.paymentStatus ?? "pending") as PaymentStatus,
    paymentMethod: (doc.paymentMethod ?? "none") as PaymentMethod,
    priority: (doc.priority ?? "normal") as OrderPriority,
    assignedChefId: idToString(doc.assignedChefId),
    assignedChefLabel: null,
    notes: doc.notes ?? "",
    kitchenNotes: doc.kitchenNotes ?? "",
    statusHistory: serializeStatusHistory(doc.statusHistory),
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

export function formatOrderDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatOrderMoney(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function computeOrderTotals(input: {
  items: Array<{
    price: number;
    quantity: number;
    discount?: number;
    tax?: number;
    subtotal?: number;
  }>;
  discount?: number;
  tax?: number;
  serviceCharge?: number;
  subtotal?: number;
  grandTotal?: number;
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
    return {
      price,
      quantity: item.quantity,
      discount,
      tax,
      subtotal,
    };
  });

  const computedSubtotal = roundMoney(
    normalizedItems.reduce((sum, item) => sum + item.subtotal, 0)
  );
  const subtotal =
    input.subtotal != null ? roundMoney(input.subtotal) : computedSubtotal;
  const discount = roundMoney(input.discount ?? 0);
  const tax = roundMoney(input.tax ?? 0);
  const serviceCharge = roundMoney(input.serviceCharge ?? 0);
  const computedGrandTotal = roundMoney(
    Math.max(0, subtotal - discount + tax + serviceCharge)
  );
  const grandTotal =
    input.grandTotal != null
      ? roundMoney(input.grandTotal)
      : computedGrandTotal;

  return {
    items: normalizedItems,
    subtotal,
    discount,
    tax,
    serviceCharge,
    grandTotal,
  };
}

export function buildOrderNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `ORD-${y}${m}${d}-${suffix}`;
}

export function createInitialStatusHistory(
  status: RestaurantOrderStatus,
  changedBy?: string | null
): {
  status: RestaurantOrderStatus;
  changedAt: Date;
  changedBy: string | null;
  note: string;
} {
  return {
    status,
    changedAt: new Date(),
    changedBy: changedBy ?? null,
    note: "Order created",
  };
}
