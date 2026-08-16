/**
 * Opaque table QR lifecycle — create / regenerate / revoke / public resolve.
 */

import {
  connectToDatabase,
  handleDatabaseError,
  isValidObjectId,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import {
  buildPublicTableQrUrl,
  createOpaqueQrToken,
} from "@/lib/qr-code";
import { serializeQrCode } from "@/lib/qr-ordering";
import { QrCodeModel } from "@/models/qr-ordering";
import { BranchModel } from "@/models/branch";
import { RestaurantTableModel } from "@/models/restaurant-table";
import { resolvePublicRestaurant } from "@/lib/qr-ordering/resolve-restaurant";
import type { QrCodeRecord } from "@/types/qr-ordering";
import type { RestaurantTableQrSummary } from "@/types/restaurant-table";

type Filter = Record<string, unknown>;

export type PublicTableQrValidationState =
  | "valid"
  | "invalid"
  | "revoked"
  | "table_unavailable"
  | "branch_unavailable"
  | "restaurant_unavailable";

export type PublicTableQrResolution = {
  state: PublicTableQrValidationState;
  token: string;
  restaurantSlug?: string;
  tableNumber?: string;
  tableId?: string;
  branchId?: string | null;
  restaurantId?: string;
  publicUrl?: string;
};

function toSummary(record: QrCodeRecord): RestaurantTableQrSummary {
  return {
    id: record.id,
    token: record.token,
    publicUrl: buildPublicTableQrUrl(record.token),
    isActive: record.isActive,
  };
}

async function revokeActiveForTable(tableId: string, restaurantId: string) {
  await QrCodeModel.updateMany(
    notDeletedFilter({
      restaurantId: toObjectId(restaurantId),
      tableId: toObjectId(tableId),
      type: "table",
      isActive: true,
    }) as Filter,
    { $set: { isActive: false } }
  ).exec();
}

export const tableQrService = {
  async getActiveForTable(
    tableId: string,
    restaurantId: string
  ): Promise<RestaurantTableQrSummary | null> {
    await connectToDatabase();
    if (!isValidObjectId(tableId)) return null;
    const doc = await QrCodeModel.findOne(
      notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        tableId: toObjectId(tableId),
        type: "table",
        isActive: true,
      }) as Filter
    ).exec();
    return doc ? toSummary(serializeQrCode(doc)) : null;
  },

  async issueForTable(input: {
    restaurantId: string;
    branchId?: string | null;
    tableId: string;
    tableNumber: string;
    createdBy?: string | null;
  }): Promise<RestaurantTableQrSummary> {
    await connectToDatabase();
    try {
      await revokeActiveForTable(input.tableId, input.restaurantId);
      const token = createOpaqueQrToken();
      const publicUrl = buildPublicTableQrUrl(token);
      const doc = await QrCodeModel.create({
        restaurantId: toObjectId(input.restaurantId),
        branchId:
          input.branchId && isValidObjectId(input.branchId)
            ? toObjectId(input.branchId)
            : null,
        tableId: toObjectId(input.tableId),
        type: "table",
        code: publicUrl,
        token,
        isActive: true,
        expiresAt: null,
        metadata: {
          tableNumber: input.tableNumber,
          issuedAt: new Date().toISOString(),
        },
        createdBy:
          input.createdBy && isValidObjectId(input.createdBy)
            ? toObjectId(input.createdBy)
            : null,
        updatedBy:
          input.createdBy && isValidObjectId(input.createdBy)
            ? toObjectId(input.createdBy)
            : null,
      });
      return toSummary(serializeQrCode(doc));
    } catch (error) {
      throw handleDatabaseError(error, "Failed to issue table QR");
    }
  },

  async regenerateForTable(input: {
    restaurantId: string;
    branchId?: string | null;
    tableId: string;
    tableNumber: string;
    createdBy?: string | null;
  }): Promise<RestaurantTableQrSummary> {
    return this.issueForTable(input);
  },

  async revokeForTable(
    tableId: string,
    restaurantId: string
  ): Promise<{ revoked: number }> {
    await connectToDatabase();
    if (!isValidObjectId(tableId)) return { revoked: 0 };
    try {
      const result = await QrCodeModel.updateMany(
        notDeletedFilter({
          restaurantId: toObjectId(restaurantId),
          tableId: toObjectId(tableId),
          type: "table",
          isActive: true,
        }) as Filter,
        { $set: { isActive: false } }
      ).exec();
      return { revoked: result.modifiedCount ?? 0 };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to revoke table QR");
    }
  },

  async resolvePublicToken(token: string): Promise<PublicTableQrResolution> {
    await connectToDatabase();
    const trimmed = token?.trim();
    if (!trimmed) {
      return { state: "invalid", token: "" };
    }

    try {
      const qr = await QrCodeModel.findOne(
        notDeletedFilter({
          token: trimmed,
          type: "table",
        }) as Filter
      ).exec();

      if (!qr) {
        return { state: "invalid", token: trimmed };
      }

      if (!qr.isActive) {
        return { state: "revoked", token: trimmed };
      }

      if (qr.expiresAt && new Date(qr.expiresAt).getTime() < Date.now()) {
        return { state: "revoked", token: trimmed };
      }

      const restaurantId = String(qr.restaurantId);
      const tableId = qr.tableId ? String(qr.tableId) : null;
      if (!tableId) {
        return { state: "invalid", token: trimmed };
      }

      const table = await RestaurantTableModel.findOne(
        notDeletedFilter({
          _id: toObjectId(tableId),
          restaurantId: toObjectId(restaurantId),
        }) as Filter
      ).exec();

      if (!table || !table.isActive || table.status === "out-of-service") {
        return {
          state: "table_unavailable",
          token: trimmed,
          restaurantId,
          tableId,
        };
      }

      const branchId = table.branchId ? String(table.branchId) : null;
      if (branchId) {
        const branch = await BranchModel.findOne(
          notDeletedFilter({
            _id: toObjectId(branchId),
            restaurantId: toObjectId(restaurantId),
          }) as Filter
        ).exec();
        if (!branch || branch.status !== "active") {
          return {
            state: "branch_unavailable",
            token: trimmed,
            restaurantId,
            tableId,
            branchId,
          };
        }
      }

      const restaurant = await resolvePublicRestaurant(restaurantId);
      if (!restaurant) {
        return {
          state: "restaurant_unavailable",
          token: trimmed,
          restaurantId,
          tableId,
          branchId,
        };
      }

      return {
        state: "valid",
        token: trimmed,
        restaurantId,
        restaurantSlug: restaurant.slug,
        tableId,
        tableNumber: table.tableNumber,
        branchId,
        publicUrl: buildPublicTableQrUrl(trimmed),
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to resolve table QR");
    }
  },
};

/** Pure helpers for unit tests */
export function classifyQrLifecycle(input: {
  qrActive: boolean;
  expired: boolean;
  tableActive: boolean;
  tableOutOfService: boolean;
  branchActive: boolean | null;
  restaurantFound: boolean;
}): PublicTableQrValidationState {
  if (!input.qrActive || input.expired) return "revoked";
  if (!input.tableActive || input.tableOutOfService) return "table_unavailable";
  if (input.branchActive === false) return "branch_unavailable";
  if (!input.restaurantFound) return "restaurant_unavailable";
  return "valid";
}

export function buildBulkTablePreview(input: {
  prefix: string;
  startNumber: number;
  count: number;
  capacity: number;
  namePrefix?: string;
  existingNumbers: Set<string>;
}) {
  const creatable: Array<{
    tableNumber: string;
    tableName: string;
    capacity: number;
    status: "creatable";
  }> = [];
  const conflicting: Array<{
    tableNumber: string;
    tableName: string;
    capacity: number;
    status: "conflict";
    reason: string;
  }> = [];
  const skipped: Array<{
    tableNumber: string;
    tableName: string;
    capacity: number;
    status: "skipped";
    reason: string;
  }> = [];

  const seen = new Set<string>();
  for (let i = 0; i < input.count; i += 1) {
    const n = input.startNumber + i;
    const tableNumber = `${input.prefix}${n}`;
    const tableName = `${input.namePrefix?.trim() || "Table"} ${n}`;
    if (seen.has(tableNumber)) {
      skipped.push({
        tableNumber,
        tableName,
        capacity: input.capacity,
        status: "skipped",
        reason: "Duplicate in request",
      });
      continue;
    }
    seen.add(tableNumber);
    if (input.existingNumbers.has(tableNumber)) {
      conflicting.push({
        tableNumber,
        tableName,
        capacity: input.capacity,
        status: "conflict",
        reason: "Table number already exists in this branch",
      });
      continue;
    }
    creatable.push({
      tableNumber,
      tableName,
      capacity: input.capacity,
      status: "creatable",
    });
  }

  return {
    creatable,
    conflicting,
    skipped,
    requestedCount: input.count,
  };
}
