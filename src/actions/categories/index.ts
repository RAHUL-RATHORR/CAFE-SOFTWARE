"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  categoryFailure,
  categorySuccess,
  slugifyCategoryName,
  zodFieldErrors,
} from "@/lib/categories";
import {
  createCategorySchema,
  deleteCategorySchema,
  searchCategorySchema,
  toggleCategoryStatusSchema,
  updateCategorySchema,
} from "@/lib/validators/category";
import { categoryRepository } from "@/repositories/category";
import { resolveCategoryActor } from "@/actions/categories/context";
import type {
  Category,
  CategoryActionResult,
  CategoryListResult,
} from "@/types/category";

function mapDbError(error: unknown): CategoryActionResult<never> {
  if (isDatabaseError(error)) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      return categoryFailure(
        "DUPLICATE_SLUG",
        "A category with this slug already exists."
      );
    }
    return categoryFailure("DATABASE_ERROR", error.message);
  }
  return categoryFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateCategoryPaths(id?: string) {
  revalidatePath("/categories");
  if (id) {
    revalidatePath(`/categories/${id}`);
    revalidatePath(`/categories/${id}/edit`);
  }
}

export async function createCategory(
  input: unknown
): Promise<CategoryActionResult<Category>> {
  const actor = await resolveCategoryActor("categories.create");
  if (!actor.success) return actor;

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return categoryFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;
  const slug = values.slug || slugifyCategoryName(values.name);

  try {
    const existing = await categoryRepository.findBySlug(
      slug,
      actor.data.restaurantId
    );
    if (existing) {
      return categoryFailure("DUPLICATE_SLUG", "This slug is already in use.", {
        slug: ["This slug is already in use."],
      });
    }

    const category = await categoryRepository.create({
      restaurantId: actor.data.restaurantId,
      branchId: values.branchId ?? null,
      name: values.name,
      slug,
      description: values.description ?? "",
      image: values.image ?? "",
      displayOrder: values.displayOrder ?? 0,
      color: values.color || "#2563EB",
      icon: values.icon ?? "",
      isActive: values.isActive ?? true,
      createdBy: actor.data.userId,
    });

    revalidateCategoryPaths(category.id);
    return categorySuccess(category);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateCategory(
  input: unknown
): Promise<CategoryActionResult<Category>> {
  const actor = await resolveCategoryActor("categories.edit");
  if (!actor.success) return actor;

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return categoryFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;

  try {
    if (rest.slug) {
      const existing = await categoryRepository.findBySlug(
        rest.slug,
        actor.data.restaurantId,
        id
      );
      if (existing) {
        return categoryFailure(
          "DUPLICATE_SLUG",
          "This slug is already in use.",
          { slug: ["This slug is already in use."] }
        );
      }
    }

    const category = await categoryRepository.update(
      id,
      actor.data.restaurantId,
      {
        ...rest,
        updatedBy: actor.data.userId,
      }
    );

    if (!category) {
      return categoryFailure("NOT_FOUND", "Category not found.");
    }

    revalidateCategoryPaths(category.id);
    return categorySuccess(category);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function deleteCategory(
  input: unknown
): Promise<CategoryActionResult<{ id: string }>> {
  const actor = await resolveCategoryActor("categories.delete");
  if (!actor.success) return actor;

  const parsed = deleteCategorySchema.safeParse(input);
  if (!parsed.success) {
    return categoryFailure(
      "VALIDATION_ERROR",
      "Invalid category id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const category = await categoryRepository.softDelete(
      parsed.data.id,
      actor.data.restaurantId,
      actor.data.userId
    );
    if (!category) {
      return categoryFailure("NOT_FOUND", "Category not found.");
    }
    revalidateCategoryPaths(category.id);
    return categorySuccess({ id: category.id });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getCategories(
  input: unknown = {}
): Promise<CategoryActionResult<CategoryListResult>> {
  const actor = await resolveCategoryActor("categories.view");
  if (!actor.success) return actor;

  const parsed = searchCategorySchema.safeParse(input ?? {});
  if (!parsed.success) {
    return categoryFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await categoryRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return categorySuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getCategoryById(
  id: string
): Promise<CategoryActionResult<Category>> {
  const actor = await resolveCategoryActor("categories.view");
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return categoryFailure("VALIDATION_ERROR", "Category id is required.");
  }

  try {
    const category = await categoryRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!category) {
      return categoryFailure("NOT_FOUND", "Category not found.");
    }
    return categorySuccess(category);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function toggleCategoryStatus(
  input: unknown
): Promise<CategoryActionResult<Category>> {
  const actor = await resolveCategoryActor("categories.edit");
  if (!actor.success) return actor;

  const parsed = toggleCategoryStatusSchema.safeParse(input);
  if (!parsed.success) {
    return categoryFailure(
      "VALIDATION_ERROR",
      "Invalid request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const existing = await categoryRepository.findById(
      parsed.data.id,
      actor.data.restaurantId
    );
    if (!existing) {
      return categoryFailure("NOT_FOUND", "Category not found.");
    }

    const nextActive =
      parsed.data.isActive !== undefined
        ? parsed.data.isActive
        : !existing.isActive;

    const category = await categoryRepository.toggleStatus(
      parsed.data.id,
      actor.data.restaurantId,
      nextActive,
      actor.data.userId
    );

    if (!category) {
      return categoryFailure("NOT_FOUND", "Category not found.");
    }

    revalidateCategoryPaths(category.id);
    return categorySuccess(category);
  } catch (error) {
    return mapDbError(error);
  }
}
