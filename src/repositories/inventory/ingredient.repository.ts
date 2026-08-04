import {
  connectToDatabase,
  handleDatabaseError,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import { serializeIngredient } from "@/lib/inventory";
import { IngredientModel, type IngredientDocument } from "@/models/inventory";
import { PLACEHOLDER_INGREDIENT_OPTIONS } from "@/config/inventory";
import type { IngredientSelectOption } from "@/types/inventory";

type Filter = Record<string, unknown>;

async function listOptions(
  restaurantId: string
): Promise<IngredientSelectOption[]> {
  try {
    await connectToDatabase();
    const docs = await IngredientModel.find(
      notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        status: "active",
      }) as Filter
    )
      .sort({ name: 1 })
      .select({ name: 1, unit: 1, ingredientCode: 1 })
      .limit(300)
      .lean()
      .exec();

    if (docs.length === 0) {
      return PLACEHOLDER_INGREDIENT_OPTIONS.map((item) => ({
        value: item.value,
        label: item.label,
        meta: item.meta,
        unit: item.unit,
      }));
    }

    return docs.map((doc) => {
      const ingredient = serializeIngredient(doc as IngredientDocument);
      return {
        value: ingredient.id,
        label: ingredient.name,
        meta: `${ingredient.unit} · ${ingredient.ingredientCode}`,
        unit: ingredient.unit,
      };
    });
  } catch (error) {
    throw handleDatabaseError(error, "Failed to list ingredient options");
  }
}

export const ingredientRepository = {
  listOptions,
};
