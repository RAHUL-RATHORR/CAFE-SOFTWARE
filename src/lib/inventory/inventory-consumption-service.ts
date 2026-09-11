import mongoose from "mongoose";
import { connectToDatabase, isValidObjectId, toObjectId } from "@/lib/database";
import { IngredientModel, StockMovementModel, RecipeModel } from "@/models/inventory";
import { convertUnit } from "./unit-converter";
import {
  InventoryConsumptionResult,
  StockShortageDetail,
  InventoryUnit,
} from "@/types/inventory";

export interface OrderItemForDeduction {
  menuItemId: string;
  name?: string;
  quantity: number;
  variantId?: string | null;
  selectedAddons?: Array<{
    addonOptionId: string;
    name?: string;
    quantity?: number;
  }>;
}

export interface DeductOrderStockOptions {
  orderNumber?: string;
  performedBy?: string;
  blockIfInsufficientStock?: boolean;
}

export class InventoryConsumptionService {
  /**
   * Deducts inventory stock for an order based on recipes/BOM.
   * Idempotent via `ORDER_CONSUMPTION:<orderId>`.
   */
  static async deductOrderStock(
    restaurantId: string,
    branchId: string,
    orderId: string,
    items: OrderItemForDeduction[],
    options?: DeductOrderStockOptions
  ): Promise<InventoryConsumptionResult> {
    await connectToDatabase();

    const referenceKey = `ORDER_CONSUMPTION:${orderId}`;

    // 1. Idempotency Check
    const existingMovement = await StockMovementModel.findOne({
      restaurantId,
      referenceKey,
    }).lean();

    if (existingMovement) {
      return {
        success: true,
        alreadyDeducted: true,
        orderId,
        deductions: [],
      };
    }

    if (!items || items.length === 0) {
      return {
        success: true,
        orderId,
        deductions: [],
      };
    }

    // 2. Fetch relevant recipes
    const menuItemIds = Array.from(new Set(items.map((i) => i.menuItemId).filter(Boolean)));
    const addonOptionIds = Array.from(
      new Set(
        items.flatMap((i) => (i.selectedAddons || []).map((a) => a.addonOptionId).filter(Boolean))
      )
    );

    const recipes = await RecipeModel.find({
      restaurantId,
      branchId,
      isActive: true,
      $or: [
        { menuItemId: { $in: menuItemIds } },
        { addonOptionId: { $in: addonOptionIds } },
      ],
    }).lean();

    if (recipes.length === 0) {
      return {
        success: true,
        orderId,
        deductions: [],
        note: "No configured recipes found for ordered items.",
      };
    }

    // Index recipes: key = `${menuItemId}:${variantId || ""}` or `addon:${addonOptionId}`
    const recipeMap = new Map<string, (typeof recipes)[0]>();
    for (const recipe of recipes) {
      if (recipe.addonOptionId) {
        recipeMap.set(`addon:${recipe.addonOptionId}`, recipe);
      } else if (recipe.menuItemId) {
        if (recipe.variantId) {
          recipeMap.set(`item:${recipe.menuItemId}:${recipe.variantId}`, recipe);
        } else {
          recipeMap.set(`item:${recipe.menuItemId}:base`, recipe);
        }
      }
    }

    // 3. Aggregate required ingredient quantities across all order items & addons
    interface IngredientRequirement {
      ingredientId: string;
      totalRequired: number; // in recipe line unit
      recipeUnit: string;
      reason: string;
    }

    const requirementMap = new Map<string, { totalNormalized: number; recipeLines: IngredientRequirement[] }>();

    for (const item of items) {
      // Find matching recipe: variant-specific first, fallback to base
      const recipe =
        (item.variantId ? recipeMap.get(`item:${item.menuItemId}:${item.variantId}`) : null) ||
        recipeMap.get(`item:${item.menuItemId}:base`);

      if (recipe && recipe.ingredients) {
        for (const line of recipe.ingredients) {
          const ingId = line.ingredientId.toString();
          const effectivePerUnit = line.quantity * (1 + (line.wastagePercentage || 0) / 100);
          const lineTotal = effectivePerUnit * item.quantity;

          const existing = requirementMap.get(ingId) || { totalNormalized: 0, recipeLines: [] };
          existing.recipeLines.push({
            ingredientId: ingId,
            totalRequired: lineTotal,
            recipeUnit: line.unit,
            reason: `${item.quantity}x ${item.name || "Item"}`,
          });
          requirementMap.set(ingId, existing);
        }
      }

      // Process addons
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        for (const addon of item.selectedAddons) {
          const addonRecipe = recipeMap.get(`addon:${addon.addonOptionId}`);
          if (addonRecipe && addonRecipe.ingredients) {
            const addonQty = (addon.quantity || 1) * item.quantity;
            for (const line of addonRecipe.ingredients) {
              const ingId = line.ingredientId.toString();
              const effectivePerUnit = line.quantity * (1 + (line.wastagePercentage || 0) / 100);
              const lineTotal = effectivePerUnit * addonQty;

              const existing = requirementMap.get(ingId) || { totalNormalized: 0, recipeLines: [] };
              existing.recipeLines.push({
                ingredientId: ingId,
                totalRequired: lineTotal,
                recipeUnit: line.unit,
                reason: `${addonQty}x Addon: ${addon.name || addon.addonOptionId}`,
              });
              requirementMap.set(ingId, existing);
            }
          }
        }
      }
    }

    if (requirementMap.size === 0) {
      return {
        success: true,
        orderId,
        deductions: [],
      };
    }

    // 4. Fetch target ingredients to verify units and stock
    const ingredientIds = Array.from(requirementMap.keys()).map((id) =>
      isValidObjectId(id) ? toObjectId(id) : id
    );
    const ingredients = await IngredientModel.find({
      _id: { $in: ingredientIds },
      restaurantId: isValidObjectId(restaurantId) ? toObjectId(restaurantId) : restaurantId,
      branchId: isValidObjectId(branchId) ? toObjectId(branchId) : branchId,
    } as any).lean();

    const ingredientMap = new Map(ingredients.map((ing) => [ing._id.toString(), ing]));

    // Calculate normalized required amounts in the ingredient's base unit
    const normalizedRequirements = new Map<
      string,
      {
        ingredient: (typeof ingredients)[0];
        totalNormalizedRequired: number;
      }
    >();

    const shortages: StockShortageDetail[] = [];

    for (const [ingId, reqData] of requirementMap.entries()) {
      const ingredient = ingredientMap.get(ingId);
      if (!ingredient) continue;

      let totalNormalized = 0;
      for (const line of reqData.recipeLines) {
        const converted = convertUnit(
          line.totalRequired,
          line.recipeUnit as InventoryUnit,
          ingredient.unit as InventoryUnit
        );
        totalNormalized += converted;
      }

      // Round to 4 decimal places for precision
      totalNormalized = Math.round(totalNormalized * 10000) / 10000;
      normalizedRequirements.set(ingId, { ingredient, totalNormalizedRequired: totalNormalized });

      // Check stock availability
      const available = ingredient.currentStock;
      const willBeNegative = available < totalNormalized;

      if (willBeNegative && !ingredient.allowNegativeStock && options?.blockIfInsufficientStock) {
        shortages.push({
          ingredientId: ingId,
          ingredientName: ingredient.name,
          required: totalNormalized,
          available,
          shortage: Math.round((totalNormalized - available) * 10000) / 10000,
          unit: ingredient.unit as InventoryUnit,
        });
      }
    }

    // 5. If blocking policy is enforced and shortages found, abort without partial deduction
    if (shortages.length > 0) {
      return {
        success: false,
        orderId,
        reason: "INSUFFICIENT_STOCK",
        shortages,
      };
    }

    // 6. Apply deductions and write immutable stock ledger movements
    const deductions: InventoryConsumptionResult["deductions"] = [];

    for (const [ingId, { ingredient, totalNormalizedRequired }] of normalizedRequirements.entries()) {
      const updated: any = await IngredientModel.findOneAndUpdate(
        {
          _id: ingredient._id,
          restaurantId: isValidObjectId(restaurantId) ? toObjectId(restaurantId) : restaurantId,
          branchId: isValidObjectId(branchId) ? toObjectId(branchId) : branchId,
        },
        { $inc: { currentStock: -totalNormalizedRequired } },
        { new: true }
      );

      const beforeStock = ingredient.currentStock;
      const afterStock = updated ? updated.currentStock : beforeStock - totalNormalizedRequired;
      const costPerUnit = ingredient.costPerUnit || 0;
      const totalCost = Math.round(totalNormalizedRequired * costPerUnit * 100) / 100;

      await StockMovementModel.create({
        restaurantId: isValidObjectId(restaurantId) ? toObjectId(restaurantId) : restaurantId,
        branchId: isValidObjectId(branchId) ? toObjectId(branchId) : branchId,
        ingredientId: ingredient._id as any,
        movementType: "CONSUMPTION",
        quantity: totalNormalizedRequired,
        unit: ingredient.unit,
        normalizedQuantity: totalNormalizedRequired,
        costPerUnit,
        totalCost,
        beforeStock,
        afterStock,
        referenceType: "order",
        referenceId: orderId,
        referenceKey,
        createdBy: options?.performedBy && isValidObjectId(options.performedBy) ? toObjectId(options.performedBy) : null,
        notes: `Order #${options?.orderNumber || orderId} recipe consumption`,
      });

      deductions.push({
        ingredientId: ingId,
        ingredientName: ingredient.name,
        quantityDeducted: totalNormalizedRequired,
        unit: ingredient.unit as InventoryUnit,
        stockBefore: beforeStock,
        stockAfter: afterStock,
      });
    }

    return {
      success: true,
      orderId,
      deductions,
    };
  }

  /**
   * Reverses inventory stock for a cancelled or refunded order.
   * Idempotent via `ORDER_REVERSAL:<orderId>`.
   */
  static async reverseOrderStock(
    restaurantId: string,
    branchId: string,
    orderId: string,
    reason?: string,
    performedBy?: string
  ): Promise<{
    success: boolean;
    alreadyReversed?: boolean;
    reversedCount?: number;
    error?: string;
  }> {
    await connectToDatabase();

    const reversalKey = `ORDER_REVERSAL:${orderId}`;

    // 1. Idempotency Check
    const existingReversal = await StockMovementModel.findOne({
      restaurantId,
      referenceKey: reversalKey,
    }).lean();

    if (existingReversal) {
      return {
        success: true,
        alreadyReversed: true,
      };
    }

    // 2. Find original consumption movements for this order
    const consumptionKey = `ORDER_CONSUMPTION:${orderId}`;
    const consumptionMovements = await StockMovementModel.find({
      restaurantId,
      referenceKey: consumptionKey,
      movementType: "CONSUMPTION",
    }).lean();

    if (consumptionMovements.length === 0) {
      return {
        success: true,
        reversedCount: 0,
      };
    }

    // 3. Restore stock and record REVERSAL movements
    for (const mov of consumptionMovements) {
      const updated: any = await IngredientModel.findOneAndUpdate(
        {
          _id: isValidObjectId(String(mov.ingredientId)) ? toObjectId(String(mov.ingredientId)) : String(mov.ingredientId),
          restaurantId: isValidObjectId(restaurantId) ? toObjectId(restaurantId) : restaurantId,
          branchId: isValidObjectId(branchId) ? toObjectId(branchId) : branchId,
        } as any,
        { $inc: { currentStock: mov.normalizedQuantity } },
        { new: true }
      );

      const beforeStock = updated ? updated.currentStock - mov.normalizedQuantity : 0;
      const afterStock = updated ? updated.currentStock : mov.normalizedQuantity;

      await StockMovementModel.create({
        restaurantId: isValidObjectId(restaurantId) ? toObjectId(restaurantId) : restaurantId,
        branchId: isValidObjectId(branchId) ? toObjectId(branchId) : branchId,
        ingredientId: mov.ingredientId as any,
        movementType: "REVERSAL",
        quantity: mov.quantity,
        unit: mov.unit,
        normalizedQuantity: mov.normalizedQuantity,
        costPerUnit: mov.costPerUnit,
        totalCost: mov.totalCost,
        beforeStock,
        afterStock,
        referenceType: "order",
        referenceId: orderId,
        referenceKey: reversalKey,
        createdBy: performedBy && isValidObjectId(performedBy) ? toObjectId(performedBy) : null,
        notes: reason || `Stock reversal for cancelled Order #${orderId}`,
      });
    }

    return {
      success: true,
      reversedCount: consumptionMovements.length,
    };
  }

  /**
   * Checks availability of an item based on its recipe ingredients.
   */
  static async checkMenuItemAvailability(
    restaurantId: string,
    branchId: string,
    menuItemId: string,
    variantId?: string | null,
    quantity: number = 1
  ): Promise<{
    isAvailable: boolean;
    shortages: StockShortageDetail[];
  }> {
    await connectToDatabase();

    const recipe = await RecipeModel.findOne({
      restaurantId,
      branchId,
      menuItemId,
      isActive: true,
      ...(variantId ? { variantId } : {}),
    }).lean();

    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return { isAvailable: true, shortages: [] };
    }

    const ingIds = recipe.ingredients.map((l) => l.ingredientId);
    const ingredients = await IngredientModel.find({
      _id: { $in: ingIds } as any,
      restaurantId,
      branchId,
    }).lean();

    const ingMap = new Map(ingredients.map((i) => [i._id.toString(), i]));
    const shortages: StockShortageDetail[] = [];

    for (const line of recipe.ingredients) {
      const ing = ingMap.get(line.ingredientId.toString());
      if (!ing) continue;

      const effectiveQty = line.quantity * (1 + (line.wastagePercentage || 0) / 100);
      const neededInRecipeUnit = effectiveQty * quantity;
      const neededNormalized = convertUnit(
        neededInRecipeUnit,
        line.unit as any,
        ing.unit as any
      );

      if (ing.currentStock < neededNormalized && !ing.allowNegativeStock) {
        shortages.push({
          ingredientId: ing._id.toString(),
          ingredientName: ing.name,
          required: neededNormalized,
          available: ing.currentStock,
          shortage: Math.round((neededNormalized - ing.currentStock) * 10000) / 10000,
          unit: ing.unit as any,
        });
      }
    }

    return {
      isAvailable: shortages.length === 0,
      shortages,
    };
  }
}
