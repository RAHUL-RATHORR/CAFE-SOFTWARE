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
import {
  buildDefaultQrPlaceholder,
  serializeRestaurantTable,
} from "@/lib/restaurant-tables";
import {
  RestaurantTableModel,
  type RestaurantTableDocument,
} from "@/models/restaurant-table";
import type {
  RestaurantTable,
  RestaurantTableListResult,
  RestaurantTableSortField,
  RestaurantTableStatus,
} from "@/types/restaurant-table";
import type { SearchRestaurantTableInput } from "@/lib/validators/restaurant-table";

export type RestaurantTableCreateData = {
  restaurantId: string;
  branchId?: string | null;
  floorId?: string | null;
  tableNumber: string;
  tableName: string;
  capacity: number;
  shape?: RestaurantTable["shape"];
  status?: RestaurantTableStatus;
  location?: string;
  qrCodePlaceholder?: string;
  notes?: string;
  isActive?: boolean;
  displayOrder?: number;
  createdBy?: string | null;
};

export type RestaurantTableUpdateData = Partial<
  Omit<RestaurantTableCreateData, "restaurantId" | "createdBy">
> & {
  updatedBy?: string | null;
};

type TableFilter = Record<string, unknown>;

function actorObjectId(userId: string | null | undefined) {
  if (!userId || !isValidObjectId(userId)) return null;
  return toObjectId(userId);
}

function asDocument(
  doc: RestaurantTableDocument | null | undefined
): RestaurantTableDocument | null {
  return doc ?? null;
}

function buildSearchFilter(
  restaurantId: string,
  input: SearchRestaurantTableInput
): TableFilter {
  const filter: TableFilter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  });

  if (input.status !== "all") {
    filter.status = input.status;
  }

  if (input.floorId && isValidObjectId(input.floorId)) {
    filter.floorId = toObjectId(input.floorId);
  }

  if (input.active === "active") filter.isActive = true;
  if (input.active === "inactive") filter.isActive = false;

  if (input.q && input.q.trim()) {
    const q = input.q.trim();
    filter.$or = [
      { tableNumber: { $regex: q, $options: "i" } },
      { tableName: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { notes: { $regex: q, $options: "i" } },
    ];
  }

  const capacityFilter: Record<string, number> = {};
  if (input.minCapacity != null) capacityFilter.$gte = input.minCapacity;
  if (input.maxCapacity != null) capacityFilter.$lte = input.maxCapacity;
  if (Object.keys(capacityFilter).length > 0) {
    filter.capacity = capacityFilter;
  }

  return filter;
}

function buildSort(
  sortBy: RestaurantTableSortField,
  sortOrder: "asc" | "desc"
): Record<string, SortOrder> {
  const direction: SortOrder = sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: direction, _id: 1 };
}

export const restaurantTableRepository = {
  async create(data: RestaurantTableCreateData): Promise<RestaurantTable> {
    await connectToDatabase();
    try {
      const qr =
        data.qrCodePlaceholder?.trim() ||
        buildDefaultQrPlaceholder(data.restaurantId, data.tableNumber);

      const doc = await RestaurantTableModel.create({
        restaurantId: toObjectId(data.restaurantId),
        branchId:
          data.branchId && isValidObjectId(data.branchId)
            ? toObjectId(data.branchId)
            : null,
        floorId:
          data.floorId && isValidObjectId(data.floorId)
            ? toObjectId(data.floorId)
            : null,
        tableNumber: data.tableNumber.trim(),
        tableName: data.tableName,
        capacity: data.capacity,
        shape: data.shape ?? "square",
        status: data.status ?? "available",
        location: data.location ?? "",
        qrCodePlaceholder: qr,
        notes: data.notes ?? "",
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
        createdBy: actorObjectId(data.createdBy),
        updatedBy: actorObjectId(data.createdBy),
      });

      return serializeRestaurantTable(doc);
    } catch (error) {
      throw handleDatabaseError(error, "Failed to create table");
    }
  },

  async update(
    id: string,
    restaurantId: string,
    data: RestaurantTableUpdateData
  ): Promise<RestaurantTable | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const update: Record<string, unknown> = {
        updatedBy: actorObjectId(data.updatedBy),
      };

      if (data.tableNumber !== undefined)
        update.tableNumber = data.tableNumber.trim();
      if (data.tableName !== undefined) update.tableName = data.tableName;
      if (data.capacity !== undefined) update.capacity = data.capacity;
      if (data.shape !== undefined) update.shape = data.shape;
      if (data.status !== undefined) update.status = data.status;
      if (data.location !== undefined) update.location = data.location;
      if (data.qrCodePlaceholder !== undefined)
        update.qrCodePlaceholder = data.qrCodePlaceholder;
      if (data.notes !== undefined) update.notes = data.notes;
      if (data.isActive !== undefined) update.isActive = data.isActive;
      if (data.displayOrder !== undefined)
        update.displayOrder = data.displayOrder;
      if (data.branchId !== undefined) {
        update.branchId =
          data.branchId && isValidObjectId(data.branchId)
            ? toObjectId(data.branchId)
            : null;
      }
      if (data.floorId !== undefined) {
        update.floorId =
          data.floorId && isValidObjectId(data.floorId)
            ? toObjectId(data.floorId)
            : null;
      }

      const doc = await RestaurantTableModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as TableFilter,
        { $set: update, $inc: { version: 1 } },
        { new: true, runValidators: true }
      ).exec();

      const resolved = asDocument(doc as RestaurantTableDocument | null);
      return resolved ? serializeRestaurantTable(resolved) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to update table");
    }
  },

  async softDelete(
    id: string,
    restaurantId: string,
    deletedBy?: string | null
  ): Promise<RestaurantTable | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const doc = await RestaurantTableModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as TableFilter,
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

      const resolved = asDocument(doc as RestaurantTableDocument | null);
      return resolved ? serializeRestaurantTable(resolved) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to delete table");
    }
  },

  async findById(
    id: string,
    restaurantId: string
  ): Promise<RestaurantTable | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const doc = await RestaurantTableModel.findOne(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as TableFilter
      ).exec();
      return doc ? serializeRestaurantTable(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load table");
    }
  },

  async findByTableNumber(
    tableNumber: string,
    restaurantId: string,
    excludeId?: string
  ): Promise<RestaurantTable | null> {
    await connectToDatabase();
    try {
      const filter: TableFilter = notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        tableNumber: tableNumber.trim(),
      });
      if (excludeId && isValidObjectId(excludeId)) {
        filter._id = { $ne: toObjectId(excludeId) };
      }
      const doc = await RestaurantTableModel.findOne(filter).exec();
      return doc ? serializeRestaurantTable(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to check table number");
    }
  },

  async findMany(
    restaurantId: string,
    input: SearchRestaurantTableInput
  ): Promise<RestaurantTableListResult> {
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
        (pagination.sortBy as RestaurantTableSortField) || "displayOrder",
        pagination.sortOrder ?? "asc"
      );

      const [total, docs] = await Promise.all([
        RestaurantTableModel.countDocuments(filter),
        RestaurantTableModel.find(filter)
          .sort(sort)
          .skip((pagination.page - 1) * pagination.pageSize)
          .limit(pagination.pageSize)
          .exec(),
      ]);

      return {
        items: docs.map(serializeRestaurantTable),
        meta: buildPaginationMeta(
          total,
          pagination.page,
          pagination.pageSize
        ),
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to list tables");
    }
  },
};
