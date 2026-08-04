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
  buildVendorCode,
  serializeVendor,
} from "@/lib/vendors";
import { VendorModel, type VendorDocument } from "@/models/vendor";
import type {
  Vendor,
  VendorListResult,
  VendorSelectOption,
  VendorSortField,
  VendorStatus,
} from "@/types/vendor";
import type { SearchVendorInput } from "@/lib/validators/vendor";

type Filter = Record<string, unknown>;

function actorObjectId(userId: string | null | undefined) {
  if (!userId || !isValidObjectId(userId)) return null;
  return toObjectId(userId);
}

function optionalRef(id: string | null | undefined) {
  if (!id || !isValidObjectId(id)) return null;
  return toObjectId(id);
}

export type VendorCreateData = {
  restaurantId: string;
  branchId?: string | null;
  vendorCode?: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status?: VendorStatus;
  rating?: number;
  notes?: string;
  createdBy?: string | null;
};

export type VendorUpdateData = Partial<
  Omit<VendorCreateData, "restaurantId" | "createdBy">
> & {
  updatedBy?: string | null;
};

function buildSearchFilter(
  restaurantId: string,
  input: SearchVendorInput
): Filter {
  const filter: Filter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  });

  if (input.status && input.status !== "all") {
    filter.status = input.status;
  }

  if (input.branchId && isValidObjectId(input.branchId)) {
    filter.branchId = toObjectId(input.branchId);
  }

  const q = input.q?.trim();
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [
      { companyName: regex },
      { vendorCode: regex },
      { email: regex },
      { phone: regex },
      { contactPerson: regex },
      { gstNumber: regex },
    ];
  }

  return filter;
}

async function create(data: VendorCreateData): Promise<Vendor> {
  try {
    await connectToDatabase();
    const code = data.vendorCode?.trim() || buildVendorCode();
    const doc = await VendorModel.create({
      restaurantId: toObjectId(data.restaurantId),
      branchId: optionalRef(data.branchId),
      vendorCode: code,
      companyName: data.companyName.trim(),
      contactPerson: data.contactPerson?.trim() ?? "",
      email: data.email?.trim().toLowerCase() ?? "",
      phone: data.phone.trim(),
      gstNumber: data.gstNumber?.trim() ?? "",
      address: data.address?.trim() ?? "",
      city: data.city?.trim() ?? "",
      state: data.state?.trim() ?? "",
      country: data.country?.trim() ?? "",
      postalCode: data.postalCode?.trim() ?? "",
      status: data.status ?? "active",
      rating: data.rating ?? 0,
      notes: data.notes?.trim() ?? "",
      createdBy: actorObjectId(data.createdBy),
      updatedBy: actorObjectId(data.createdBy),
    });
    return serializeVendor(doc.toObject() as VendorDocument);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to create vendor");
  }
}

async function update(
  id: string,
  restaurantId: string,
  data: VendorUpdateData
): Promise<Vendor | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    const $set: Filter = { updatedBy: actorObjectId(data.updatedBy) };
    if (data.branchId !== undefined) $set.branchId = optionalRef(data.branchId);
    if (data.vendorCode !== undefined && data.vendorCode.trim()) {
      $set.vendorCode = data.vendorCode.trim();
    }
    if (data.companyName !== undefined)
      $set.companyName = data.companyName.trim();
    if (data.contactPerson !== undefined)
      $set.contactPerson = data.contactPerson.trim();
    if (data.email !== undefined)
      $set.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) $set.phone = data.phone.trim();
    if (data.gstNumber !== undefined) $set.gstNumber = data.gstNumber.trim();
    if (data.address !== undefined) $set.address = data.address.trim();
    if (data.city !== undefined) $set.city = data.city.trim();
    if (data.state !== undefined) $set.state = data.state.trim();
    if (data.country !== undefined) $set.country = data.country.trim();
    if (data.postalCode !== undefined)
      $set.postalCode = data.postalCode.trim();
    if (data.status !== undefined) $set.status = data.status;
    if (data.rating !== undefined) $set.rating = data.rating;
    if (data.notes !== undefined) $set.notes = data.notes.trim();

    const doc = await VendorModel.findOneAndUpdate(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter,
      { $set },
      { new: true }
    )
      .lean()
      .exec();

    return doc ? serializeVendor(doc as VendorDocument) : null;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update vendor");
  }
}

async function softDelete(
  id: string,
  restaurantId: string,
  deletedBy?: string | null
): Promise<Vendor | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    const doc = await VendorModel.findOneAndUpdate(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: actorObjectId(deletedBy),
          updatedBy: actorObjectId(deletedBy),
        },
      },
      { new: true }
    )
      .lean()
      .exec();

    return doc ? serializeVendor(doc as VendorDocument) : null;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to delete vendor");
  }
}

async function findById(
  id: string,
  restaurantId: string
): Promise<Vendor | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const doc = await VendorModel.findOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter
    )
      .lean()
      .exec();
    return doc ? serializeVendor(doc as VendorDocument) : null;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to load vendor");
  }
}

async function findByPhone(
  phone: string,
  restaurantId: string,
  excludeId?: string
): Promise<Vendor | null> {
  try {
    await connectToDatabase();
    const filter: Filter = notDeletedFilter({
      restaurantId: toObjectId(restaurantId),
      phone: phone.trim(),
    });
    if (excludeId && isValidObjectId(excludeId)) {
      filter._id = { $ne: toObjectId(excludeId) };
    }
    const doc = await VendorModel.findOne(filter).lean().exec();
    return doc ? serializeVendor(doc as VendorDocument) : null;
  } catch (error) {
    throw handleDatabaseError(error, "Failed to find vendor by phone");
  }
}

async function findMany(
  restaurantId: string,
  input: SearchVendorInput
): Promise<VendorListResult> {
  try {
    await connectToDatabase();
    const pagination = normalizePagination({
      page: input.page,
      pageSize: input.pageSize,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    });
    const filter = buildSearchFilter(restaurantId, input);
    const sortField = (pagination.sortBy as VendorSortField) || "createdAt";
    const sortOrder: SortOrder = pagination.sortOrder === "asc" ? 1 : -1;
    const skip = (pagination.page - 1) * pagination.pageSize;

    const [items, total] = await Promise.all([
      VendorModel.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      VendorModel.countDocuments(filter),
    ]);

    return {
      items: items.map((doc) => serializeVendor(doc as VendorDocument)),
      meta: buildPaginationMeta(
        total,
        pagination.page,
        pagination.pageSize
      ),
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to list vendors");
  }
}

async function listOptions(
  restaurantId: string
): Promise<VendorSelectOption[]> {
  try {
    await connectToDatabase();
    const docs = await VendorModel.find(
      notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        status: "active",
      }) as Filter
    )
      .sort({ companyName: 1 })
      .select({ companyName: 1, phone: 1 })
      .limit(300)
      .lean()
      .exec();

    return docs.map((doc) => ({
      value: String(doc._id),
      label: doc.companyName,
      meta: doc.phone,
    }));
  } catch (error) {
    throw handleDatabaseError(error, "Failed to list vendor options");
  }
}

export const vendorRepository = {
  create,
  update,
  softDelete,
  findById,
  findByPhone,
  findMany,
  listOptions,
};
