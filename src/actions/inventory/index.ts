"use server";

import { revalidatePath } from "next/cache";
import {
  resolveInventoryActor,
  inventorySuccess,
  inventoryFailure,
  type InventoryActionResult,
} from "./context";
import {
  ingredientRepository,
  stockMovementRepository,
  recipeRepository,
} from "@/repositories/inventory";
import {
  CreateIngredientInput,
  UpdateIngredientInput,
  SaveRecipeInput,
  IngredientSummary,
  IngredientDetail,
  StockMovementSummary,
  RecipeDetail,
  StockOperationType,
  InventoryUnit,
  IngredientSelectOption,
} from "@/types/inventory";

function revalidateInventoryPaths() {
  revalidatePath("/inventory");
  revalidatePath("/menu");
  revalidatePath("/pos");
}

export async function getInventoryDashboard(
  branchId?: string
): Promise<InventoryActionResult<any>> {
  try {
    const actorRes = await resolveInventoryActor("inventory.view", branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch to view inventory.", "NO_BRANCH");
    }

    const summary = await ingredientRepository.getDashboardSummary(restaurantId, resolvedBranchId);
    const lowStockAlerts = await ingredientRepository.getLowStockIngredients(restaurantId, resolvedBranchId);

    return inventorySuccess({
      summary,
      lowStockAlerts,
    });
  } catch (error) {
    console.error("[getInventoryDashboard] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to load dashboard.");
  }
}

export async function listIngredients(
  filters: {
    search?: string;
    category?: string;
    status?: "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    page?: number;
    limit?: number;
  },
  branchId?: string
): Promise<InventoryActionResult<{ ingredients: IngredientSummary[]; total: number; page: number; limit: number }>> {
  try {
    const actorRes = await resolveInventoryActor("inventory.view", branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch to view inventory.", "NO_BRANCH");
    }

    const statusParam = filters.status === "ALL" ? "all" : filters.status;
    const result = await ingredientRepository.listIngredients(
      restaurantId,
      resolvedBranchId,
      {
        ...filters,
        status: statusParam,
      }
    );

    return inventorySuccess({
      ingredients: result.items,
      total: result.total,
      page: result.page,
      limit: result.pageSize,
    });
  } catch (error) {
    console.error("[listIngredients] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to list ingredients.");
  }
}

export async function getIngredientById(
  id: string,
  branchId?: string
): Promise<InventoryActionResult<IngredientDetail>> {
  try {
    const actorRes = await resolveInventoryActor("inventory.view", branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch.", "NO_BRANCH");
    }

    const ingredient = await ingredientRepository.getIngredientById(id, restaurantId, resolvedBranchId);
    if (!ingredient) {
      return inventoryFailure("Ingredient not found.", "NOT_FOUND");
    }

    return inventorySuccess(ingredient);
  } catch (error) {
    console.error("[getIngredientById] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to retrieve ingredient.");
  }
}

export async function saveIngredient(
  input: CreateIngredientInput | (UpdateIngredientInput & { id: string }),
  branchId?: string
): Promise<InventoryActionResult<IngredientDetail>> {
  try {
    const isUpdate = "id" in input && Boolean(input.id);
    const requiredPermission = isUpdate ? "inventory.edit" : "inventory.create";

    const actorRes = await resolveInventoryActor(requiredPermission, branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId, userId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch.", "NO_BRANCH");
    }

    let ingredient: IngredientDetail;
    if (isUpdate) {
      const updateData = { ...(input as UpdateIngredientInput & { id: string }) };
      const id = updateData.id;
      delete (updateData as any).id;
      const updated = await ingredientRepository.updateIngredient(
        id,
        restaurantId,
        updateData,
        userId
      );
      if (!updated) {
        return inventoryFailure("Failed to update ingredient or ingredient not found.");
      }
      ingredient = updated;
    } else {
      ingredient = await ingredientRepository.createIngredient(
        restaurantId,
        { ...(input as CreateIngredientInput), branchId: resolvedBranchId },
        userId
      );
    }

    revalidateInventoryPaths();
    return inventorySuccess(ingredient, isUpdate ? "Ingredient updated successfully." : "Ingredient created successfully.");
  } catch (error) {
    console.error("[saveIngredient] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to save ingredient.");
  }
}

export async function deleteIngredient(
  id: string,
  branchId?: string
): Promise<InventoryActionResult<boolean>> {
  try {
    const actorRes = await resolveInventoryActor("inventory.delete", branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch.", "NO_BRANCH");
    }

    // Check if any active recipes use this ingredient
    const recipesUsing = await recipeRepository.findRecipesByIngredient(id, restaurantId, resolvedBranchId);
    if (recipesUsing.length > 0) {
      return inventoryFailure(
        `Cannot delete ingredient. It is used in ${recipesUsing.length} active recipe(s). Please remove it from those recipes first.`,
        "IN_USE"
      );
    }

    await ingredientRepository.deleteIngredient(id, restaurantId, resolvedBranchId);
    revalidateInventoryPaths();
    return inventorySuccess(true, "Ingredient deleted successfully.");
  } catch (error) {
    console.error("[deleteIngredient] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to delete ingredient.");
  }
}

export async function recordStockOperation(
  input: {
    ingredientId: string;
    type: StockOperationType;
    quantity: number;
    unit?: string;
    costPerUnit?: number;
    notes?: string;
  },
  branchId?: string
): Promise<InventoryActionResult<any>> {
  try {
    const actorRes = await resolveInventoryActor("inventory.manage", branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId, userId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch.", "NO_BRANCH");
    }

    if (input.quantity <= 0 && input.type !== "ADJUSTMENT_SET") {
      return inventoryFailure("Quantity must be greater than zero.", "INVALID_QUANTITY");
    }

    let movement;
    if (input.type === "PURCHASE") {
      movement = await stockMovementRepository.recordPurchase(
        restaurantId,
        resolvedBranchId,
        {
          branchId: resolvedBranchId,
          ingredientId: input.ingredientId,
          quantity: input.quantity,
          unit: (input.unit || "piece") as InventoryUnit,
          costPerUnit: input.costPerUnit,
          notes: input.notes,
        },
        userId
      );
    } else if (input.type === "WASTE") {
      movement = await stockMovementRepository.recordWaste(
        restaurantId,
        resolvedBranchId,
        {
          ingredientId: input.ingredientId,
          quantity: input.quantity,
          unit: (input.unit || "piece") as InventoryUnit,
          notes: input.notes,
        },
        userId
      );
    } else {
      // ADJUSTMENT_ADD, ADJUSTMENT_REMOVE, ADJUSTMENT_SET
      movement = await stockMovementRepository.recordAdjustment(
        restaurantId,
        resolvedBranchId,
        {
          ingredientId: input.ingredientId,
          adjustmentType: input.type,
          quantity: input.quantity,
          unit: (input.unit || "piece") as InventoryUnit,
          notes: input.notes,
        },
        userId
      );
    }

    revalidateInventoryPaths();
    return inventorySuccess(movement, "Stock movement recorded successfully.");
  } catch (error) {
    console.error("[recordStockOperation] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to record stock operation.");
  }
}

export async function listStockMovements(
  filters: {
    ingredientId?: string;
    movementType?: string;
    page?: number;
    limit?: number;
  },
  branchId?: string
): Promise<InventoryActionResult<{ movements: StockMovementSummary[]; total: number; page: number; limit: number }>> {
  try {
    const actorRes = await resolveInventoryActor("inventory.view", branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch.", "NO_BRANCH");
    }

    const result = await stockMovementRepository.listMovements(
      restaurantId,
      resolvedBranchId,
      filters
    );

    return inventorySuccess({
      movements: result.items,
      total: result.total,
      page: result.page,
      limit: result.pageSize,
    });
  } catch (error) {
    console.error("[listStockMovements] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to list stock movements.");
  }
}

export async function listRecipes(
  filters: {
    menuItemId?: string;
    page?: number;
    limit?: number;
  },
  branchId?: string
): Promise<InventoryActionResult<{ recipes: RecipeDetail[]; total: number; page: number; limit: number }>> {
  try {
    const actorRes = await resolveInventoryActor("recipes.view", branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch.", "NO_BRANCH");
    }

    const result = await recipeRepository.listRecipes(
      restaurantId,
      resolvedBranchId,
      filters
    );

    return inventorySuccess({
      recipes: result.items.map((r) => ({ ...r, totalCost: r.estimatedCost })),
      total: result.total,
      page: result.page,
      limit: result.pageSize,
    });
  } catch (error) {
    console.error("[listRecipes] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to list recipes.");
  }
}

export async function getRecipeForMenuItem(
  menuItemId: string,
  variantId?: string | null,
  branchId?: string
): Promise<InventoryActionResult<RecipeDetail | null>> {
  try {
    const actorRes = await resolveInventoryActor("recipes.view", branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch.", "NO_BRANCH");
    }

    const recipe = await recipeRepository.getRecipeByMenuItem(
      restaurantId,
      resolvedBranchId,
      menuItemId,
      variantId
    );

    return inventorySuccess(
      recipe ? { ...recipe, totalCost: recipe.estimatedCost } : null
    );
  } catch (error) {
    console.error("[getRecipeForMenuItem] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to get recipe.");
  }
}

export async function saveRecipe(
  input: SaveRecipeInput,
  branchId?: string
): Promise<InventoryActionResult<RecipeDetail>> {
  try {
    const isUpdate = Boolean(input.id);
    const requiredPermission = isUpdate ? "recipes.edit" : "recipes.create";

    const actorRes = await resolveInventoryActor(requiredPermission, branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId, userId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch.", "NO_BRANCH");
    }

    const recipe = await recipeRepository.saveRecipe(
      restaurantId,
      { ...input, branchId: resolvedBranchId },
      userId
    );

    revalidateInventoryPaths();
    return inventorySuccess(
      { ...recipe, totalCost: recipe.estimatedCost },
      "Recipe BOM saved successfully."
    );
  } catch (error) {
    console.error("[saveRecipe] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to save recipe.");
  }
}

export async function deleteRecipe(
  id: string,
  branchId?: string
): Promise<InventoryActionResult<boolean>> {
  try {
    const actorRes = await resolveInventoryActor("recipes.delete", branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch.", "NO_BRANCH");
    }

    await recipeRepository.deleteRecipe(id, restaurantId, resolvedBranchId);
    revalidateInventoryPaths();
    return inventorySuccess(true, "Recipe deleted successfully.");
  } catch (error) {
    console.error("[deleteRecipe] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to delete recipe.");
  }
}

export async function getIngredientOptions(
  branchId?: string
): Promise<InventoryActionResult<Array<{ id: string; name: string; unit: string; costPerUnit: number; currentStock: number }>>> {
  try {
    const actorRes = await resolveInventoryActor("inventory.view", branchId);
    if (!actorRes.success) return actorRes;

    const { restaurantId, branchId: resolvedBranchId } = actorRes.data;
    if (!resolvedBranchId) {
      return inventoryFailure("Please select a branch.", "NO_BRANCH");
    }

    const options = await ingredientRepository.getIngredientOptions(restaurantId, resolvedBranchId);
    return inventorySuccess(
      options.map((opt: IngredientSelectOption) => ({
        id: opt.value,
        name: opt.label,
        unit: opt.unit || "piece",
        costPerUnit: opt.costPerUnit || 0,
        currentStock: opt.currentStock || 0,
      }))
    );
  } catch (error) {
    console.error("[getIngredientOptions] error:", error);
    return inventoryFailure(error instanceof Error ? error.message : "Failed to fetch ingredient options.");
  }
}
