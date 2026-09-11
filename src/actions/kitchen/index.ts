"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  kitchenFailure,
  kitchenSuccess,
  toKitchenTicket,
  zodFieldErrors,
} from "@/lib/kitchen";
import {
  acceptKitchenOrderSchema,
  cancelKitchenOrderSchema,
  markReadyKitchenOrderSchema,
  markServedKitchenOrderSchema,
  searchKitchenSchema,
  startPreparingKitchenOrderSchema,
  updateKitchenPrioritySchema,
  updateKitchenStatusSchema,
} from "@/lib/validators/kitchen";
import { kitchenRepository } from "@/repositories/kitchen";
import { orderRepository } from "@/repositories/order";
import { resolveKitchenActor } from "@/actions/kitchen/context";
import { InventoryConsumptionService } from "@/lib/inventory/inventory-consumption-service";
import type {
  KitchenActionResult,
  KitchenDashboardData,
  KitchenFilterOptions,
  KitchenTicket,
} from "@/types/kitchen";

function mapDbError(error: unknown): KitchenActionResult<never> {
  if (error instanceof Error) {
    if (error.message.startsWith("INVALID_TRANSITION")) {
      return kitchenFailure("INVALID_TRANSITION", error.message);
    }
    if (error.message.startsWith("CONFLICT")) {
      return kitchenFailure("CONFLICT", error.message);
    }
    if (error.message === "NOT_FOUND") {
      return kitchenFailure("NOT_FOUND", "Order not found or no longer active.");
    }
  }
  if (isDatabaseError(error)) {
    return kitchenFailure("DATABASE_ERROR", error.message);
  }
  return kitchenFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateKitchenPaths(id?: string) {
  revalidatePath("/kitchen");
  revalidatePath("/orders");
  if (id) {
    revalidatePath(`/kitchen/${id}`);
    revalidatePath(`/orders/${id}`);
  }
}

export async function getKitchenDashboard(
  input: unknown = {}
): Promise<KitchenActionResult<KitchenDashboardData>> {
  const actor = await resolveKitchenActor([
    "kitchen.view",
    "kitchen.manage",
    "orders.view",
  ]);
  if (!actor.success) return actor;

  const parsed = searchKitchenSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return kitchenFailure(
      "VALIDATION_ERROR",
      "Invalid kitchen filters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const data = await kitchenRepository.getDashboard(
      actor.data.restaurantId,
      parsed.data,
      actor.data.branchId
    );
    return kitchenSuccess(data);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getKitchenOrder(
  id: string
): Promise<KitchenActionResult<KitchenTicket>> {
  const actor = await resolveKitchenActor([
    "kitchen.view",
    "kitchen.manage",
    "orders.view",
  ]);
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return kitchenFailure("VALIDATION_ERROR", "Order id is required.");
  }

  try {
    const order = await orderRepository.findById(id, actor.data.restaurantId);
    if (!order) {
      return kitchenFailure("NOT_FOUND", "Kitchen order not found.");
    }
    if (actor.data.branchId && order.branchId && order.branchId !== actor.data.branchId) {
      return kitchenFailure(
        "FORBIDDEN",
        "You do not have access to this branch order."
      );
    }
    const ticket = toKitchenTicket(order);
    if (!ticket) {
      return kitchenFailure(
        "NOT_FOUND",
        "This order is not currently on the active kitchen board."
      );
    }
    return kitchenSuccess(ticket);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getKitchenFilterOptions(): Promise<
  KitchenActionResult<KitchenFilterOptions>
> {
  const actor = await resolveKitchenActor([
    "kitchen.view",
    "kitchen.manage",
    "orders.view",
  ]);
  if (!actor.success) return actor;

  try {
    const options = await kitchenRepository.getFilterOptions(
      actor.data.restaurantId,
      actor.data.branchId
    );
    return kitchenSuccess(options);
  } catch (error) {
    return mapDbError(error);
  }
}

/**
 * ACCEPT ORDER: pending -> confirmed
 */
export async function acceptKitchenOrder(
  input: unknown
): Promise<KitchenActionResult<KitchenTicket>> {
  const actor = await resolveKitchenActor([
    "kitchen.update",
    "kitchen.manage",
    "kitchen.edit",
    "orders.changeStatus",
  ]);
  if (!actor.success) return actor;

  const parsed = acceptKitchenOrderSchema.safeParse(input);
  if (!parsed.success) {
    return kitchenFailure(
      "VALIDATION_ERROR",
      "Invalid accept request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const order = await kitchenRepository.changeOrderStatusAtomic({
      orderId: parsed.data.id,
      restaurantId: actor.data.restaurantId,
      nextStatus: "confirmed",
      userBranchId: actor.data.branchId,
      changedBy: actor.data.userId,
      note: parsed.data.note || "Order accepted in kitchen",
    });

    const ticket = toKitchenTicket(order);
    revalidateKitchenPaths(order.id);

    // Auto-deduct inventory stock upon kitchen acceptance (idempotent & non-blocking)
    const effectiveBranchId = order.branchId || actor.data.branchId || "";
    if (effectiveBranchId && order.items && order.items.length > 0) {
      InventoryConsumptionService.deductOrderStock(
        actor.data.restaurantId,
        effectiveBranchId,
        order.id,
        order.items.map((item) => ({
          menuItemId: item.menuItemId || "",
          name: item.name,
          quantity: item.quantity,
          variantId: item.customizations?.find((c) => c.groupId === "variant")?.optionId || null,
          selectedAddons: (item.customizations || [])
            .filter((c) => c.groupId !== "variant")
            .map((c) => ({
              addonOptionId: c.optionId,
              name: c.optionName,
              quantity: 1,
            })),
        })),
        {
          orderNumber: order.orderNumber,
          performedBy: actor.data.userId,
        }
      ).catch((invErr) => {
        console.error("[Kitchen Accept] Inventory deduction non-fatal error:", invErr);
      });
    }

    if (!ticket) {
      return kitchenFailure("NOT_FOUND", "Order left kitchen board.");
    }
    return kitchenSuccess(ticket);
  } catch (error) {
    return mapDbError(error);
  }
}

/**
 * START PREPARING: confirmed -> preparing
 */
export async function startPreparingKitchenOrder(
  input: unknown
): Promise<KitchenActionResult<KitchenTicket>> {
  const actor = await resolveKitchenActor([
    "kitchen.update",
    "kitchen.manage",
    "kitchen.edit",
    "orders.changeStatus",
  ]);
  if (!actor.success) return actor;

  const parsed = startPreparingKitchenOrderSchema.safeParse(input);
  if (!parsed.success) {
    return kitchenFailure(
      "VALIDATION_ERROR",
      "Invalid prepare request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const order = await kitchenRepository.changeOrderStatusAtomic({
      orderId: parsed.data.id,
      restaurantId: actor.data.restaurantId,
      nextStatus: "preparing",
      userBranchId: actor.data.branchId,
      changedBy: actor.data.userId,
      note: parsed.data.note || "Preparation started in kitchen",
    });

    const ticket = toKitchenTicket(order);
    revalidateKitchenPaths(order.id);
    if (!ticket) {
      return kitchenFailure("NOT_FOUND", "Order left kitchen board.");
    }
    return kitchenSuccess(ticket);
  } catch (error) {
    return mapDbError(error);
  }
}

/**
 * READY: preparing -> ready
 */
export async function markReadyKitchenOrder(
  input: unknown
): Promise<KitchenActionResult<KitchenTicket>> {
  const actor = await resolveKitchenActor([
    "kitchen.update",
    "kitchen.manage",
    "kitchen.edit",
    "orders.changeStatus",
  ]);
  if (!actor.success) return actor;

  const parsed = markReadyKitchenOrderSchema.safeParse(input);
  if (!parsed.success) {
    return kitchenFailure(
      "VALIDATION_ERROR",
      "Invalid ready request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const order = await kitchenRepository.changeOrderStatusAtomic({
      orderId: parsed.data.id,
      restaurantId: actor.data.restaurantId,
      nextStatus: "ready",
      userBranchId: actor.data.branchId,
      changedBy: actor.data.userId,
      note: parsed.data.note || "Order marked ready in kitchen",
    });

    const ticket = toKitchenTicket(order);
    revalidateKitchenPaths(order.id);
    if (!ticket) {
      return kitchenFailure("NOT_FOUND", "Order left kitchen board.");
    }
    return kitchenSuccess(ticket);
  } catch (error) {
    return mapDbError(error);
  }
}

/**
 * SERVED: ready -> served
 */
export async function markServedKitchenOrder(
  input: unknown
): Promise<KitchenActionResult<KitchenTicket>> {
  const actor = await resolveKitchenActor([
    "kitchen.complete",
    "kitchen.manage",
    "orders.changeStatus",
  ]);
  if (!actor.success) return actor;

  const parsed = markServedKitchenOrderSchema.safeParse(input);
  if (!parsed.success) {
    return kitchenFailure(
      "VALIDATION_ERROR",
      "Invalid served request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const order = await kitchenRepository.changeOrderStatusAtomic({
      orderId: parsed.data.id,
      restaurantId: actor.data.restaurantId,
      nextStatus: "served",
      userBranchId: actor.data.branchId,
      changedBy: actor.data.userId,
      note: parsed.data.note || "Order marked served to customer",
    });

    revalidateKitchenPaths(order.id);
    return kitchenSuccess({
      ...order,
      elapsedMs: 0,
      elapsedLabel: "00:00",
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      boardColumn: "ready",
      urgencyLevel: "normal",
    });
  } catch (error) {
    return mapDbError(error);
  }
}

/**
 * CANCEL ORDER: any active status -> cancelled
 */
export async function cancelKitchenOrder(
  input: unknown
): Promise<KitchenActionResult<KitchenTicket>> {
  const actor = await resolveKitchenActor([
    "kitchen.manage",
    "orders.edit",
    "orders.changeStatus",
  ]);
  if (!actor.success) return actor;

  const parsed = cancelKitchenOrderSchema.safeParse(input);
  if (!parsed.success) {
    return kitchenFailure(
      "VALIDATION_ERROR",
      "Invalid cancel request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const order = await kitchenRepository.changeOrderStatusAtomic({
      orderId: parsed.data.id,
      restaurantId: actor.data.restaurantId,
      nextStatus: "cancelled",
      userBranchId: actor.data.branchId,
      changedBy: actor.data.userId,
      note: parsed.data.reason || "Order cancelled from kitchen",
    });

    revalidateKitchenPaths(order.id);

    // Reverse inventory stock (idempotent & non-blocking)
    const effectiveBranchId = order.branchId || actor.data.branchId || "";
    if (effectiveBranchId) {
      InventoryConsumptionService.reverseOrderStock(
        actor.data.restaurantId,
        effectiveBranchId,
        order.id,
        parsed.data.reason || "Order cancelled from kitchen",
        actor.data.userId
      ).catch((revErr) => {
        console.error("[Kitchen Cancel] Inventory reversal non-fatal error:", revErr);
      });
    }

    return kitchenSuccess({
      ...order,
      elapsedMs: 0,
      elapsedLabel: "00:00",
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      boardColumn: "new",
      urgencyLevel: "normal",
    });
  } catch (error) {
    return mapDbError(error);
  }
}

/**
 * Generic status update (retained for backward compatibility).
 */
export async function updateKitchenOrderStatus(
  input: unknown
): Promise<KitchenActionResult<KitchenTicket>> {
  const parsed = updateKitchenStatusSchema.safeParse(input);
  if (!parsed.success) {
    return kitchenFailure(
      "VALIDATION_ERROR",
      "Invalid status update.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  switch (parsed.data.status) {
    case "confirmed":
      return acceptKitchenOrder({ id: parsed.data.id, note: parsed.data.note });
    case "preparing":
      return startPreparingKitchenOrder({
        id: parsed.data.id,
        note: parsed.data.note,
      });
    case "ready":
      return markReadyKitchenOrder({
        id: parsed.data.id,
        note: parsed.data.note,
      });
    case "served":
    case "completed":
      return markServedKitchenOrder({
        id: parsed.data.id,
        note: parsed.data.note,
      });
    case "cancelled":
      return cancelKitchenOrder({
        id: parsed.data.id,
        reason: parsed.data.note,
      });
    default:
      return kitchenFailure(
        "INVALID_TRANSITION",
        `Unsupported target status ${parsed.data.status}`
      );
  }
}

export async function completeKitchenOrder(
  input: unknown
): Promise<KitchenActionResult<KitchenTicket>> {
  return markServedKitchenOrder(input);
}

export async function updateKitchenPriority(
  input: unknown
): Promise<KitchenActionResult<KitchenTicket>> {
  const actor = await resolveKitchenActor([
    "kitchen.update",
    "kitchen.manage",
    "kitchen.edit",
  ]);
  if (!actor.success) return actor;

  const parsed = updateKitchenPrioritySchema.safeParse(input);
  if (!parsed.success) {
    return kitchenFailure(
      "VALIDATION_ERROR",
      "Invalid priority update.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const order = await orderRepository.update(
      parsed.data.id,
      actor.data.restaurantId,
      {
        priority: parsed.data.priority,
        updatedBy: actor.data.userId,
      }
    );
    if (!order) {
      return kitchenFailure("NOT_FOUND", "Kitchen order not found.");
    }
    const ticket = toKitchenTicket(order);
    if (!ticket) {
      return kitchenFailure(
        "NOT_FOUND",
        "This order is not on the kitchen board."
      );
    }
    revalidateKitchenPaths(ticket.id);
    return kitchenSuccess(ticket);
  } catch (error) {
    return mapDbError(error);
  }
}
