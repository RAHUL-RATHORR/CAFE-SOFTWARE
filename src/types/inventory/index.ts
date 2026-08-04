/**
 * Inventory foundation types — ingredients & units for purchase integration.
 * Stock mutation logic is intentionally deferred.
 */

export const INVENTORY_UNITS = [
  "kg",
  "g",
  "liter",
  "ml",
  "piece",
  "box",
  "dozen",
  "pack",
] as const;

export type InventoryUnit = (typeof INVENTORY_UNITS)[number];

export const INGREDIENT_STATUSES = ["active", "inactive"] as const;
export type IngredientStatus = (typeof INGREDIENT_STATUSES)[number];

export type Ingredient = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  ingredientCode: string;
  name: string;
  unit: InventoryUnit;
  currentStock: number;
  reorderLevel: number;
  status: IngredientStatus;
  notes: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IngredientSelectOption = {
  value: string;
  label: string;
  meta?: string;
  unit?: InventoryUnit;
};

/** FUTURE PLACEHOLDER — inventory stock update payload */
export type InventoryStockUpdatePlaceholder = {
  ingredientId: string;
  quantityDelta: number;
  unit: InventoryUnit;
  source: "purchase-receipt" | "adjustment" | "waste" | "manual";
  referenceId?: string | null;
  note?: string;
};
