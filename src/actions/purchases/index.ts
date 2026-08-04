"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  purchaseFailure,
  purchaseSuccess,
  zodFieldErrors,
} from "@/lib/purchases";
import { isPurchaseEditable } from "@/config/purchases";
import {
  createPurchaseOrderSchema,
  deletePurchaseOrderSchema,
  searchPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updatePurchaseStatusSchema,
} from "@/lib/validators/purchase";
import { purchaseOrderRepository } from "@/repositories/purchase";
import { vendorRepository } from "@/repositories/vendor";
import { ingredientRepository } from "@/repositories/inventory";
import { resolvePurchaseActor } from "@/actions/purchases/context";
import type {
  PurchaseActionResult,
  PurchaseFormOptions,
  PurchaseOrder,
  PurchaseOrderListResult,
} from "@/types/purchase";

function mapDbError(error: unknown): PurchaseActionResult<never> {
  if (isDatabaseError(error)) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      return purchaseFailure(
        "DUPLICATE_PURCHASE",
        "A purchase order with this number already exists.",
        { purchaseNumber: ["This purchase number may already be in use."] }
      );
    }
    return purchaseFailure("DATABASE_ERROR", error.message);
  }
  return purchaseFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidatePurchasePaths(id?: string) {
  revalidatePath("/purchases");
  if (id) {
    revalidatePath(`/purchases/${id}`);
    revalidatePath(`/purchases/${id}/edit`);
  }
}

export async function createPurchaseOrder(
  input: unknown
): Promise<PurchaseActionResult<PurchaseOrder>> {
  const actor = await resolvePurchaseActor([
    "purchases.create",
    "purchases.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = createPurchaseOrderSchema.safeParse(input);
  if (!parsed.success) {
    return purchaseFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;

  try {
    if (values.vendorId) {
      const vendor = await vendorRepository.findById(
        values.vendorId,
        actor.data.restaurantId
      );
      if (!vendor) {
        return purchaseFailure("VALIDATION_ERROR", "Selected vendor not found.", {
          vendorId: ["Select a valid vendor."],
        });
      }
    }

    const purchase = await purchaseOrderRepository.create({
      restaurantId: actor.data.restaurantId,
      branchId: values.branchId ?? null,
      vendorId: values.vendorId ?? null,
      purchaseNumber: values.purchaseNumber || undefined,
      status: values.status,
      items: values.items,
      discount: values.discount,
      tax: values.tax,
      shippingCost: values.shippingCost,
      expectedDelivery: values.expectedDelivery ?? null,
      receivedDate: values.receivedDate ?? null,
      notes: values.notes ?? "",
      createdBy: actor.data.userId,
    });

    revalidatePurchasePaths(purchase.id);
    return purchaseSuccess(purchase);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updatePurchaseOrder(
  input: unknown
): Promise<PurchaseActionResult<PurchaseOrder>> {
  const actor = await resolvePurchaseActor([
    "purchases.edit",
    "purchases.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updatePurchaseOrderSchema.safeParse(input);
  if (!parsed.success) {
    return purchaseFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;

  try {
    const existing = await purchaseOrderRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!existing) {
      return purchaseFailure("NOT_FOUND", "Purchase order not found.");
    }
    if (!isPurchaseEditable(existing.status) && rest.items) {
      return purchaseFailure(
        "INVALID_STATUS",
        "This purchase order can no longer be edited."
      );
    }

    if (rest.vendorId) {
      const vendor = await vendorRepository.findById(
        rest.vendorId,
        actor.data.restaurantId
      );
      if (!vendor) {
        return purchaseFailure("VALIDATION_ERROR", "Selected vendor not found.", {
          vendorId: ["Select a valid vendor."],
        });
      }
    }

    const purchase = await purchaseOrderRepository.update(
      id,
      actor.data.restaurantId,
      {
        ...rest,
        updatedBy: actor.data.userId,
      }
    );

    if (!purchase) {
      return purchaseFailure("NOT_FOUND", "Purchase order not found.");
    }

    revalidatePurchasePaths(purchase.id);
    return purchaseSuccess(purchase);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function deletePurchaseOrder(
  input: unknown
): Promise<PurchaseActionResult<{ id: string }>> {
  const actor = await resolvePurchaseActor([
    "purchases.delete",
    "purchases.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = deletePurchaseOrderSchema.safeParse(input);
  if (!parsed.success) {
    return purchaseFailure(
      "VALIDATION_ERROR",
      "Invalid purchase id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const purchase = await purchaseOrderRepository.softDelete(
      parsed.data.id,
      actor.data.restaurantId,
      actor.data.userId
    );
    if (!purchase) {
      return purchaseFailure("NOT_FOUND", "Purchase order not found.");
    }
    revalidatePurchasePaths(purchase.id);
    return purchaseSuccess({ id: purchase.id });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getPurchaseOrders(
  input: unknown = {}
): Promise<PurchaseActionResult<PurchaseOrderListResult>> {
  const actor = await resolvePurchaseActor([
    "purchases.view",
    "purchases.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = searchPurchaseOrderSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return purchaseFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await purchaseOrderRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return purchaseSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getPurchaseOrderById(
  id: string
): Promise<PurchaseActionResult<PurchaseOrder>> {
  const actor = await resolvePurchaseActor([
    "purchases.view",
    "purchases.manage",
  ]);
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return purchaseFailure("VALIDATION_ERROR", "Purchase id is required.");
  }

  try {
    const purchase = await purchaseOrderRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!purchase) {
      return purchaseFailure("NOT_FOUND", "Purchase order not found.");
    }
    return purchaseSuccess(purchase);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updatePurchaseStatus(
  input: unknown
): Promise<PurchaseActionResult<PurchaseOrder>> {
  const actor = await resolvePurchaseActor([
    "purchases.approve",
    "purchases.edit",
    "purchases.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updatePurchaseStatusSchema.safeParse(input);
  if (!parsed.success) {
    return purchaseFailure(
      "VALIDATION_ERROR",
      "Invalid status change.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const purchase = await purchaseOrderRepository.update(
      parsed.data.id,
      actor.data.restaurantId,
      {
        status: parsed.data.status,
        statusNote: parsed.data.note,
        updatedBy: actor.data.userId,
      }
    );
    if (!purchase) {
      return purchaseFailure("NOT_FOUND", "Purchase order not found.");
    }
    revalidatePurchasePaths(purchase.id);
    return purchaseSuccess(purchase);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getPurchaseFormOptions(): Promise<
  PurchaseActionResult<PurchaseFormOptions>
> {
  const actor = await resolvePurchaseActor([
    "purchases.view",
    "purchases.create",
    "purchases.edit",
    "purchases.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const [vendors, ingredients] = await Promise.all([
      vendorRepository.listOptions(actor.data.restaurantId),
      ingredientRepository.listOptions(actor.data.restaurantId),
    ]);
    return purchaseSuccess({ vendors, ingredients });
  } catch (error) {
    return mapDbError(error);
  }
}
