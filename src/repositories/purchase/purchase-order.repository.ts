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
  buildPurchaseNumber,
  computePurchaseTotals,
  createInitialPurchaseStatusHistory,
  defaultGoodsReceipt,
  serializePurchaseOrder,
} from "@/lib/purchases";
import {
  PurchaseOrderModel,
  type PurchaseOrderDocument,
} from "@/models/purchase";
import { VendorModel } from "@/models/vendor";
import type {
  PurchaseItem,
  PurchaseOrder,
  PurchaseOrderListResult,
  PurchaseSortField,
  PurchaseStatus,
} from "@/types/purchase";
import type { SearchPurchaseOrderInput } from "@/lib/validators/purchase";

type Filter = Record<string, unknown>;

function actorObjectId(userId: string | null | undefined) {
  if (!userId || !isValidObjectId(userId)) return null;
  return toObjectId(userId);
}

function optionalRef(id: string | null | undefined) {
  if (!id || !isValidObjectId(id)) return null;
  return toObjectId(id);
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapItems(
  items: Array<{
    ingredientId?: string | null;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount?: number;
    tax?: number;
    subtotal?: number;
    quantityReceived?: number;
  }>
) {
  const totals = computePurchaseTotals({
    items: items.map((item) => ({
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      discount: item.discount,
      tax: item.tax,
      subtotal: item.subtotal,
    })),
  });

  return {
    items: items.map((item, index) => ({
      ingredientId: optionalRef(item.ingredientId),
      name: item.name.trim(),
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: totals.items[index]!.unitPrice,
      discount: totals.items[index]!.discount,
      tax: totals.items[index]!.tax,
      subtotal: totals.items[index]!.subtotal,
      quantityReceived: item.quantityReceived ?? 0,
    })),
    pricing: totals,
  };
}

export type PurchaseCreateData = {
  restaurantId: string;
  branchId?: string | null;
  vendorId?: string | null;
  purchaseNumber?: string;
  status?: PurchaseStatus;
  items: Array<{
    ingredientId?: string | null;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount?: number;
    tax?: number;
    subtotal?: number;
    quantityReceived?: number;
  }>;
  discount?: number;
  tax?: number;
  shippingCost?: number;
  expectedDelivery?: string | null;
  receivedDate?: string | null;
  notes?: string;
  createdBy?: string | null;
};

export type PurchaseUpdateData = Partial<
  Omit<PurchaseCreateData, "restaurantId" | "createdBy" | "items">
> & {
  items?: PurchaseCreateData["items"];
  updatedBy?: string | null;
  statusNote?: string;
};

async function resolveVendorName(
  vendorId: string | null | undefined
): Promise<string | null> {
  if (!vendorId || !isValidObjectId(vendorId)) return null;
  const vendor = await VendorModel.findById(vendorId)
    .select({ companyName: 1 })
    .lean()
    .exec();
  return vendor?.companyName ?? null;
}

function buildSearchFilter(
  restaurantId: string,
  input: SearchPurchaseOrderInput
): Filter {
  const filter: Filter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  });

  if (input.status && input.status !== "all") {
    filter.status = input.status;
  }
  if (input.vendorId && isValidObjectId(input.vendorId)) {
    filter.vendorId = toObjectId(input.vendorId);
  }
  if (input.branchId && isValidObjectId(input.branchId)) {
    filter.branchId = toObjectId(input.branchId);
  }
  if (input.minAmount != null || input.maxAmount != null) {
    filter.grandTotal = {};
    if (input.minAmount != null) {
      (filter.grandTotal as Filter).$gte = input.minAmount;
    }
    if (input.maxAmount != null) {
      (filter.grandTotal as Filter).$lte = input.maxAmount;
    }
  }

  const createdAt: Filter = {};
  if (input.dateFrom) {
    const from = parseDate(input.dateFrom);
    if (from) createdAt.$gte = from;
  }
  if (input.dateTo) {
    const to = parseDate(input.dateTo);
    if (to) {
      to.setHours(23, 59, 59, 999);
      createdAt.$lte = to;
    }
  }
  if (Object.keys(createdAt).length) filter.createdAt = createdAt;

  const q = input.q?.trim();
  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ purchaseNumber: regex }, { notes: regex }];
  }

  return filter;
}

async function create(data: PurchaseCreateData): Promise<PurchaseOrder> {
  try {
    await connectToDatabase();
    const status = data.status ?? "draft";
    const mapped = mapItems(data.items);
    const pricing = computePurchaseTotals({
      items: mapped.pricing.items,
      discount: data.discount,
      tax: data.tax,
      shippingCost: data.shippingCost,
    });

    const history = createInitialPurchaseStatusHistory(
      status,
      data.createdBy
    ).map((entry) => ({
      status: entry.status,
      changedAt: new Date(entry.changedAt),
      changedBy: actorObjectId(entry.changedBy),
      note: entry.note,
    }));

    const doc = await PurchaseOrderModel.create({
      restaurantId: toObjectId(data.restaurantId),
      branchId: optionalRef(data.branchId),
      vendorId: optionalRef(data.vendorId),
      purchaseNumber: data.purchaseNumber?.trim() || buildPurchaseNumber(),
      status,
      items: mapped.items,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      tax: pricing.tax,
      shippingCost: pricing.shippingCost,
      grandTotal: pricing.grandTotal,
      expectedDelivery: parseDate(data.expectedDelivery),
      receivedDate: parseDate(data.receivedDate),
      notes: data.notes?.trim() ?? "",
      statusHistory: history,
      goodsReceipt: defaultGoodsReceipt(),
      createdBy: actorObjectId(data.createdBy),
      updatedBy: actorObjectId(data.createdBy),
    });

    const vendorName = await resolveVendorName(data.vendorId);
    return serializePurchaseOrder(
      doc.toObject() as PurchaseOrderDocument,
      vendorName
    );
  } catch (error) {
    throw handleDatabaseError(error, "Failed to create purchase order");
  }
}

async function update(
  id: string,
  restaurantId: string,
  data: PurchaseUpdateData
): Promise<PurchaseOrder | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    const existing = await PurchaseOrderModel.findOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter
    )
      .lean()
      .exec();
    if (!existing) return null;

    const $set: Filter = { updatedBy: actorObjectId(data.updatedBy) };
    const $push: Filter = {};

    if (data.branchId !== undefined) $set.branchId = optionalRef(data.branchId);
    if (data.vendorId !== undefined) $set.vendorId = optionalRef(data.vendorId);
    if (data.purchaseNumber !== undefined && data.purchaseNumber.trim()) {
      $set.purchaseNumber = data.purchaseNumber.trim();
    }
    if (data.expectedDelivery !== undefined) {
      $set.expectedDelivery = parseDate(data.expectedDelivery);
    }
    if (data.receivedDate !== undefined) {
      $set.receivedDate = parseDate(data.receivedDate);
    }
    if (data.notes !== undefined) $set.notes = data.notes.trim();

    if (data.items) {
      const mapped = mapItems(data.items);
      const pricing = computePurchaseTotals({
        items: mapped.pricing.items,
        discount: data.discount ?? existing.discount,
        tax: data.tax ?? existing.tax,
        shippingCost: data.shippingCost ?? existing.shippingCost,
      });
      $set.items = mapped.items;
      $set.subtotal = pricing.subtotal;
      $set.discount = pricing.discount;
      $set.tax = pricing.tax;
      $set.shippingCost = pricing.shippingCost;
      $set.grandTotal = pricing.grandTotal;
    } else if (
      data.discount !== undefined ||
      data.tax !== undefined ||
      data.shippingCost !== undefined
    ) {
      const pricing = computePurchaseTotals({
        items: ((existing.items ?? []) as PurchaseItem[]).map((item) => ({
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          discount: item.discount,
          tax: item.tax,
          subtotal: item.subtotal,
        })),
        discount: data.discount ?? existing.discount,
        tax: data.tax ?? existing.tax,
        shippingCost: data.shippingCost ?? existing.shippingCost,
      });
      $set.subtotal = pricing.subtotal;
      $set.discount = pricing.discount;
      $set.tax = pricing.tax;
      $set.shippingCost = pricing.shippingCost;
      $set.grandTotal = pricing.grandTotal;
    }

    if (data.status !== undefined && data.status !== existing.status) {
      $set.status = data.status;
      if (
        data.status === "received" ||
        data.status === "partially-received"
      ) {
        $set.receivedDate = $set.receivedDate ?? new Date();
        $set["goodsReceipt.inventoryUpdatePending"] = true;
        $set["goodsReceipt.inventoryUpdatePlaceholder"] = true;
      }
      $push.statusHistory = {
        status: data.status,
        changedAt: new Date(),
        changedBy: actorObjectId(data.updatedBy),
        note: data.statusNote?.trim() || `Status changed to ${data.status}`,
      };
    }

    const updateQuery: Filter = { $set };
    if (Object.keys($push).length) updateQuery.$push = $push;

    const doc = await PurchaseOrderModel.findOneAndUpdate(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter,
      updateQuery,
      { new: true }
    )
      .lean()
      .exec();

    if (!doc) return null;
    const vendorName = await resolveVendorName(
      idToString(doc.vendorId) ?? data.vendorId
    );
    return serializePurchaseOrder(doc as PurchaseOrderDocument, vendorName);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to update purchase order");
  }
}

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

async function softDelete(
  id: string,
  restaurantId: string,
  deletedBy?: string | null
): Promise<PurchaseOrder | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const doc = await PurchaseOrderModel.findOneAndUpdate(
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
          status: "cancelled",
        },
        $push: {
          statusHistory: {
            status: "cancelled",
            changedAt: new Date(),
            changedBy: actorObjectId(deletedBy),
            note: "Purchase order deleted",
          },
        },
      },
      { new: true }
    )
      .lean()
      .exec();

    if (!doc) return null;
    const vendorName = await resolveVendorName(idToString(doc.vendorId));
    return serializePurchaseOrder(doc as PurchaseOrderDocument, vendorName);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to delete purchase order");
  }
}

async function findById(
  id: string,
  restaurantId: string
): Promise<PurchaseOrder | null> {
  try {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    const doc = await PurchaseOrderModel.findOne(
      notDeletedFilter({
        _id: toObjectId(id),
        restaurantId: toObjectId(restaurantId),
      }) as Filter
    )
      .lean()
      .exec();
    if (!doc) return null;
    const vendorName = await resolveVendorName(idToString(doc.vendorId));
    return serializePurchaseOrder(doc as PurchaseOrderDocument, vendorName);
  } catch (error) {
    throw handleDatabaseError(error, "Failed to load purchase order");
  }
}

async function findMany(
  restaurantId: string,
  input: SearchPurchaseOrderInput
): Promise<PurchaseOrderListResult> {
  try {
    await connectToDatabase();
    const pagination = normalizePagination({
      page: input.page,
      pageSize: input.pageSize,
      sortBy: input.sortBy,
      sortOrder: input.sortOrder,
    });
    const filter = buildSearchFilter(restaurantId, input);
    const sortField = (pagination.sortBy as PurchaseSortField) || "createdAt";
    const sortOrder: SortOrder = pagination.sortOrder === "asc" ? 1 : -1;
    const skip = (pagination.page - 1) * pagination.pageSize;

    const [items, total] = await Promise.all([
      PurchaseOrderModel.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(pagination.pageSize)
        .lean()
        .exec(),
      PurchaseOrderModel.countDocuments(filter),
    ]);

    const vendorIds = [
      ...new Set(
        items
          .map((item) => idToString(item.vendorId))
          .filter((value): value is string => Boolean(value))
      ),
    ];
    const vendorMap = new Map<string, string>();
    if (vendorIds.length > 0) {
      const vendors = await VendorModel.find(
        notDeletedFilter({
          _id: { $in: vendorIds.map((id) => toObjectId(id)) },
        }) as Filter
      )
        .select({ companyName: 1 })
        .lean()
        .exec();
      for (const vendor of vendors) {
        vendorMap.set(String(vendor._id), vendor.companyName);
      }
    }

    return {
      items: items.map((doc) =>
        serializePurchaseOrder(
          doc as PurchaseOrderDocument,
          vendorMap.get(idToString(doc.vendorId) ?? "") ?? null
        )
      ),
      meta: buildPaginationMeta(
        total,
        pagination.page,
        pagination.pageSize
      ),
    };
  } catch (error) {
    throw handleDatabaseError(error, "Failed to list purchase orders");
  }
}

export const purchaseOrderRepository = {
  create,
  update,
  softDelete,
  findById,
  findMany,
};
