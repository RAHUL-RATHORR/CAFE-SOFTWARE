"use server";

import {
  connectToDatabase,
  handleDatabaseError,
  isValidObjectId,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import { billingFailure, billingSuccess } from "@/lib/billing";
import { CategoryModel } from "@/models/category";
import { MenuItemModel } from "@/models/menu-item";
import { resolveBillingActor } from "@/actions/billing/context";
import type { BillingActionResult, PosCatalog } from "@/types/billing";

export async function getPosCatalog(
  branchId?: string | null
): Promise<BillingActionResult<PosCatalog>> {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.create",
    "billing.manage",
  ], branchId);
  if (!actor.success) return actor;

  try {
    await connectToDatabase();
    const filter: Record<string, unknown> = notDeletedFilter({
      restaurantId: toObjectId(actor.data.restaurantId),
    });

    const activeBranchId = branchId || actor.data.branchId;
    const itemFilter: Record<string, unknown> = {
      ...filter,
      isAvailable: true,
    };

    if (activeBranchId && isValidObjectId(activeBranchId)) {
      itemFilter.$or = [
        { branchId: toObjectId(activeBranchId) },
        { branchId: null },
        { branchId: { $exists: false } },
      ];
    }

    const [categories, items] = await Promise.all([
      CategoryModel.find(filter)
        .sort({ displayOrder: 1, name: 1 })
        .select({ name: 1 })
        .limit(100)
        .lean()
        .exec(),
      MenuItemModel.find(itemFilter)
        .sort({ displayOrder: 1, name: 1 })
        .select({
          name: 1,
          price: 1,
          discountPrice: 1,
          categoryId: 1,
          image: 1,
          isVeg: 1,
          isAvailable: 1,
          customizationGroups: 1,
        })
        .limit(400)
        .lean()
        .exec(),
    ]);

    const categoryNames = new Map(
      categories.map((category) => [String(category._id), category.name])
    );

    return billingSuccess({
      categories: [
        { id: "all", name: "All" },
        ...categories.map((category) => ({
          id: String(category._id),
          name: category.name,
        })),
      ],
      items: items.map((item) => ({
        id: String(item._id),
        name: item.name,
        price:
          item.discountPrice != null
            ? Number(item.discountPrice)
            : Number(item.price ?? 0),
        categoryId: String(item.categoryId),
        categoryName: categoryNames.get(String(item.categoryId)) ?? null,
        isAvailable: Boolean(item.isAvailable),
        isVeg: Boolean(item.isVeg ?? true),
        image: item.image ?? "",
        customizationGroups: (item.customizationGroups ?? []).map((g: {
          id?: string;
          name: string;
          minSelections?: number;
          maxSelections?: number;
          isRequired?: boolean;
          options?: Array<{
            id?: string;
            name: string;
            priceDelta?: number;
            isDefault?: boolean;
          }>;
        }) => ({
          id: g.id || g.name,
          name: g.name,
          minSelections: g.minSelections,
          maxSelections: g.maxSelections,
          isRequired: g.isRequired,
          options: (g.options ?? []).map((o: {
            id?: string;
            name: string;
            priceDelta?: number;
            isDefault?: boolean;
          }) => ({
            id: o.id || o.name,
            name: o.name,
            priceDelta: Number(o.priceDelta ?? 0),
            isDefault: Boolean(o.isDefault),
          })),
        })),
      })),
    });
  } catch (error) {
    const dbError = handleDatabaseError(error, "Failed to load POS catalog");
    return billingFailure("DATABASE_ERROR", dbError.message);
  }
}
