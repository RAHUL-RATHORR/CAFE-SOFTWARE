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
import { serializeMenuItem } from "@/lib/menu-items";
import { CategoryModel } from "@/models/category";
import { MenuItemModel, type MenuItemDocument } from "@/models/menu-item";
import type {
  MenuItem,
  MenuItemCustomizationGroup,
  MenuItemListResult,
  MenuItemSortField,
} from "@/types/menu-item";
import type { SearchMenuItemInput } from "@/lib/validators/menu-item";

export type MenuItemCreateData = {
  restaurantId: string;
  branchId?: string | null;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  image?: string;
  gallery?: string[];
  price: number;
  discountPrice?: number | null;
  taxRate?: number;
  preparationTime?: number;
  calories?: number | null;
  isVeg?: boolean;
  isAvailable?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  tags?: string[];
  customizationGroups?: MenuItemCustomizationGroup[];
  createdBy?: string | null;
};

export type MenuItemUpdateData = Partial<
  Omit<MenuItemCreateData, "restaurantId" | "createdBy">
> & {
  updatedBy?: string | null;
};

type MenuItemFilter = Record<string, unknown>;

function actorObjectId(userId: string | null | undefined) {
  if (!userId || !isValidObjectId(userId)) return null;
  return toObjectId(userId);
}

function asDocument(
  doc: MenuItemDocument | null | undefined
): MenuItemDocument | null {
  return doc ?? null;
}

function buildSearchFilter(
  restaurantId: string,
  input: SearchMenuItemInput
): MenuItemFilter {
  const filter: MenuItemFilter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  });

  if (input.categoryId && isValidObjectId(input.categoryId)) {
    filter.categoryId = toObjectId(input.categoryId);
  }

  if (input.availability === "available") filter.isAvailable = true;
  if (input.availability === "unavailable") filter.isAvailable = false;

  if (input.veg === "veg") filter.isVeg = true;
  if (input.veg === "non-veg") filter.isVeg = false;

  if (input.featured === "featured") filter.isFeatured = true;
  if (input.featured === "not-featured") filter.isFeatured = false;

  if (input.q && input.q.trim()) {
    const q = input.q.trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { slug: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
    ];
  }

  const priceFilter: Record<string, number> = {};
  if (input.minPrice != null) priceFilter.$gte = input.minPrice;
  if (input.maxPrice != null) priceFilter.$lte = input.maxPrice;
  if (Object.keys(priceFilter).length > 0) {
    filter.price = priceFilter;
  }

  return filter;
}

function buildSort(
  sortBy: MenuItemSortField,
  sortOrder: "asc" | "desc"
): Record<string, SortOrder> {
  const direction: SortOrder = sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: direction, _id: 1 };
}

async function resolveCategoryNames(
  restaurantId: string,
  categoryIds: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(categoryIds.filter((id) => isValidObjectId(id)))];
  if (unique.length === 0) return new Map();

  const docs = await CategoryModel.find(
    notDeletedFilter({
      restaurantId: toObjectId(restaurantId),
      _id: { $in: unique.map((id) => toObjectId(id)) },
    }) as Record<string, unknown>
  )
    .select({ name: 1 })
    .exec();

  const map = new Map<string, string>();
  for (const doc of docs) {
    map.set(String(doc._id), doc.name);
  }
  return map;
}

export const menuItemRepository = {
  async assertCategoryExists(
    categoryId: string,
    restaurantId: string
  ): Promise<boolean> {
    await connectToDatabase();
    if (!isValidObjectId(categoryId)) return false;
    const doc = await CategoryModel.findOne(
      notDeletedFilter({
        _id: toObjectId(categoryId),
        restaurantId: toObjectId(restaurantId),
      }) as Record<string, unknown>
    )
      .select({ _id: 1 })
      .lean()
      .exec();
    return Boolean(doc);
  },

  async create(data: MenuItemCreateData): Promise<MenuItem> {
    await connectToDatabase();
    try {
      const doc = await MenuItemModel.create({
        restaurantId: toObjectId(data.restaurantId),
        branchId:
          data.branchId && isValidObjectId(data.branchId)
            ? toObjectId(data.branchId)
            : null,
        categoryId: toObjectId(data.categoryId),
        name: data.name,
        slug: data.slug,
        description: data.description ?? "",
        shortDescription: data.shortDescription ?? "",
        sku: (data.sku ?? "").trim().toUpperCase(),
        image: data.image ?? "",
        gallery: data.gallery ?? [],
        price: data.price,
        discountPrice: data.discountPrice ?? null,
        taxRate: data.taxRate ?? 0,
        preparationTime: data.preparationTime ?? 0,
        calories: data.calories ?? null,
        isVeg: data.isVeg ?? true,
        isAvailable: data.isAvailable ?? true,
        isFeatured: data.isFeatured ?? false,
        displayOrder: data.displayOrder ?? 0,
        tags: data.tags ?? [],
        customizationGroups: data.customizationGroups ?? [],
        createdBy: actorObjectId(data.createdBy),
        updatedBy: actorObjectId(data.createdBy),
      });

      const names = await resolveCategoryNames(data.restaurantId, [
        data.categoryId,
      ]);
      return serializeMenuItem(doc, names.get(data.categoryId) ?? null);
    } catch (error) {
      throw handleDatabaseError(error, "Failed to create menu item");
    }
  },

  async update(
    id: string,
    restaurantId: string,
    data: MenuItemUpdateData
  ): Promise<MenuItem | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const update: Record<string, unknown> = {
        updatedBy: actorObjectId(data.updatedBy),
      };

      if (data.categoryId !== undefined) {
        update.categoryId = toObjectId(data.categoryId);
      }
      if (data.name !== undefined) update.name = data.name;
      if (data.slug !== undefined) update.slug = data.slug;
      if (data.description !== undefined) update.description = data.description;
      if (data.shortDescription !== undefined)
        update.shortDescription = data.shortDescription;
      if (data.sku !== undefined)
        update.sku = data.sku.trim().toUpperCase();
      if (data.image !== undefined) update.image = data.image;
      if (data.gallery !== undefined) update.gallery = data.gallery;
      if (data.price !== undefined) update.price = data.price;
      if (data.discountPrice !== undefined)
        update.discountPrice = data.discountPrice;
      if (data.taxRate !== undefined) update.taxRate = data.taxRate;
      if (data.preparationTime !== undefined)
        update.preparationTime = data.preparationTime;
      if (data.calories !== undefined) update.calories = data.calories;
      if (data.isVeg !== undefined) update.isVeg = data.isVeg;
      if (data.isAvailable !== undefined) update.isAvailable = data.isAvailable;
      if (data.isFeatured !== undefined) update.isFeatured = data.isFeatured;
      if (data.displayOrder !== undefined)
        update.displayOrder = data.displayOrder;
      if (data.tags !== undefined) update.tags = data.tags;
      if (data.customizationGroups !== undefined) {
        update.customizationGroups = data.customizationGroups;
      }
      if (data.branchId !== undefined) {
        update.branchId =
          data.branchId && isValidObjectId(data.branchId)
            ? toObjectId(data.branchId)
            : null;
      }

      const doc = await MenuItemModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as MenuItemFilter,
        { $set: update, $inc: { version: 1 } },
        { new: true, runValidators: true }
      ).exec();

      const resolved = asDocument(doc as MenuItemDocument | null);
      if (!resolved) return null;

      const categoryId = idToStringSafe(resolved.categoryId) ?? "";
      const names = await resolveCategoryNames(restaurantId, [categoryId]);
      return serializeMenuItem(resolved, names.get(categoryId) ?? null);
    } catch (error) {
      throw handleDatabaseError(error, "Failed to update menu item");
    }
  },

  async softDelete(
    id: string,
    restaurantId: string,
    deletedBy?: string | null
  ): Promise<MenuItem | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const doc = await MenuItemModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as MenuItemFilter,
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

      const resolved = asDocument(doc as MenuItemDocument | null);
      return resolved ? serializeMenuItem(resolved) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to delete menu item");
    }
  },

  async findById(
    id: string,
    restaurantId: string
  ): Promise<MenuItem | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const doc = await MenuItemModel.findOne(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as MenuItemFilter
      ).exec();
      if (!doc) return null;
      const categoryId = idToStringSafe(doc.categoryId) ?? "";
      const names = await resolveCategoryNames(restaurantId, [categoryId]);
      return serializeMenuItem(doc, names.get(categoryId) ?? null);
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load menu item");
    }
  },

  async findBySlug(
    slug: string,
    restaurantId: string,
    excludeId?: string
  ): Promise<MenuItem | null> {
    await connectToDatabase();
    try {
      const filter: MenuItemFilter = notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        slug: slug.toLowerCase(),
      });
      if (excludeId && isValidObjectId(excludeId)) {
        filter._id = { $ne: toObjectId(excludeId) };
      }
      const doc = await MenuItemModel.findOne(filter).exec();
      return doc ? serializeMenuItem(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to check menu item slug");
    }
  },

  async findBySku(
    sku: string,
    restaurantId: string,
    excludeId?: string
  ): Promise<MenuItem | null> {
    await connectToDatabase();
    const normalized = sku.trim().toUpperCase();
    if (!normalized) return null;

    try {
      const filter: MenuItemFilter = notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        sku: normalized,
      });
      if (excludeId && isValidObjectId(excludeId)) {
        filter._id = { $ne: toObjectId(excludeId) };
      }
      const doc = await MenuItemModel.findOne(filter).exec();
      return doc ? serializeMenuItem(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to check menu item SKU");
    }
  },

  async findMany(
    restaurantId: string,
    input: SearchMenuItemInput
  ): Promise<MenuItemListResult> {
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
        (pagination.sortBy as MenuItemSortField) || "displayOrder",
        pagination.sortOrder ?? "asc"
      );

      const [total, docs] = await Promise.all([
        MenuItemModel.countDocuments(filter),
        MenuItemModel.find(filter)
          .sort(sort)
          .skip((pagination.page - 1) * pagination.pageSize)
          .limit(pagination.pageSize)
          .exec(),
      ]);

      const categoryIds = docs
        .map((doc) => idToStringSafe(doc.categoryId))
        .filter(Boolean) as string[];
      const names = await resolveCategoryNames(restaurantId, categoryIds);

      return {
        items: docs.map((doc) => {
          const categoryId = idToStringSafe(doc.categoryId) ?? "";
          return serializeMenuItem(doc, names.get(categoryId) ?? null);
        }),
        meta: buildPaginationMeta(
          total,
          pagination.page,
          pagination.pageSize
        ),
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to list menu items");
    }
  },
};

function idToStringSafe(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}
