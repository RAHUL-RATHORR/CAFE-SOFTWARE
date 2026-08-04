"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  restaurantTableFailure,
  restaurantTableSuccess,
  zodFieldErrors,
} from "@/lib/restaurant-tables";
import {
  createRestaurantTableSchema,
  deleteRestaurantTableSchema,
  searchRestaurantTableSchema,
  updateRestaurantTableSchema,
  updateRestaurantTableStatusSchema,
} from "@/lib/validators/restaurant-table";
import { restaurantTableRepository } from "@/repositories/restaurant-table";
import { resolveRestaurantTableActor } from "@/actions/tables/context";
import type {
  RestaurantTable,
  RestaurantTableActionResult,
  RestaurantTableListResult,
} from "@/types/restaurant-table";

function mapDbError(error: unknown): RestaurantTableActionResult<never> {
  if (isDatabaseError(error)) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      return restaurantTableFailure(
        "DUPLICATE_TABLE_NUMBER",
        "A table with this number already exists.",
        { tableNumber: ["This table number is already in use."] }
      );
    }
    return restaurantTableFailure("DATABASE_ERROR", error.message);
  }
  return restaurantTableFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateTablePaths(id?: string) {
  revalidatePath("/tables");
  if (id) {
    revalidatePath(`/tables/${id}`);
    revalidatePath(`/tables/${id}/edit`);
  }
}

export async function createTable(
  input: unknown
): Promise<RestaurantTableActionResult<RestaurantTable>> {
  const actor = await resolveRestaurantTableActor([
    "tables.create",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = createRestaurantTableSchema.safeParse(input);
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;

  try {
    const existing = await restaurantTableRepository.findByTableNumber(
      values.tableNumber,
      actor.data.restaurantId
    );
    if (existing) {
      return restaurantTableFailure(
        "DUPLICATE_TABLE_NUMBER",
        "This table number is already in use.",
        { tableNumber: ["This table number is already in use."] }
      );
    }

    const table = await restaurantTableRepository.create({
      restaurantId: actor.data.restaurantId,
      branchId: values.branchId ?? null,
      floorId: values.floorId ?? null,
      tableNumber: values.tableNumber,
      tableName: values.tableName,
      capacity: values.capacity,
      shape: values.shape,
      status: values.status,
      location: values.location ?? "",
      qrCodePlaceholder: values.qrCodePlaceholder ?? "",
      notes: values.notes ?? "",
      isActive: values.isActive ?? true,
      displayOrder: values.displayOrder ?? 0,
      createdBy: actor.data.userId,
    });

    revalidateTablePaths(table.id);
    return restaurantTableSuccess(table);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateTable(
  input: unknown
): Promise<RestaurantTableActionResult<RestaurantTable>> {
  const actor = await resolveRestaurantTableActor([
    "tables.edit",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateRestaurantTableSchema.safeParse(input);
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;

  try {
    if (rest.tableNumber) {
      const existing = await restaurantTableRepository.findByTableNumber(
        rest.tableNumber,
        actor.data.restaurantId,
        id
      );
      if (existing) {
        return restaurantTableFailure(
          "DUPLICATE_TABLE_NUMBER",
          "This table number is already in use.",
          { tableNumber: ["This table number is already in use."] }
        );
      }
    }

    const table = await restaurantTableRepository.update(
      id,
      actor.data.restaurantId,
      { ...rest, updatedBy: actor.data.userId }
    );

    if (!table) {
      return restaurantTableFailure("NOT_FOUND", "Table not found.");
    }

    revalidateTablePaths(table.id);
    return restaurantTableSuccess(table);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function deleteTable(
  input: unknown
): Promise<RestaurantTableActionResult<{ id: string }>> {
  const actor = await resolveRestaurantTableActor([
    "tables.delete",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = deleteRestaurantTableSchema.safeParse(input);
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Invalid table id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const table = await restaurantTableRepository.softDelete(
      parsed.data.id,
      actor.data.restaurantId,
      actor.data.userId
    );
    if (!table) {
      return restaurantTableFailure("NOT_FOUND", "Table not found.");
    }
    revalidateTablePaths(table.id);
    return restaurantTableSuccess({ id: table.id });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getTables(
  input: unknown = {}
): Promise<RestaurantTableActionResult<RestaurantTableListResult>> {
  const actor = await resolveRestaurantTableActor([
    "tables.view",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = searchRestaurantTableSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await restaurantTableRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return restaurantTableSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getTableById(
  id: string
): Promise<RestaurantTableActionResult<RestaurantTable>> {
  const actor = await resolveRestaurantTableActor([
    "tables.view",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return restaurantTableFailure("VALIDATION_ERROR", "Table id is required.");
  }

  try {
    const table = await restaurantTableRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!table) {
      return restaurantTableFailure("NOT_FOUND", "Table not found.");
    }
    return restaurantTableSuccess(table);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateTableStatus(
  input: unknown
): Promise<RestaurantTableActionResult<RestaurantTable>> {
  const actor = await resolveRestaurantTableActor([
    "tables.edit",
    "tables.manage",
    "tables.assign",
  ]);
  if (!actor.success) return actor;

  const parsed = updateRestaurantTableStatusSchema.safeParse(input);
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Invalid status change request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const table = await restaurantTableRepository.update(
      parsed.data.id,
      actor.data.restaurantId,
      {
        status: parsed.data.status,
        updatedBy: actor.data.userId,
      }
    );

    if (!table) {
      return restaurantTableFailure("NOT_FOUND", "Table not found.");
    }

    revalidateTablePaths(table.id);
    return restaurantTableSuccess(table);
  } catch (error) {
    return mapDbError(error);
  }
}
