"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  menuItemFailure,
  menuItemSuccess,
  slugifyMenuItemName,
  zodFieldErrors,
} from "@/lib/menu-items";
import {
  createMenuItemSchema,
  deleteMenuItemSchema,
  searchMenuItemSchema,
  toggleMenuItemAvailabilitySchema,
  toggleMenuItemFeaturedSchema,
  updateMenuItemSchema,
} from "@/lib/validators/menu-item";
import { menuItemRepository } from "@/repositories/menu-item";
import { categoryRepository } from "@/repositories/category";
import { resolveMenuItemActor } from "@/actions/menu-items/context";
import type {
  CategoryOption,
  MenuItem,
  MenuItemActionResult,
  MenuItemListResult,
} from "@/types/menu-item";

function mapDbError(error: unknown): MenuItemActionResult<never> {
  if (isDatabaseError(error)) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      const message = String(error.cause ?? error.message);
      if (/sku/i.test(message)) {
        return menuItemFailure(
          "DUPLICATE_SKU",
          "A menu item with this SKU already exists.",
          { sku: ["This SKU is already in use."] }
        );
      }
      return menuItemFailure(
        "DUPLICATE_SLUG",
        "A menu item with this slug already exists.",
        { slug: ["This slug is already in use."] }
      );
    }
    return menuItemFailure("DATABASE_ERROR", error.message);
  }
  return menuItemFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateMenuItemPaths(id?: string) {
  revalidatePath("/menu-items");
  if (id) {
    revalidatePath(`/menu-items/${id}`);
    revalidatePath(`/menu-items/${id}/edit`);
  }
}

export async function createMenuItem(
  input: unknown
): Promise<MenuItemActionResult<MenuItem>> {
  const actor = await resolveMenuItemActor([
    "menu-items.create",
    "menu-items.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = createMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return menuItemFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;
  const slug = values.slug || slugifyMenuItemName(values.name);
  const sku = (values.sku ?? "").trim().toUpperCase();

  try {
    const categoryOk = await menuItemRepository.assertCategoryExists(
      values.categoryId,
      actor.data.restaurantId
    );
    if (!categoryOk) {
      return menuItemFailure(
        "CATEGORY_NOT_FOUND",
        "Selected category was not found.",
        { categoryId: ["Category not found."] }
      );
    }

    const existingSlug = await menuItemRepository.findBySlug(
      slug,
      actor.data.restaurantId
    );
    if (existingSlug) {
      return menuItemFailure("DUPLICATE_SLUG", "This slug is already in use.", {
        slug: ["This slug is already in use."],
      });
    }

    if (sku) {
      const existingSku = await menuItemRepository.findBySku(
        sku,
        actor.data.restaurantId
      );
      if (existingSku) {
        return menuItemFailure("DUPLICATE_SKU", "This SKU is already in use.", {
          sku: ["This SKU is already in use."],
        });
      }
    }

    const item = await menuItemRepository.create({
      restaurantId: actor.data.restaurantId,
      branchId: values.branchId ?? null,
      categoryId: values.categoryId,
      name: values.name,
      slug,
      description: values.description ?? "",
      shortDescription: values.shortDescription ?? "",
      sku,
      image: values.image ?? "",
      gallery: values.gallery ?? [],
      price: values.price,
      discountPrice: values.discountPrice ?? null,
      taxRate: values.taxRate ?? 0,
      preparationTime: values.preparationTime ?? 0,
      calories: values.calories ?? null,
      isVeg: values.isVeg ?? true,
      isAvailable: values.isAvailable ?? true,
      isFeatured: values.isFeatured ?? false,
      displayOrder: values.displayOrder ?? 0,
      tags: values.tags ?? [],
      createdBy: actor.data.userId,
    });

    revalidateMenuItemPaths(item.id);
    return menuItemSuccess(item);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateMenuItem(
  input: unknown
): Promise<MenuItemActionResult<MenuItem>> {
  const actor = await resolveMenuItemActor([
    "menu-items.edit",
    "menu-items.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return menuItemFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;

  try {
    if (rest.categoryId) {
      const categoryOk = await menuItemRepository.assertCategoryExists(
        rest.categoryId,
        actor.data.restaurantId
      );
      if (!categoryOk) {
        return menuItemFailure(
          "CATEGORY_NOT_FOUND",
          "Selected category was not found.",
          { categoryId: ["Category not found."] }
        );
      }
    }

    if (rest.slug) {
      const existingSlug = await menuItemRepository.findBySlug(
        rest.slug,
        actor.data.restaurantId,
        id
      );
      if (existingSlug) {
        return menuItemFailure(
          "DUPLICATE_SLUG",
          "This slug is already in use.",
          { slug: ["This slug is already in use."] }
        );
      }
    }

    if (rest.sku !== undefined && rest.sku.trim()) {
      const existingSku = await menuItemRepository.findBySku(
        rest.sku,
        actor.data.restaurantId,
        id
      );
      if (existingSku) {
        return menuItemFailure("DUPLICATE_SKU", "This SKU is already in use.", {
          sku: ["This SKU is already in use."],
        });
      }
    }

    const item = await menuItemRepository.update(id, actor.data.restaurantId, {
      ...rest,
      sku: rest.sku !== undefined ? rest.sku.trim().toUpperCase() : undefined,
      updatedBy: actor.data.userId,
    });

    if (!item) {
      return menuItemFailure("NOT_FOUND", "Menu item not found.");
    }

    revalidateMenuItemPaths(item.id);
    return menuItemSuccess(item);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function deleteMenuItem(
  input: unknown
): Promise<MenuItemActionResult<{ id: string }>> {
  const actor = await resolveMenuItemActor([
    "menu-items.delete",
    "menu-items.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = deleteMenuItemSchema.safeParse(input);
  if (!parsed.success) {
    return menuItemFailure(
      "VALIDATION_ERROR",
      "Invalid menu item id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const item = await menuItemRepository.softDelete(
      parsed.data.id,
      actor.data.restaurantId,
      actor.data.userId
    );
    if (!item) {
      return menuItemFailure("NOT_FOUND", "Menu item not found.");
    }
    revalidateMenuItemPaths(item.id);
    return menuItemSuccess({ id: item.id });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getMenuItems(
  input: unknown = {}
): Promise<MenuItemActionResult<MenuItemListResult>> {
  const actor = await resolveMenuItemActor([
    "menu-items.view",
    "menu-items.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = searchMenuItemSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return menuItemFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await menuItemRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return menuItemSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getMenuItemById(
  id: string
): Promise<MenuItemActionResult<MenuItem>> {
  const actor = await resolveMenuItemActor([
    "menu-items.view",
    "menu-items.manage",
  ]);
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return menuItemFailure("VALIDATION_ERROR", "Menu item id is required.");
  }

  try {
    const item = await menuItemRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!item) {
      return menuItemFailure("NOT_FOUND", "Menu item not found.");
    }
    return menuItemSuccess(item);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function toggleAvailability(
  input: unknown
): Promise<MenuItemActionResult<MenuItem>> {
  const actor = await resolveMenuItemActor([
    "menu-items.edit",
    "menu-items.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = toggleMenuItemAvailabilitySchema.safeParse(input);
  if (!parsed.success) {
    return menuItemFailure(
      "VALIDATION_ERROR",
      "Invalid request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const existing = await menuItemRepository.findById(
      parsed.data.id,
      actor.data.restaurantId
    );
    if (!existing) {
      return menuItemFailure("NOT_FOUND", "Menu item not found.");
    }

    const next =
      parsed.data.isAvailable !== undefined
        ? parsed.data.isAvailable
        : !existing.isAvailable;

    const item = await menuItemRepository.update(
      parsed.data.id,
      actor.data.restaurantId,
      { isAvailable: next, updatedBy: actor.data.userId }
    );

    if (!item) {
      return menuItemFailure("NOT_FOUND", "Menu item not found.");
    }

    revalidateMenuItemPaths(item.id);
    return menuItemSuccess(item);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function toggleFeatured(
  input: unknown
): Promise<MenuItemActionResult<MenuItem>> {
  const actor = await resolveMenuItemActor([
    "menu-items.edit",
    "menu-items.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = toggleMenuItemFeaturedSchema.safeParse(input);
  if (!parsed.success) {
    return menuItemFailure(
      "VALIDATION_ERROR",
      "Invalid request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const existing = await menuItemRepository.findById(
      parsed.data.id,
      actor.data.restaurantId
    );
    if (!existing) {
      return menuItemFailure("NOT_FOUND", "Menu item not found.");
    }

    const next =
      parsed.data.isFeatured !== undefined
        ? parsed.data.isFeatured
        : !existing.isFeatured;

    const item = await menuItemRepository.update(
      parsed.data.id,
      actor.data.restaurantId,
      { isFeatured: next, updatedBy: actor.data.userId }
    );

    if (!item) {
      return menuItemFailure("NOT_FOUND", "Menu item not found.");
    }

    revalidateMenuItemPaths(item.id);
    return menuItemSuccess(item);
  } catch (error) {
    return mapDbError(error);
  }
}

/** Category options for menu item forms / filters */
export async function getMenuItemCategoryOptions(): Promise<
  MenuItemActionResult<CategoryOption[]>
> {
  const actor = await resolveMenuItemActor([
    "menu-items.view",
    "menu-items.create",
    "menu-items.edit",
    "menu-items.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const result = await categoryRepository.findMany(actor.data.restaurantId, {
      q: "",
      status: "active",
      createdFrom: "",
      createdTo: "",
      branchId: "",
      page: 1,
      pageSize: 100,
      sortBy: "name",
      sortOrder: "asc",
    });

    return menuItemSuccess(
      result.items.map((category) => ({
        value: category.id,
        label: category.name,
      }))
    );
  } catch (error) {
    return mapDbError(error);
  }
}
