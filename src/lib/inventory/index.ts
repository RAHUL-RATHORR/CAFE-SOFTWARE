import type { IngredientDocument } from "@/models/inventory";
import type {
  Ingredient,
  IngredientStatus,
  InventoryUnit,
} from "@/types/inventory";

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

export function serializeIngredient(doc: IngredientDocument): Ingredient {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    ingredientCode: doc.ingredientCode,
    name: doc.name,
    unit: (doc.unit ?? "piece") as InventoryUnit,
    currentStock: Number(doc.currentStock ?? 0),
    reorderLevel: Number(doc.reorderLevel ?? 0),
    status: (doc.status ?? "active") as IngredientStatus,
    notes: doc.notes ?? "",
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}

/**
 * FUTURE PLACEHOLDER — inventory stock update.
 * Intentionally a no-op until the inventory module owns mutations.
 */
export async function applyInventoryStockUpdatePlaceholder(
  _payload: unknown
): Promise<{ applied: false; reason: string }> {
  return {
    applied: false,
    reason: "Inventory stock updates are not enabled yet.",
  };
}
