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
  completeKitchenOrderSchema,
  searchKitchenSchema,
  updateKitchenPrioritySchema,
  updateKitchenStatusSchema,
} from "@/lib/validators/kitchen";
import { kitchenRepository } from "@/repositories/kitchen";
import { orderRepository } from "@/repositories/order";
import { resolveKitchenActor } from "@/actions/kitchen/context";
import type {
  KitchenActionResult,
  KitchenDashboardData,
  KitchenFilterOptions,
  KitchenTicket,
} from "@/types/kitchen";

function mapDbError(error: unknown): KitchenActionResult<never> {
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
      parsed.data
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
    const ticket = toKitchenTicket(order);
    if (!ticket) {
      return kitchenFailure(
        "NOT_FOUND",
        "This order is not available on the kitchen board."
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
  ]);
  if (!actor.success) return actor;

  try {
    const options = await kitchenRepository.getFilterOptions(
      actor.data.restaurantId
    );
    return kitchenSuccess(options);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateKitchenOrderStatus(
  input: unknown
): Promise<KitchenActionResult<KitchenTicket>> {
  const actor = await resolveKitchenActor([
    "kitchen.update",
    "kitchen.manage",
    "kitchen.edit",
  ]);
  if (!actor.success) return actor;

  const parsed = updateKitchenStatusSchema.safeParse(input);
  if (!parsed.success) {
    return kitchenFailure(
      "VALIDATION_ERROR",
      "Invalid status update.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const order = await orderRepository.changeStatus(
      parsed.data.id,
      actor.data.restaurantId,
      parsed.data.status,
      actor.data.userId,
      parsed.data.note || `Kitchen status → ${parsed.data.status}`
    );
    if (!order) {
      return kitchenFailure("NOT_FOUND", "Kitchen order not found.");
    }
    const ticket = toKitchenTicket(order);
    if (!ticket) {
      revalidateKitchenPaths(order.id);
      return kitchenFailure(
        "NOT_FOUND",
        "Order left the active kitchen board."
      );
    }
    revalidateKitchenPaths(ticket.id);
    return kitchenSuccess(ticket);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function completeKitchenOrder(
  input: unknown
): Promise<KitchenActionResult<KitchenTicket>> {
  const actor = await resolveKitchenActor([
    "kitchen.complete",
    "kitchen.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = completeKitchenOrderSchema.safeParse(input);
  if (!parsed.success) {
    return kitchenFailure(
      "VALIDATION_ERROR",
      "Invalid order id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const order = await orderRepository.changeStatus(
      parsed.data.id,
      actor.data.restaurantId,
      "completed",
      actor.data.userId,
      "Marked completed from kitchen"
    );
    if (!order) {
      return kitchenFailure("NOT_FOUND", "Kitchen order not found.");
    }
    const ticket = toKitchenTicket(order);
    revalidateKitchenPaths(order.id);
    if (!ticket) {
      return kitchenSuccess({
        ...order,
        elapsedMs: 0,
        elapsedLabel: "0s",
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        boardColumn: "completed",
      });
    }
    return kitchenSuccess(ticket);
  } catch (error) {
    return mapDbError(error);
  }
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
