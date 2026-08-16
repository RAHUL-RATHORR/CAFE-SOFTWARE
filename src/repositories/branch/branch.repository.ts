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
import { serializeBranch } from "@/lib/branches";
import { BranchModel, type BranchDocument } from "@/models/branch";
import { RestaurantTableModel } from "@/models/restaurant-table";
import type {
  Branch,
  BranchListResult,
  BranchSortField,
  BranchStatus,
} from "@/types/branch";
import type { SearchBranchInput } from "@/lib/validators/branch";

export type BranchCreateData = {
  restaurantId: string;
  name: string;
  branchCode: string;
  email: string;
  phone: string;
  managerId?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timezone: string;
  currency: string;
  status?: BranchStatus;
  openingHours?: Branch["openingHours"];
  coordinates?: Branch["coordinates"];
  gstin?: string;
  openingTime?: string;
  closingTime?: string;
  isMainBranch?: boolean;
  createdBy?: string | null;
};

export type BranchUpdateData = Partial<
  Omit<BranchCreateData, "restaurantId" | "createdBy">
> & {
  updatedBy?: string | null;
};

type BranchFilter = Record<string, unknown>;

function actorObjectId(userId: string | null | undefined) {
  if (!userId || !isValidObjectId(userId)) return null;
  return toObjectId(userId);
}

function asDocument(doc: BranchDocument | null | undefined): BranchDocument | null {
  return doc ?? null;
}

function buildSearchFilter(
  restaurantId: string,
  input: SearchBranchInput
): BranchFilter {
  const filter: BranchFilter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  });

  if (input.status !== "all") {
    filter.status = input.status;
  }

  if (input.active === "active") {
    filter.status = "active";
  }
  if (input.active === "inactive") {
    filter.status = { $ne: "active" };
  }

  if (input.q?.trim()) {
    const q = input.q.trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { branchCode: { $regex: q, $options: "i" } },
      { city: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { address: { $regex: q, $options: "i" } },
    ];
  }

  return filter;
}

function buildSort(
  sortBy: BranchSortField,
  sortOrder: "asc" | "desc"
): Record<string, SortOrder> {
  const direction: SortOrder = sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: direction, _id: 1 };
}

async function tableCountsByBranch(
  restaurantId: string,
  branchIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (branchIds.length === 0) return map;

  const rows = await RestaurantTableModel.aggregate<{
    _id: unknown;
    count: number;
  }>([
    {
      $match: notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        branchId: { $in: branchIds.map((id) => toObjectId(id)) },
      }),
    },
    { $group: { _id: "$branchId", count: { $sum: 1 } } },
  ]).exec();

  for (const row of rows) {
    map.set(String(row._id), row.count);
  }
  return map;
}

export const branchRepository = {
  async create(data: BranchCreateData): Promise<Branch> {
    await connectToDatabase();
    try {
      if (data.isMainBranch) {
        await BranchModel.updateMany(
          notDeletedFilter({
            restaurantId: toObjectId(data.restaurantId),
            isMainBranch: true,
          }) as BranchFilter,
          { $set: { isMainBranch: false } }
        ).exec();
      }

      const existingMain = await BranchModel.countDocuments(
        notDeletedFilter({
          restaurantId: toObjectId(data.restaurantId),
          isMainBranch: true,
        }) as BranchFilter
      );

      const doc = await BranchModel.create({
        restaurantId: toObjectId(data.restaurantId),
        name: data.name.trim(),
        branchCode: data.branchCode.trim().toUpperCase(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        managerId:
          data.managerId && isValidObjectId(data.managerId)
            ? toObjectId(data.managerId)
            : null,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode,
        timezone: data.timezone,
        currency: data.currency.toUpperCase(),
        status: data.status ?? "active",
        openingHours: data.openingHours ?? { timezone: "", days: [], notes: "" },
        coordinates: data.coordinates ?? { latitude: null, longitude: null },
        gstin: (data.gstin ?? "").trim().toUpperCase(),
        openingTime: data.openingTime ?? "",
        closingTime: data.closingTime ?? "",
        isMainBranch: data.isMainBranch ?? existingMain === 0,
        createdBy: actorObjectId(data.createdBy),
        updatedBy: actorObjectId(data.createdBy),
      });

      return serializeBranch(doc, { tableCount: 0 });
    } catch (error) {
      throw handleDatabaseError(error, "Failed to create branch");
    }
  },

  async update(
    id: string,
    restaurantId: string,
    data: BranchUpdateData
  ): Promise<Branch | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      if (data.isMainBranch === true) {
        await BranchModel.updateMany(
          notDeletedFilter({
            restaurantId: toObjectId(restaurantId),
            isMainBranch: true,
            _id: { $ne: toObjectId(id) },
          }) as BranchFilter,
          { $set: { isMainBranch: false } }
        ).exec();
      }

      const update: Record<string, unknown> = {
        updatedBy: actorObjectId(data.updatedBy),
      };

      if (data.name !== undefined) update.name = data.name.trim();
      if (data.branchCode !== undefined)
        update.branchCode = data.branchCode.trim().toUpperCase();
      if (data.email !== undefined) update.email = data.email.trim().toLowerCase();
      if (data.phone !== undefined) update.phone = data.phone.trim();
      if (data.address !== undefined) update.address = data.address;
      if (data.city !== undefined) update.city = data.city;
      if (data.state !== undefined) update.state = data.state;
      if (data.country !== undefined) update.country = data.country;
      if (data.postalCode !== undefined) update.postalCode = data.postalCode;
      if (data.timezone !== undefined) update.timezone = data.timezone;
      if (data.currency !== undefined)
        update.currency = data.currency.toUpperCase();
      if (data.status !== undefined) update.status = data.status;
      if (data.openingHours !== undefined) update.openingHours = data.openingHours;
      if (data.coordinates !== undefined) update.coordinates = data.coordinates;
      if (data.gstin !== undefined)
        update.gstin = data.gstin.trim().toUpperCase();
      if (data.openingTime !== undefined) update.openingTime = data.openingTime;
      if (data.closingTime !== undefined) update.closingTime = data.closingTime;
      if (data.isMainBranch !== undefined) update.isMainBranch = data.isMainBranch;
      if (data.managerId !== undefined) {
        update.managerId =
          data.managerId && isValidObjectId(data.managerId)
            ? toObjectId(data.managerId)
            : null;
      }

      const doc = await BranchModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as BranchFilter,
        { $set: update, $inc: { version: 1 } },
        { new: true, runValidators: true }
      ).exec();

      const resolved = asDocument(doc as BranchDocument | null);
      if (!resolved) return null;

      const counts = await tableCountsByBranch(restaurantId, [id]);
      return serializeBranch(resolved, { tableCount: counts.get(id) ?? 0 });
    } catch (error) {
      throw handleDatabaseError(error, "Failed to update branch");
    }
  },

  async setDefault(
    id: string,
    restaurantId: string,
    updatedBy?: string | null
  ): Promise<Branch | null> {
    return this.update(id, restaurantId, {
      isMainBranch: true,
      updatedBy,
    });
  },

  async findById(id: string, restaurantId: string): Promise<Branch | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const doc = await BranchModel.findOne(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as BranchFilter
      ).exec();
      if (!doc) return null;
      const counts = await tableCountsByBranch(restaurantId, [id]);
      return serializeBranch(doc, { tableCount: counts.get(id) ?? 0 });
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load branch");
    }
  },

  async findByCode(
    branchCode: string,
    restaurantId: string,
    excludeId?: string
  ): Promise<Branch | null> {
    await connectToDatabase();
    try {
      const filter: BranchFilter = notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        branchCode: branchCode.trim().toUpperCase(),
      });
      if (excludeId && isValidObjectId(excludeId)) {
        filter._id = { $ne: toObjectId(excludeId) };
      }
      const doc = await BranchModel.findOne(filter).exec();
      return doc ? serializeBranch(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to check branch code");
    }
  },

  async findMany(
    restaurantId: string,
    input: SearchBranchInput
  ): Promise<BranchListResult> {
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
        (pagination.sortBy as BranchSortField) || "name",
        pagination.sortOrder ?? "asc"
      );

      const [total, docs] = await Promise.all([
        BranchModel.countDocuments(filter),
        BranchModel.find(filter)
          .sort(sort)
          .skip((pagination.page - 1) * pagination.pageSize)
          .limit(pagination.pageSize)
          .exec(),
      ]);

      const ids = docs.map((doc) => String(doc._id));
      const counts = await tableCountsByBranch(restaurantId, ids);

      return {
        items: docs.map((doc) =>
          serializeBranch(doc, {
            tableCount: counts.get(String(doc._id)) ?? 0,
          })
        ),
        meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to list branches");
    }
  },

  async assertOwnedActive(
    id: string,
    restaurantId: string
  ): Promise<Branch | null> {
    const branch = await this.findById(id, restaurantId);
    if (!branch) return null;
    return branch;
  },
};
