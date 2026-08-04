import type { PurchaseOrderDocument } from "@/models/purchase";
import type {
  GoodsReceiptFoundation,
  PurchaseItem,
  PurchaseOrder,
  PurchaseStatus,
  PurchaseStatusHistoryEntry,
} from "@/types/purchase";
import type { InventoryUnit } from "@/types/inventory";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computePurchaseLineSubtotal(input: {
  unitPrice: number;
  quantity: number;
  discount?: number;
  tax?: number;
}): number {
  return roundMoney(
    Math.max(
      0,
      input.quantity * input.unitPrice -
        (input.discount ?? 0) +
        (input.tax ?? 0)
    )
  );
}

export function computePurchaseTotals(input: {
  items: Array<{
    unitPrice: number;
    quantity: number;
    discount?: number;
    tax?: number;
    subtotal?: number;
  }>;
  discount?: number;
  tax?: number;
  shippingCost?: number;
}) {
  const items = input.items.map((item) => {
    const discount = roundMoney(item.discount ?? 0);
    const tax = roundMoney(item.tax ?? 0);
    const unitPrice = roundMoney(item.unitPrice);
    const subtotal =
      item.subtotal != null
        ? roundMoney(item.subtotal)
        : computePurchaseLineSubtotal({
            unitPrice,
            quantity: item.quantity,
            discount,
            tax,
          });
    return { unitPrice, quantity: item.quantity, discount, tax, subtotal };
  });

  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.subtotal, 0)
  );
  const discount = roundMoney(input.discount ?? 0);
  const tax = roundMoney(input.tax ?? 0);
  const shippingCost = roundMoney(input.shippingCost ?? 0);
  const grandTotal = roundMoney(
    Math.max(0, subtotal - discount + tax + shippingCost)
  );

  return { items, subtotal, discount, tax, shippingCost, grandTotal };
}

export function buildPurchaseNumber(date = new Date()): string {
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `PO-${y}${m}${d}-${suffix}`;
}

export function createInitialPurchaseStatusHistory(
  status: PurchaseStatus,
  changedBy?: string | null
): PurchaseStatusHistoryEntry[] {
  return [
    {
      status,
      changedAt: new Date().toISOString(),
      changedBy: changedBy ?? null,
      note: "Purchase order created",
    },
  ];
}

export function defaultGoodsReceipt(): GoodsReceiptFoundation {
  return {
    grnNumber: null,
    qualityCheckStatus: "pending",
    inventoryUpdatePending: false,
    inventoryUpdatePlaceholder: true,
    receivedNotes: "",
  };
}

export function serializePurchaseItem(item: {
  ingredientId?: unknown;
  name?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  discount?: number;
  tax?: number;
  subtotal?: number;
  quantityReceived?: number;
}): PurchaseItem {
  const quantity = item.quantity ?? 1;
  const unitPrice = item.unitPrice ?? 0;
  const discount = item.discount ?? 0;
  const tax = item.tax ?? 0;
  const subtotal =
    item.subtotal != null
      ? roundMoney(item.subtotal)
      : computePurchaseLineSubtotal({
          unitPrice,
          quantity,
          discount,
          tax,
        });

  return {
    ingredientId: idToString(item.ingredientId),
    name: item.name ?? "",
    quantity,
    unit: (item.unit ?? "piece") as InventoryUnit,
    unitPrice,
    discount,
    tax,
    subtotal,
    quantityReceived: item.quantityReceived ?? 0,
  };
}

export function serializePurchaseOrder(
  doc: PurchaseOrderDocument,
  vendorName?: string | null
): PurchaseOrder {
  const goods = (doc.goodsReceipt ?? {}) as Partial<GoodsReceiptFoundation>;

  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    vendorId: idToString(doc.vendorId),
    vendorName: vendorName ?? null,
    purchaseNumber: doc.purchaseNumber,
    status: (doc.status ?? "draft") as PurchaseStatus,
    items: ((doc.items ?? []) as unknown as Array<Record<string, unknown>>).map(
      (item) => serializePurchaseItem(item)
    ),
    subtotal: Number(doc.subtotal ?? 0),
    discount: Number(doc.discount ?? 0),
    tax: Number(doc.tax ?? 0),
    shippingCost: Number(doc.shippingCost ?? 0),
    grandTotal: Number(doc.grandTotal ?? 0),
    expectedDelivery: toIsoDate(doc.expectedDelivery),
    receivedDate: toIsoDate(doc.receivedDate),
    notes: doc.notes ?? "",
    statusHistory: ((doc.statusHistory ?? []) as Array<{
      status?: PurchaseStatus;
      changedAt?: Date;
      changedBy?: unknown;
      note?: string;
    }>).map(
      (entry): PurchaseStatusHistoryEntry => ({
        status: (entry.status ?? "draft") as PurchaseStatus,
        changedAt: toIsoDate(entry.changedAt) ?? "",
        changedBy: idToString(entry.changedBy),
        note: entry.note ?? "",
      })
    ),
    goodsReceipt: {
      grnNumber: goods.grnNumber ?? null,
      qualityCheckStatus: goods.qualityCheckStatus ?? "pending",
      inventoryUpdatePending: Boolean(goods.inventoryUpdatePending),
      inventoryUpdatePlaceholder: true,
      receivedNotes: goods.receivedNotes ?? "",
    },
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}

export function formatPurchaseDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date
  );
}

export function formatPurchaseDateTime(
  value: string | null | undefined
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatPurchaseMoney(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * FUTURE PLACEHOLDER — prepare inventory stock updates from a receipt.
 * Does not mutate inventory.
 */
export function buildInventoryUpdatePlaceholders(
  purchase: PurchaseOrder
): Array<{
  ingredientId: string;
  quantityDelta: number;
  unit: InventoryUnit;
  source: "purchase-receipt";
  referenceId: string;
}> {
  return purchase.items
    .filter((item) => item.ingredientId && item.quantityReceived > 0)
    .map((item) => ({
      ingredientId: item.ingredientId!,
      quantityDelta: item.quantityReceived,
      unit: item.unit,
      source: "purchase-receipt" as const,
      referenceId: purchase.id,
    }));
}
