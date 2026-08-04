import type { SortOrder } from "mongoose";
import {
  buildPaginationMeta,
  connectToDatabase,
  handleDatabaseError,
  isValidObjectId,
  normalizePagination,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import { serializeCategory } from "@/lib/categories";
import { CategoryModel, type CategoryDocument } from "@/models/category";
import type {
  Category,
  CategoryListResult,
  CategorySortField,
} from "@/types/category";
import type { SearchCategoryInput } from "@/lib/validators/category";

export type CategoryCreateData = {
  restaurantId: string;
  branchId?: string | null;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  color?: string;
  icon?: string;
  isActive?: boolean;
  createdBy?: string | null;
};

export type CategoryUpdateData = Partial<
  Omit<CategoryCreateData, "restaurantId" | "createdBy">
> & {
  updatedBy?: string | null;
};

type CategoryFilter = Record<string, unknown>;

function actorObjectId(userId: string | null | undefined) {
  if (!userId || !isValidObjectId(userId)) return null;
  return toObjectId(userId);
}

function buildSearchFilter(
  restaurantId: string,
  input: SearchCategoryInput
): CategoryFilter {
  const filter: CategoryFilter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  });

  if (input.status === "active") filter.isActive = true;
  if (input.status === "inactive") filter.isActive = false;

  if (input.branchId && isValidObjectId(input.branchId)) {
    filter.branchId = toObjectId(input.branchId);
  }

  if (input.q && input.q.trim()) {
    const q = input.q.trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { slug: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  if (input.createdFrom) {
    const from = new Date(input.createdFrom);
    if (!Number.isNaN(from.getTime())) {
      filter.createdAt = {
        ...((filter.createdAt as object) ?? {}),
        $gte: from,
      };
    }
  }

  if (input.createdTo) {
    const to = new Date(input.createdTo);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      filter.createdAt = {
        ...((filter.createdAt as object) ?? {}),
        $lte: to,
      };
    }
  }

  return filter;
}

function buildSort(
  sortBy: CategorySortField,
  sortOrder: "asc" | "desc"
): Record<string, SortOrder> {
  const direction: SortOrder = sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: direction, _id: 1 };
}

function asDocument(
  doc: CategoryDocument | null | undefined
): CategoryDocument | null {
  return doc ?? null;
}

export const categoryRepository = {
  async create(data: CategoryCreateData): Promise<Category> {
    await connectToDatabase();
    try {
      const doc = await CategoryModel.create({
        restaurantId: toObjectId(data.restaurantId),
        branchId:
          data.branchId && isValidObjectId(data.branchId)
            ? toObjectId(data.branchId)
            : null,
        name: data.name,
        slug: data.slug,
        description: data.description ?? "",
        image: data.image ?? "",
        displayOrder: data.displayOrder ?? 0,
        color: data.color || "#2563EB",
        icon: data.icon ?? "",
        isActive: data.isActive ?? true,
        createdBy: actorObjectId(data.createdBy),
        updatedBy: actorObjectId(data.createdBy),
      });
      return serializeCategory(doc);
    } catch (error) {
      throw handleDatabaseError(error, "Failed to create category");
    }
  },

  async update(
    id: string,
    restaurantId: string,
    data: CategoryUpdateData
  ): Promise<Category | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const update: Record<string, unknown> = {
        updatedBy: actorObjectId(data.updatedBy),
      };

      if (data.name !== undefined) update.name = data.name;
      if (data.slug !== undefined) update.slug = data.slug;
      if (data.description !== undefined) update.description = data.description;
      if (data.image !== undefined) update.image = data.image;
      if (data.displayOrder !== undefined)
        update.displayOrder = data.displayOrder;
      if (data.color !== undefined) update.color = data.color || "#2563EB";
      if (data.icon !== undefined) update.icon = data.icon;
      if (data.isActive !== undefined) update.isActive = data.isActive;
      if (data.branchId !== undefined) {
        update.branchId =
          data.branchId && isValidObjectId(data.branchId)
            ? toObjectId(data.branchId)
            : null;
      }

      const doc = await CategoryModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as CategoryFilter,
        { $set: update, $inc: { version: 1 } },
        { new: true, runValidators: true }
      ).exec();

      const resolved = asDocument(doc as CategoryDocument | null);
      return resolved ? serializeCategory(resolved) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to update category");
    }
  },

  async softDelete(
    id: string,
    restaurantId: string,
    deletedBy?: string | null
  ): Promise<Category | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const doc = await CategoryModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as CategoryFilter,
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            updatedBy: actorObjectId(deletedBy),
          },
          $inc: { version: 1 },
        },
        { new: true }
      ).exec();

      const resolved = asDocument(doc as CategoryDocument | null);
      return resolved ? serializeCategory(resolved) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to delete category");
    }
  },

  async findById(
    id: string,
    restaurantId: string
  ): Promise<Category | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const doc = await CategoryModel.findOne(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as CategoryFilter
      ).exec();
      return doc ? serializeCategory(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load category");
    }
  },

  async findBySlug(
    slug: string,
    restaurantId: string,
    excludeId?: string
  ): Promise<Category | null> {
    await connectToDatabase();
    try {
      const filter: CategoryFilter = notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        slug: slug.toLowerCase(),
      });
      if (excludeId && isValidObjectId(excludeId)) {
        filter._id = { $ne: toObjectId(excludeId) };
      }
      const doc = await CategoryModel.findOne(filter).exec();
      return doc ? serializeCategory(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to check category slug");
    }
  },

  async findMany(
    restaurantId: string,
    input: SearchCategoryInput
  ): Promise<CategoryListResult> {
    await connectToDatabase();
    try {
      const pagination = normalizePagination({
        page: input.page,
        pageSize: input.pageSize,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      });
      const filter = buildSearchFilter(restaurantId, input);
      const sort = buildSort(
        (pagination.sortBy as CategorySortField) || "displayOrder",
        pagination.sortOrder ?? "asc"
      );

      const [total, docs] = await Promise.all([
        CategoryModel.countDocuments(filter),
        CategoryModel.find(filter)
          .sort(sort)
          .skip((pagination.page - 1) * pagination.pageSize)
          .limit(pagination.pageSize)
          .exec(),
      ]);

      return {
        items: docs.map(serializeCategory),
        meta: buildPaginationMeta(
          total,
          pagination.page,
          pagination.pageSize
        ),
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to list categories");
    }
  },

  async toggleStatus(
    id: string,
    restaurantId: string,
    isActive: boolean,
    updatedBy?: string | null
  ): Promise<Category | null> {
    return this.update(id, restaurantId, { isActive, updatedBy });
  },
};
