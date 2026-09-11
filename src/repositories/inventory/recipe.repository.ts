import {
  connectToDatabase,
  toObjectId,
  isValidObjectId,
  notDeletedFilter,
} from "@/lib/database";
import {
  RecipeModel,
  type RecipeDocument,
  IngredientModel,
} from "@/models/inventory";
import { MenuItemModel } from "@/models/menu-item";
import { calculateRecipeLineCost } from "@/lib/inventory/recipe-calculator";
import type {
  Recipe,
  SaveRecipeInput,
  InventoryUnit,
} from "@/types/inventory";

type Filter = Record<string, unknown>;

function serializeRecipeDoc(
  doc: RecipeDocument,
  menuItemName?: string,
  variantName?: string
): Recipe {
  const estimatedCost = 0;
  const ingredients = (doc.ingredients ?? []).map((line) => {
    const costEst = 0;
    return {
      ingredientId: String(line.ingredientId),
      quantity: line.quantity,
      unit: line.unit as InventoryUnit,
      wastagePercentage: line.wastagePercentage ?? 0,
      costEstimate: costEst,
    };
  });

  return {
    id: String(doc._id),
    restaurantId: String(doc.restaurantId),
    branchId: doc.branchId ? String(doc.branchId) : null,
    menuItemId: String(doc.menuItemId),
    menuItemName: menuItemName || undefined,
    variantId: doc.variantId || null,
    variantName: variantName || null,
    addonOptionId: doc.addonOptionId || null,
    name: doc.name,
    ingredients,
    estimatedCost,
    isActive: Boolean(doc.isActive),
    version: doc.version ?? 1,
    notes: doc.notes || "",
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
  };
}

export class RecipeRepository {
  /**
   * List recipes with populated menu item names and estimated recipe costs
   */
  async listRecipes(
    restaurantId: string,
    branchIdOrParams: string | {
      branchId?: string;
      menuItemId?: string;
      page?: number;
      pageSize?: number;
    } = {},
    maybeParams: {
      menuItemId?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ items: Recipe[]; total: number; page: number; pageSize: number }> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) throw new Error("Invalid restaurant ID");

    const params =
      typeof branchIdOrParams === "string"
        ? { ...maybeParams, branchId: branchIdOrParams }
        : branchIdOrParams || {};

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(params.pageSize || 30, 100));

    const query: Filter = {
      restaurantId: toObjectId(restaurantId),
    };

    if (params.branchId && isValidObjectId(params.branchId)) {
      query.$or = [{ branchId: null }, { branchId: toObjectId(params.branchId) }];
    }
    if (params.menuItemId && isValidObjectId(params.menuItemId)) {
      query.menuItemId = toObjectId(params.menuItemId);
    }

    const [total, docs] = await Promise.all([
      RecipeModel.countDocuments(notDeletedFilter(query) as Filter),
      RecipeModel.find(notDeletedFilter(query) as Filter)
        .populate("menuItemId", "name customizationGroups")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
    ]);

    // Batch fetch ingredient costs to calculate estimated recipe costs
    const allIngredientIds = new Set<string>();
    for (const doc of docs) {
      for (const ing of doc.ingredients ?? []) {
        allIngredientIds.add(String(ing.ingredientId));
      }
    }

    const ingredientsMap = new Map<string, { costPerUnit: number; unit: InventoryUnit; name: string }>();
    if (allIngredientIds.size > 0) {
      const ingDocs = await IngredientModel.find({
        _id: { $in: Array.from(allIngredientIds).map((id) => toObjectId(id)) },
      } as any)
        .select({ costPerUnit: 1, unit: 1, name: 1 })
        .lean()
        .exec();

      for (const ing of ingDocs) {
        ingredientsMap.set(String(ing._id), {
          costPerUnit: ing.costPerUnit || 0,
          unit: ing.unit as InventoryUnit,
          name: ing.name,
        });
      }
    }

    const items = (docs as unknown as Array<RecipeDocument & {
      menuItemId?: {
        name?: string;
        customizationGroups?: Array<{ options?: Array<{ id?: string; name?: string }> }>;
      };
    }>).map((doc) => {
      const menuName = doc.menuItemId && typeof doc.menuItemId === "object"
        ? doc.menuItemId.name
        : undefined;

      // Find variant name if applicable
      let variantName: string | null = null;
      if (doc.variantId && doc.menuItemId?.customizationGroups) {
        for (const grp of doc.menuItemId.customizationGroups) {
          const opt = (grp.options ?? []).find((o) => o.id === doc.variantId);
          if (opt) {
            variantName = opt.name || null;
            break;
          }
        }
      }

      let totalRecipeCost = 0;
      const ingredientsWithMeta = (doc.ingredients ?? []).map((line) => {
        const ingData = ingredientsMap.get(String(line.ingredientId));
        let lineCost = 0;
        if (ingData) {
          try {
            lineCost = calculateRecipeLineCost(
              line.quantity,
              line.unit as InventoryUnit,
              ingData.costPerUnit,
              ingData.unit,
              line.wastagePercentage ?? 0
            );
          } catch {
            lineCost = 0;
          }
        }
        totalRecipeCost += lineCost;

        return {
          ingredientId: String(line.ingredientId),
          ingredientName: ingData?.name || "Unknown Ingredient",
          quantity: line.quantity,
          unit: line.unit as InventoryUnit,
          wastagePercentage: line.wastagePercentage ?? 0,
          costEstimate: lineCost,
        };
      });

      const serialized = serializeRecipeDoc(doc, menuName, variantName || undefined);
      serialized.ingredients = ingredientsWithMeta;
      serialized.estimatedCost = Math.round(totalRecipeCost * 100) / 100;
      return serialized;
    });

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get single recipe by ID
   */
  async getRecipeById(
    id: string,
    restaurantId: string
  ): Promise<Recipe | null> {
    await connectToDatabase();
    if (!isValidObjectId(id) || !isValidObjectId(restaurantId)) return null;

    const doc = await RecipeModel.findOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter
    )
      .populate("menuItemId", "name customizationGroups")
      .lean()
      .exec();

    if (!doc) return null;

    const populated = doc as unknown as RecipeDocument & {
      menuItemId?: {
        name?: string;
        customizationGroups?: Array<{ options?: Array<{ id?: string; name?: string }> }>;
      };
    };

    return serializeRecipeDoc(doc, populated.menuItemId?.name);
  }

  /**
   * Get recipe for a specific menu item and optional variant
   */
  async getRecipeByMenuItem(
    restaurantId: string,
    branchId: string,
    menuItemId: string,
    variantId?: string | null
  ): Promise<Recipe | null> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId) || !isValidObjectId(menuItemId)) return null;

    const query: Filter = {
      restaurantId: toObjectId(restaurantId),
      menuItemId: toObjectId(menuItemId),
      isActive: true,
    };
    if (branchId && isValidObjectId(branchId)) {
      query.branchId = toObjectId(branchId);
    }
    if (variantId) {
      query.variantId = variantId;
    }

    const doc = await RecipeModel.findOne(notDeletedFilter(query) as Filter)
      .populate("menuItemId", "name")
      .lean()
      .exec();

    if (!doc) return null;
    return serializeRecipeDoc(doc as any);
  }

  /**
   * Save (Create or Update) a Recipe / BOM
   */
  async saveRecipe(
    restaurantId: string,
    input: SaveRecipeInput,
    userId?: string | null
  ): Promise<Recipe> {
    await connectToDatabase();
    if (!isValidObjectId(restaurantId)) throw new Error("Invalid restaurant ID");
    if (!isValidObjectId(input.menuItemId)) throw new Error("Invalid menu item ID");
    if (!input.ingredients || input.ingredients.length === 0) {
      throw new Error("Recipe must contain at least one ingredient");
    }

    // Check for duplicate ingredient IDs in recipe lines
    const seenIngredients = new Set<string>();
    for (const line of input.ingredients) {
      if (seenIngredients.has(line.ingredientId)) {
        throw new Error("Duplicate ingredient rows in recipe are not allowed. Please combine quantities.");
      }
      seenIngredients.add(line.ingredientId);
    }

    const menuItem = await MenuItemModel.findOne({
      _id: toObjectId(input.menuItemId),
      restaurantId: toObjectId(restaurantId),
      isDeleted: false,
    } as any).lean().exec();

    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    const recipeName = input.name?.trim() || `${menuItem.name}${input.variantId ? " (Variant)" : " (Base)"}`;

    // Look for existing recipe for this menuItem + variantId + addonOptionId
    const query: Filter = {
      restaurantId: toObjectId(restaurantId),
      menuItemId: toObjectId(input.menuItemId),
      variantId: input.variantId || null,
      addonOptionId: input.addonOptionId || null,
      isDeleted: false,
    };
    if (input.branchId && isValidObjectId(input.branchId)) {
      query.branchId = toObjectId(input.branchId);
    } else {
      query.branchId = null;
    }

    let recipe = await RecipeModel.findOne(query).exec();

    const formattedLines = input.ingredients.map((line) => ({
      ingredientId: toObjectId(line.ingredientId),
      quantity: Math.max(0.0001, line.quantity),
      unit: line.unit,
      wastagePercentage: Math.max(0, Math.min(100, line.wastagePercentage || 0)),
    }));

    if (recipe) {
      recipe.name = recipeName;
      recipe.ingredients = formattedLines as unknown as typeof recipe.ingredients;
      recipe.isActive = input.isActive !== false;
      recipe.notes = input.notes?.trim() || "";
      recipe.version = (recipe.version || 1) + 1;
      recipe.updatedBy = userId && isValidObjectId(userId) ? toObjectId(userId) : null;
      await recipe.save();
    } else {
      recipe = await RecipeModel.create({
        restaurantId: toObjectId(restaurantId),
        branchId: input.branchId && isValidObjectId(input.branchId) ? toObjectId(input.branchId) : null,
        menuItemId: toObjectId(input.menuItemId),
        variantId: input.variantId || null,
        addonOptionId: input.addonOptionId || null,
        name: recipeName,
        ingredients: formattedLines,
        isActive: input.isActive !== false,
        version: 1,
        notes: input.notes?.trim() || "",
        createdBy: userId && isValidObjectId(userId) ? toObjectId(userId) : null,
        updatedBy: userId && isValidObjectId(userId) ? toObjectId(userId) : null,
        isDeleted: false,
      });
    }

    return serializeRecipeDoc(recipe, menuItem.name);
  }

  /**
   * Soft delete recipe
   */
  async deleteRecipe(id: string, restaurantId: string, _branchId?: string): Promise<boolean> {
    await connectToDatabase();
    if (!isValidObjectId(id) || !isValidObjectId(restaurantId)) return false;

    const res = await RecipeModel.updateOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
        },
      }
    ).exec();

    return res.modifiedCount > 0;
  }

  /**
   * Find which recipes use a specific raw ingredient
   */
  async findRecipesByIngredient(
    ingredientId: string,
    restaurantId: string,
    _branchId?: string
  ): Promise<Array<{ id: string; name: string; menuItemName: string; quantity: number; unit: string }>> {
    return this.getRecipesUsingIngredient(ingredientId, restaurantId);
  }

  /**
   * Find which recipes use a specific raw ingredient
   */
  async getRecipesUsingIngredient(
    ingredientId: string,
    restaurantId: string
  ): Promise<Array<{ id: string; name: string; menuItemName: string; quantity: number; unit: string }>> {
    await connectToDatabase();
    if (!isValidObjectId(ingredientId) || !isValidObjectId(restaurantId)) return [];

    const recipes = await RecipeModel.find(
      notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        "ingredients.ingredientId": toObjectId(ingredientId),
      }) as Filter
    )
      .populate("menuItemId", "name")
      .lean()
      .exec();

    return recipes.map((r) => {
      const line = (r.ingredients ?? []).find((i) => String(i.ingredientId) === ingredientId);
      const mName = r.menuItemId && typeof r.menuItemId === "object" && "name" in r.menuItemId
        ? String((r.menuItemId as { name?: string }).name)
        : "Menu Item";

      return {
        id: String(r._id),
        name: r.name,
        menuItemName: mName,
        quantity: line?.quantity ?? 0,
        unit: String(line?.unit || ""),
      };
    });
  }
}

export const recipeRepository = new RecipeRepository();

Object.getOwnPropertyNames(RecipeRepository.prototype).forEach((key) => {
  if (key !== "constructor" && typeof (RecipeRepository.prototype as any)[key] === "function") {
    (RecipeRepository as any)[key] = (RecipeRepository.prototype as any)[key].bind(recipeRepository);
  }
});
