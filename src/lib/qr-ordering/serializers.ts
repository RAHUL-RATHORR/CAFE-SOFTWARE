import type {
  CustomerSessionDocument,
  PublicOrderPlaceholderDocument,
  QrCodeDocument,
} from "@/models/qr-ordering";
import type {
  CustomerSessionRecord,
  GuestCartItem,
  PublicOrderPlaceholderRecord,
  QrCodeRecord,
} from "@/types/qr-ordering";
import type { RestaurantOrderStatus } from "@/types/order";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function serializeQrCode(doc: QrCodeDocument): QrCodeRecord {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    tableId: idToString(doc.tableId),
    type: doc.type as QrCodeRecord["type"],
    code: doc.code,
    token: doc.token,
    isActive: Boolean(doc.isActive),
    expiresAt: toIso(doc.expiresAt),
    metadata: (doc.metadata as Record<string, unknown>) ?? {},
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function serializeCustomerSession(
  doc: CustomerSessionDocument
): CustomerSessionRecord {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    tableId: idToString(doc.tableId),
    sessionToken: doc.sessionToken,
    guestName: doc.guestName ?? "",
    guestPhone: doc.guestPhone ?? "",
    guestEmail: doc.guestEmail ?? "",
    cartSnapshot: ((doc.cartSnapshot as GuestCartItem[]) ?? []).map((item) => ({
      key: item.key,
      menuItemId: item.menuItemId ?? null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes ?? "",
      isVeg: item.isVeg ?? true,
      image: item.image ?? "",
    })),
    expiresAt: toIso(doc.expiresAt),
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
  };
}

export function serializePublicOrderPlaceholder(
  doc: PublicOrderPlaceholderDocument
): PublicOrderPlaceholderRecord {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    tableId: idToString(doc.tableId),
    orderId: idToString(doc.orderId),
    trackingToken: doc.trackingToken,
    orderNumber: doc.orderNumber,
    guestName: doc.guestName ?? "",
    guestPhone: doc.guestPhone ?? "",
    status: doc.status as RestaurantOrderStatus,
    estimatedMinutes:
      doc.estimatedMinutes == null ? null : Number(doc.estimatedMinutes),
    notes: doc.notes ?? "",
    createdAt: toIso(doc.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(doc.updatedAt) ?? new Date().toISOString(),
  };
}
