"use server";

import {
  connectToDatabase,
  handleDatabaseError,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import { billingFailure, billingSuccess } from "@/lib/billing";
import { CategoryModel } from "@/models/category";
import { MenuItemModel } from "@/models/menu-item";
import { resolveBillingActor } from "@/actions/billing/context";
import type { BillingActionResult, PosCatalog } from "@/types/billing";

export async function getPosCatalog(): Promise<
  BillingActionResult<PosCatalog>
> {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.create",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  try {
    await connectToDatabase();
    const filter = notDeletedFilter({
      restaurantId: toObjectId(actor.data.restaurantId),
    });

    const [categories, items] = await Promise.all([
      CategoryModel.find(filter as Record<string, unknown>)
        .sort({ displayOrder: 1, name: 1 })
        .select({ name: 1 })
        .limit(100)
        .lean()
        .exec(),
      MenuItemModel.find({
        ...(filter as Record<string, unknown>),
        isAvailable: true,
      })
        .sort({ displayOrder: 1, name: 1 })
        .select({
          name: 1,
          price: 1,
          discountPrice: 1,
          categoryId: 1,
          image: 1,
          isAvailable: 1,
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
        image: item.image ?? "",
      })),
    });
  } catch (error) {
    const dbError = handleDatabaseError(error, "Failed to load POS catalog");
    return billingFailure("DATABASE_ERROR", dbError.message);
  }
}
