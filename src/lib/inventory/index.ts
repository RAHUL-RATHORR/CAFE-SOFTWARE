export * from "./unit-converter";
export * from "./recipe-calculator";
export * from "./inventory-consumption-service";

import type { IngredientDocument } from "@/models/inventory";
import type {
  Ingredient,
  InventoryUnit,
  StockStatus,
} from "@/types/inventory";
import { calculateStockStatus } from "./recipe-calculator";

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
  const currentStock = Number(doc.currentStock ?? 0);
  const minimumStock = Number(doc.minimumStock ?? 0);
  const stockStatus: StockStatus = calculateStockStatus(currentStock, minimumStock);

  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId) ?? "",
    sku: doc.sku || "",
    name: doc.name,
    category: doc.category || "General",
    description: doc.description || "",
    unit: (doc.unit ?? "piece") as InventoryUnit,
    currentStock,
    minimumStock,
    reorderLevel: Number(doc.reorderLevel ?? 0),
    maximumStock: doc.maximumStock != null ? Number(doc.maximumStock) : null,
    costPerUnit: Number(doc.costPerUnit ?? 0),
    totalValuation: Math.round(currentStock * Number(doc.costPerUnit ?? 0) * 100) / 100,
    isActive: doc.isActive !== false,
    stockStatus,
    allowNegativeStock: doc.allowNegativeStock !== false,
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}
