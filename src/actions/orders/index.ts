"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  orderFailure,
  orderSuccess,
  zodFieldErrors,
} from "@/lib/orders";
import { isOrderEditable } from "@/config/orders";
import {
  changeOrderStatusSchema,
  createOrderSchema,
  deleteOrderSchema,
  duplicateOrderSchema,
  searchOrderSchema,
  updateOrderSchema,
} from "@/lib/validators/order";
import { orderRepository } from "@/repositories/order";
import { resolveOrderActor } from "@/actions/orders/context";
import { getOrderFormOptions } from "@/actions/orders/options";
import type {
  OrderActionResult,
  RestaurantOrder,
  RestaurantOrderListResult,
} from "@/types/order";

function mapDbError(error: unknown): OrderActionResult<never> {
  if (isDatabaseError(error)) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      return orderFailure(
        "DUPLICATE_ORDER_NUMBER",
        "An order with this number already exists.",
        { orderNumber: ["This order number is already in use."] }
      );
    }
    return orderFailure("DATABASE_ERROR", error.message);
  }
  return orderFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateOrderPaths(id?: string) {
  revalidatePath("/orders");
  if (id) {
    revalidatePath(`/orders/${id}`);
    revalidatePath(`/orders/${id}/edit`);
  }
}

function toLineItems(
  items: Array<{
    menuItemId?: string | null;
    name: string;
    price: number;
    quantity: number;
    discount?: number;
    tax?: number;
    subtotal?: number;
    notes?: string | null;
  }>
) {
  return items.map((item) => ({
    menuItemId: item.menuItemId ?? null,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    discount: item.discount ?? 0,
    tax: item.tax ?? 0,
    subtotal: item.subtotal,
    notes: item.notes ?? "",
  }));
}

export async function createOrder(
  input: unknown
): Promise<OrderActionResult<RestaurantOrder>> {
  const actor = await resolveOrderActor([
    "orders.create",
    "orders.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return orderFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;

  try {
    if (values.orderNumber?.trim()) {
      const existing = await orderRepository.findByOrderNumber(
        values.orderNumber,
        actor.data.restaurantId
      );
      if (existing) {
        return orderFailure(
          "DUPLICATE_ORDER_NUMBER",
          "This order number is already in use.",
          { orderNumber: ["This order number is already in use."] }
        );
      }
    }

    const order = await orderRepository.create({
      restaurantId: actor.data.restaurantId,
      branchId: values.branchId ?? null,
      tableId: values.tableId ?? null,
      customerId: values.customerId ?? null,
      orderNumber: values.orderNumber || undefined,
      orderType: values.orderType,
      status: values.status,
      items: toLineItems(values.items),
      subtotal: values.subtotal,
      discount: values.discount,
      tax: values.tax,
      serviceCharge: values.serviceCharge,
      grandTotal: values.grandTotal,
      paymentStatus: values.paymentStatus,
      paymentMethod: values.paymentMethod,
      priority: values.priority,
      assignedChefId: values.assignedChefId ?? null,
      notes: values.notes ?? "",
      kitchenNotes: values.kitchenNotes ?? "",
      createdBy: actor.data.userId,
    });

    revalidateOrderPaths(order.id);
    return orderSuccess(order);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateOrder(
  input: unknown
): Promise<OrderActionResult<RestaurantOrder>> {
  const actor = await resolveOrderActor(["orders.edit", "orders.manage"]);
  if (!actor.success) return actor;

  const parsed = updateOrderSchema.safeParse(input);
  if (!parsed.success) {
    return orderFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;

  try {
    const current = await orderRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!current) {
      return orderFailure("NOT_FOUND", "Order not found.");
    }
    if (!isOrderEditable(current.status)) {
      return orderFailure(
        "ORDER_LOCKED",
        "Completed or cancelled orders cannot be edited."
      );
    }

    if (rest.orderNumber?.trim()) {
      const existing = await orderRepository.findByOrderNumber(
        rest.orderNumber,
        actor.data.restaurantId,
        id
      );
      if (existing) {
        return orderFailure(
          "DUPLICATE_ORDER_NUMBER",
          "This order number is already in use.",
          { orderNumber: ["This order number is already in use."] }
        );
      }
    }

    const order = await orderRepository.update(id, actor.data.restaurantId, {
      ...rest,
      items: rest.items ? toLineItems(rest.items) : undefined,
      updatedBy: actor.data.userId,
    });

    if (!order) {
      return orderFailure("NOT_FOUND", "Order not found.");
    }

    revalidateOrderPaths(order.id);
    return orderSuccess(order);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function deleteOrder(
  input: unknown
): Promise<OrderActionResult<{ id: string }>> {
  const actor = await resolveOrderActor([
    "orders.delete",
    "orders.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = deleteOrderSchema.safeParse(input);
  if (!parsed.success) {
    return orderFailure(
      "VALIDATION_ERROR",
      "Invalid order id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const order = await orderRepository.softDelete(
      parsed.data.id,
      actor.data.restaurantId,
      actor.data.userId
    );
    if (!order) {
      return orderFailure("NOT_FOUND", "Order not found.");
    }
    revalidateOrderPaths(order.id);
    return orderSuccess({ id: order.id });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getOrders(
  input: unknown = {}
): Promise<OrderActionResult<RestaurantOrderListResult>> {
  const actor = await resolveOrderActor(["orders.view", "orders.manage"]);
  if (!actor.success) return actor;

  const parsed = searchOrderSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return orderFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await orderRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return orderSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getOrder(
  id: string
): Promise<OrderActionResult<RestaurantOrder>> {
  const actor = await resolveOrderActor(["orders.view", "orders.manage"]);
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return orderFailure("VALIDATION_ERROR", "Order id is required.");
  }

  try {
    const order = await orderRepository.findById(id, actor.data.restaurantId);
    if (!order) {
      return orderFailure("NOT_FOUND", "Order not found.");
    }
    return orderSuccess(order);
  } catch (error) {
    return mapDbError(error);
  }
}

/** @deprecated Prefer getOrder — kept for backward compatibility */
export async function getOrderById(
  id: string
): Promise<OrderActionResult<RestaurantOrder>> {
  return getOrder(id);
}

export async function changeOrderStatus(
  input: unknown
): Promise<OrderActionResult<RestaurantOrder>> {
  const actor = await resolveOrderActor([
    "orders.changeStatus",
    "orders.edit",
    "orders.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = changeOrderStatusSchema.safeParse(input);
  if (!parsed.success) {
    return orderFailure(
      "VALIDATION_ERROR",
      "Invalid status change request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const order = await orderRepository.changeStatus(
      parsed.data.id,
      actor.data.restaurantId,
      parsed.data.status,
      actor.data.userId,
      parsed.data.note
    );

    if (!order) {
      return orderFailure("NOT_FOUND", "Order not found.");
    }

    revalidateOrderPaths(order.id);
    return orderSuccess(order);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function duplicateOrder(
  input: unknown
): Promise<OrderActionResult<RestaurantOrder>> {
  const actor = await resolveOrderActor([
    "orders.create",
    "orders.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = duplicateOrderSchema.safeParse(input);
  if (!parsed.success) {
    return orderFailure(
      "VALIDATION_ERROR",
      "Invalid order id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const source = await orderRepository.findById(
      parsed.data.id,
      actor.data.restaurantId
    );
    if (!source) {
      return orderFailure("NOT_FOUND", "Order not found.");
    }

    const order = await orderRepository.create({
      restaurantId: actor.data.restaurantId,
      branchId: source.branchId,
      tableId: source.tableId,
      customerId: source.customerId,
      orderType: source.orderType,
      status: "pending",
      items: source.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount,
        tax: item.tax,
        subtotal: item.subtotal,
        notes: item.notes,
      })),
      discount: source.discount,
      tax: source.tax,
      serviceCharge: source.serviceCharge,
      paymentStatus: "pending",
      paymentMethod: source.paymentMethod,
      priority: source.priority,
      assignedChefId: source.assignedChefId,
      notes: source.notes,
      kitchenNotes: source.kitchenNotes,
      createdBy: actor.data.userId,
    });

    revalidateOrderPaths(order.id);
    return orderSuccess(order);
  } catch (error) {
    return mapDbError(error);
  }
}

export { getOrderFormOptions };
