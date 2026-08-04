import type { InventoryUnit } from "@/types/inventory";

export const INVENTORY_UNIT_LABELS: Record<InventoryUnit, string> = {
  kg: "Kilogram (kg)",
  g: "Gram (g)",
  liter: "Liter (L)",
  ml: "Milliliter (ml)",
  piece: "Piece",
  box: "Box",
  dozen: "Dozen",
  pack: "Pack",
};

/** Seed / fallback ingredient options until inventory UI exists */
export const PLACEHOLDER_INGREDIENT_OPTIONS = [
  {
    value: "67a000000000000000000301",
    label: "Coffee Beans",
    unit: "kg" as const,
    meta: "kg",
  },
  {
    value: "67a000000000000000000302",
    label: "Milk",
    unit: "liter" as const,
    meta: "liter",
  },
  {
    value: "67a000000000000000000303",
    label: "Sugar",
    unit: "kg" as const,
    meta: "kg",
  },
  {
    value: "67a000000000000000000304",
    label: "Tea Leaves",
    unit: "kg" as const,
    meta: "kg",
  },
  {
    value: "67a000000000000000000305",
    label: "Disposable Cups",
    unit: "pack" as const,
    meta: "pack",
  },
];
