import { getFloorLabel } from "@/config/tables";
import type { RestaurantTableDocument } from "@/models/restaurant-table";
import type {
  RestaurantTable,
  RestaurantTableShape,
  RestaurantTableStatus,
} from "@/types/restaurant-table";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

export function serializeRestaurantTable(
  doc: RestaurantTableDocument
): RestaurantTable {
  const floorId = idToString(doc.floorId);
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    floorId,
    floorLabel: getFloorLabel(floorId),
    tableNumber: doc.tableNumber,
    tableName: doc.tableName,
    capacity: doc.capacity ?? 1,
    shape: (doc.shape ?? "square") as RestaurantTableShape,
    status: (doc.status ?? "available") as RestaurantTableStatus,
    location: doc.location ?? "",
    qrCodePlaceholder: doc.qrCodePlaceholder ?? "",
    notes: doc.notes ?? "",
    isActive: Boolean(doc.isActive),
    displayOrder: doc.displayOrder ?? 0,
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

export function formatRestaurantTableDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function buildDefaultQrPlaceholder(
  restaurantId: string,
  tableNumber: string
): string {
  return `dineflow://table/${restaurantId}/${encodeURIComponent(tableNumber)}`;
}
