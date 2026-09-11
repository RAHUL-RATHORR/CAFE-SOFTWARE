import { convertUnitQuantity } from "./unit-converter";
import type { InventoryUnit, StockStatus } from "@/types/inventory";

/**
 * Calculates effective consumption taking optional wastage percentage into account.
 * E.g. 150g with 5% wastage = 157.5g
 */
export function calculateEffectiveQuantity(
  quantity: number,
  wastagePercentage = 0
): number {
  const safeQty = Math.max(0, quantity);
  const safeWastage = Math.max(0, wastagePercentage);
  const effective = safeQty * (1 + safeWastage / 100);
  return Math.round(effective * 10000) / 10000;
}

/**
 * Calculates estimated cost for a recipe ingredient line item.
 * Converts recipe quantity to ingredient's base unit, applies wastage,
 * and multiplies by ingredient's costPerUnit.
 */
export function calculateRecipeLineCost(
  recipeQty: number,
  recipeUnit: InventoryUnit,
  ingredientCostPerUnit: number,
  ingredientUnit: InventoryUnit,
  wastagePercentage = 0
): number {
  if (recipeQty <= 0 || ingredientCostPerUnit <= 0) {
    return 0;
  }

  const effectiveRecipeQty = calculateEffectiveQuantity(recipeQty, wastagePercentage);
  const normalizedQtyInIngredientUnit = convertUnitQuantity(
    effectiveRecipeQty,
    recipeUnit,
    ingredientUnit
  );

  const cost = normalizedQtyInIngredientUnit * ingredientCostPerUnit;
  return Math.round(cost * 100) / 100;
}

/**
 * Calculates total cost across an array of recipe line items.
 */
export function calculateTotalRecipeCost(
  lines: Array<{
    quantity: number;
    unit: InventoryUnit;
    costPerUnit: number;
    ingredientUnit: InventoryUnit;
    wastagePercentage?: number;
  }>
): number {
  let total = 0;
  for (const line of lines) {
    total += calculateRecipeLineCost(
      line.quantity,
      line.unit,
      line.costPerUnit,
      line.ingredientUnit,
      line.wastagePercentage || 0
    );
  }
  return Math.round(total * 100) / 100;
}

/**
 * Evaluates stock health status based on current and minimum stock / reorder thresholds.
 */
export function determineStockStatus(
  currentStock: number,
  minimumStock: number,
  reorderLevel?: number
): StockStatus {
  if (currentStock <= 0) {
    return "OUT_OF_STOCK";
  }
  if (currentStock <= minimumStock) {
    return "LOW_STOCK";
  }
  if (reorderLevel !== undefined && currentStock <= reorderLevel) {
    return "LOW_STOCK";
  }
  return "IN_STOCK";
}

export const calculateStockStatus = determineStockStatus;

/**
 * Computes asset valuation for a single item.
 */
export function calculateTotalStockValuation(
  currentStock: number,
  costPerUnit: number
): number {
  if (currentStock <= 0 || costPerUnit <= 0) {
    return 0;
  }
  return Math.round(currentStock * costPerUnit * 100) / 100;
}

/**
 * Computes total stock valuation across an array of ingredients.
 */
export function calculateTotalStockValue(
  ingredients: Array<{ currentStock: number; costPerUnit: number }>
): number {
  let total = 0;
  for (const item of ingredients) {
    total += calculateTotalStockValuation(item.currentStock, item.costPerUnit);
  }
  return Math.round(total * 100) / 100;
}
