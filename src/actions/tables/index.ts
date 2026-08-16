"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  restaurantTableFailure,
  restaurantTableSuccess,
  zodFieldErrors,
} from "@/lib/restaurant-tables";
import {
  confirmBulkTablesSchema,
  createRestaurantTableSchema,
  deleteRestaurantTableSchema,
  previewBulkTablesSchema,
  searchRestaurantTableSchema,
  setRestaurantTableActiveSchema,
  tableQrActionSchema,
  updateRestaurantTableSchema,
  updateRestaurantTableStatusSchema,
} from "@/lib/validators/restaurant-table";
import { restaurantTableRepository } from "@/repositories/restaurant-table";
import { branchRepository } from "@/repositories/branch";
import { resolveRestaurantTableActor } from "@/actions/tables/context";
import {
  enforcePlanFeature,
  enforcePlanResourceLimit,
} from "@/lib/subscription/guards";
import {
  buildBulkTablePreview,
  tableQrService,
} from "@/lib/table-qr";
import { recordAuditChange } from "@/lib/audit";
import type {
  BulkTableCreateResult,
  BulkTablePreviewResult,
  RestaurantTable,
  RestaurantTableActionResult,
  RestaurantTableListResult,
  RestaurantTableQrSummary,
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

function revalidateTablePaths(id?: string, branchId?: string | null) {
  revalidatePath("/tables");
  if (id) {
    revalidatePath(`/tables/${id}`);
    revalidatePath(`/tables/${id}/edit`);
  }
  if (branchId) {
    revalidatePath(`/branches/${branchId}`);
    revalidatePath(`/branches/${branchId}/tables`);
  }
  revalidatePath("/branches");
}

async function assertBranchWritable(
  restaurantId: string,
  branchId: string | null | undefined
): Promise<RestaurantTableActionResult<true>> {
  if (!branchId) return restaurantTableSuccess(true);
  const branch = await branchRepository.findById(branchId, restaurantId);
  if (!branch) {
    return restaurantTableFailure("NOT_FOUND", "Branch not found.");
  }
  if (branch.status !== "active") {
    return restaurantTableFailure(
      "BRANCH_INACTIVE",
      "This branch is inactive. Activate it before managing tables or QR codes."
    );
  }
  return restaurantTableSuccess(true);
}

export async function createTable(
  input: unknown
): Promise<RestaurantTableActionResult<RestaurantTable>> {
  const actor = await resolveRestaurantTableActor([
    "tables.create",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  const limitGate = await enforcePlanResourceLimit({
    restaurantId: actor.data.restaurantId,
    key: "tables",
  });
  if (!limitGate.success) {
    return restaurantTableFailure("PLAN_LIMIT_REACHED", limitGate.error.message);
  }

  const parsed = createRestaurantTableSchema.safeParse(input);
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;
  const branchGate = await assertBranchWritable(
    actor.data.restaurantId,
    values.branchId
  );
  if (!branchGate.success) return branchGate;

  try {
    const existing = await restaurantTableRepository.findByTableNumber(
      values.tableNumber,
      actor.data.restaurantId,
      undefined,
      values.branchId ?? null
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

    await recordAuditChange({
      action: "table.create",
      entity: "RestaurantTable",
      entityId: table.id,
      message: `Created table ${table.tableNumber}`,
      userId: actor.data.userId,
      restaurantId: actor.data.restaurantId,
      category: "restaurant",
    });

    revalidateTablePaths(table.id, table.branchId);
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
    const current = await restaurantTableRepository.findById(
      id,
      actor.data.restaurantId
    );
    if (!current) {
      return restaurantTableFailure("NOT_FOUND", "Table not found.");
    }

    const branchId =
      rest.branchId !== undefined ? rest.branchId : current.branchId;
    const branchGate = await assertBranchWritable(
      actor.data.restaurantId,
      branchId
    );
    if (!branchGate.success) return branchGate;

    if (rest.tableNumber) {
      const existing = await restaurantTableRepository.findByTableNumber(
        rest.tableNumber,
        actor.data.restaurantId,
        id,
        branchId ?? null
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

    await recordAuditChange({
      action: "table.update",
      entity: "RestaurantTable",
      entityId: table.id,
      message: `Updated table ${table.tableNumber}`,
      userId: actor.data.userId,
      restaurantId: actor.data.restaurantId,
      category: "restaurant",
    });

    revalidateTablePaths(table.id, table.branchId);
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
    await tableQrService.revokeForTable(table.id, actor.data.restaurantId);
    revalidateTablePaths(table.id, table.branchId);
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

    revalidateTablePaths(table.id, table.branchId);
    return restaurantTableSuccess(table);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function setTableActive(
  input: unknown
): Promise<RestaurantTableActionResult<RestaurantTable>> {
  const actor = await resolveRestaurantTableActor([
    "tables.edit",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = setRestaurantTableActiveSchema.safeParse(input);
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Invalid activation request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const table = await restaurantTableRepository.update(
      parsed.data.id,
      actor.data.restaurantId,
      {
        isActive: parsed.data.isActive,
        updatedBy: actor.data.userId,
      }
    );
    if (!table) {
      return restaurantTableFailure("NOT_FOUND", "Table not found.");
    }

    if (!parsed.data.isActive) {
      await tableQrService.revokeForTable(table.id, actor.data.restaurantId);
    }

    await recordAuditChange({
      action: parsed.data.isActive ? "table.activate" : "table.deactivate",
      entity: "RestaurantTable",
      entityId: table.id,
      message: `${parsed.data.isActive ? "Activated" : "Deactivated"} table ${table.tableNumber}`,
      userId: actor.data.userId,
      restaurantId: actor.data.restaurantId,
      category: "restaurant",
    });

    revalidateTablePaths(table.id, table.branchId);
    return restaurantTableSuccess(table);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function previewBulkTables(
  input: unknown
): Promise<RestaurantTableActionResult<BulkTablePreviewResult>> {
  const actor = await resolveRestaurantTableActor([
    "tables.create",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = previewBulkTablesSchema.safeParse(input);
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;
  const branchGate = await assertBranchWritable(
    actor.data.restaurantId,
    values.branchId
  );
  if (!branchGate.success) return branchGate;

  try {
    const candidateNumbers: string[] = [];
    for (let i = 0; i < values.count; i += 1) {
      candidateNumbers.push(`${values.prefix}${values.startNumber + i}`);
    }
    const existing = await restaurantTableRepository.findExistingNumbers(
      actor.data.restaurantId,
      values.branchId,
      candidateNumbers
    );
    const preview = buildBulkTablePreview({
      prefix: values.prefix,
      startNumber: values.startNumber,
      count: values.count,
      capacity: values.capacity,
      namePrefix: values.namePrefix,
      existingNumbers: existing,
    });

    return restaurantTableSuccess({
      branchId: values.branchId,
      ...preview,
    });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function confirmBulkTables(
  input: unknown
): Promise<RestaurantTableActionResult<BulkTableCreateResult>> {
  const actor = await resolveRestaurantTableActor([
    "tables.create",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = confirmBulkTablesSchema.safeParse(input);
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;
  const branchGate = await assertBranchWritable(
    actor.data.restaurantId,
    values.branchId
  );
  if (!branchGate.success) return branchGate;

  try {
    const candidateNumbers: string[] = [];
    for (let i = 0; i < values.count; i += 1) {
      candidateNumbers.push(`${values.prefix}${values.startNumber + i}`);
    }
    const existing = await restaurantTableRepository.findExistingNumbers(
      actor.data.restaurantId,
      values.branchId,
      candidateNumbers
    );
    const preview = buildBulkTablePreview({
      prefix: values.prefix,
      startNumber: values.startNumber,
      count: values.count,
      capacity: values.capacity,
      namePrefix: values.namePrefix,
      existingNumbers: existing,
    });

    const confirmed = new Set(values.confirmedNumbers.map((n) => n.trim()));
    const toCreate = preview.creatable.filter((row) =>
      confirmed.has(row.tableNumber)
    );

    if (toCreate.length === 0) {
      return restaurantTableFailure(
        "VALIDATION_ERROR",
        "No non-conflicting tables were confirmed for creation."
      );
    }

    const limitGate = await enforcePlanResourceLimit({
      restaurantId: actor.data.restaurantId,
      key: "tables",
      incrementBy: toCreate.length,
    });
    if (!limitGate.success) {
      return restaurantTableFailure(
        "PLAN_LIMIT_REACHED",
        limitGate.error.message
      );
    }

    const created = await restaurantTableRepository.createMany(
      toCreate.map((row, index) => ({
        restaurantId: actor.data.restaurantId,
        branchId: values.branchId,
        tableNumber: row.tableNumber,
        tableName: row.tableName,
        capacity: row.capacity,
        displayOrder: index,
        createdBy: actor.data.userId,
      }))
    );

    await recordAuditChange({
      action: "table.bulk_create",
      entity: "RestaurantTable",
      message: `Bulk created ${created.length} tables for branch ${values.branchId}`,
      userId: actor.data.userId,
      restaurantId: actor.data.restaurantId,
      category: "restaurant",
      newValuePlaceholder: { count: created.length, branchId: values.branchId },
    });

    revalidateTablePaths(undefined, values.branchId);
    return restaurantTableSuccess({
      created,
      skipped: preview.skipped,
      conflicting: preview.conflicting,
    });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function generateTableQr(
  input: unknown
): Promise<RestaurantTableActionResult<RestaurantTableQrSummary>> {
  const actor = await resolveRestaurantTableActor([
    "tables.edit",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  const featureGate = await enforcePlanFeature({
    restaurantId: actor.data.restaurantId,
    feature: "qr-ordering",
  });
  if (!featureGate.success) {
    return restaurantTableFailure(
      "QR_FEATURE_UNAVAILABLE",
      featureGate.error.message
    );
  }

  const parsed = tableQrActionSchema.safeParse(input);
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Invalid table id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const table = await restaurantTableRepository.findById(
      parsed.data.tableId,
      actor.data.restaurantId
    );
    if (!table) {
      return restaurantTableFailure("NOT_FOUND", "Table not found.");
    }
    if (!table.isActive) {
      return restaurantTableFailure(
        "VALIDATION_ERROR",
        "Activate the table before issuing a QR code."
      );
    }

    const branchGate = await assertBranchWritable(
      actor.data.restaurantId,
      table.branchId
    );
    if (!branchGate.success) return branchGate;

    const qr = await tableQrService.issueForTable({
      restaurantId: actor.data.restaurantId,
      branchId: table.branchId,
      tableId: table.id,
      tableNumber: table.tableNumber,
      createdBy: actor.data.userId,
    });

    await restaurantTableRepository.update(table.id, actor.data.restaurantId, {
      qrCodePlaceholder: qr.publicUrl,
      updatedBy: actor.data.userId,
    });

    await recordAuditChange({
      action: "table.qr_generate",
      entity: "QRCode",
      entityId: qr.id,
      message: `Issued QR for table ${table.tableNumber}`,
      userId: actor.data.userId,
      restaurantId: actor.data.restaurantId,
      category: "restaurant",
    });

    revalidateTablePaths(table.id, table.branchId);
    return restaurantTableSuccess(qr);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function regenerateTableQr(
  input: unknown
): Promise<RestaurantTableActionResult<RestaurantTableQrSummary>> {
  return generateTableQr(input);
}

export async function revokeTableQr(
  input: unknown
): Promise<RestaurantTableActionResult<{ revoked: number }>> {
  const actor = await resolveRestaurantTableActor([
    "tables.edit",
    "tables.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = tableQrActionSchema.safeParse(input);
  if (!parsed.success) {
    return restaurantTableFailure(
      "VALIDATION_ERROR",
      "Invalid table id.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const table = await restaurantTableRepository.findById(
      parsed.data.tableId,
      actor.data.restaurantId
    );
    if (!table) {
      return restaurantTableFailure("NOT_FOUND", "Table not found.");
    }

    const result = await tableQrService.revokeForTable(
      table.id,
      actor.data.restaurantId
    );

    await recordAuditChange({
      action: "table.qr_revoke",
      entity: "QRCode",
      entityId: table.id,
      message: `Revoked QR for table ${table.tableNumber}`,
      userId: actor.data.userId,
      restaurantId: actor.data.restaurantId,
      category: "restaurant",
    });

    revalidateTablePaths(table.id, table.branchId);
    return restaurantTableSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}
