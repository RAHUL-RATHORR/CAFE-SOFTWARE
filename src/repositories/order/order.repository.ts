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
  buildOrderNumber,
  computeOrderTotals,
  createInitialStatusHistory,
  serializeOrder,
} from "@/lib/orders";
import { getCustomerLabel } from "@/config/orders";
import { OrderModel, type OrderDocument } from "@/models/order";
import { RestaurantTableModel } from "@/models/restaurant-table";
import type {
  OrderPriority,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  RestaurantOrder,
  RestaurantOrderListResult,
  RestaurantOrderSortField,
  RestaurantOrderStatus,
} from "@/types/order";
import type { SearchOrderInput } from "@/lib/validators/order";

export type OrderLineCreateData = {
  menuItemId?: string | null;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  tax?: number;
  subtotal?: number;
  notes?: string;
};

export type OrderCreateData = {
  restaurantId: string;
  branchId?: string | null;
  tableId?: string | null;
  customerId?: string | null;
  orderNumber?: string;
  orderType?: OrderType;
  status?: RestaurantOrderStatus;
  items?: OrderLineCreateData[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  serviceCharge?: number;
  grandTotal?: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  priority?: OrderPriority;
  assignedChefId?: string | null;
  notes?: string;
  kitchenNotes?: string;
  createdBy?: string | null;
};

export type OrderUpdateData = Partial<
  Omit<OrderCreateData, "restaurantId" | "createdBy">
> & {
  updatedBy?: string | null;
  statusNote?: string;
};

type OrderFilter = Record<string, unknown>;

function actorObjectId(userId: string | null | undefined) {
  if (!userId || !isValidObjectId(userId)) return null;
  return toObjectId(userId);
}

function optionalRef(id: string | null | undefined) {
  if (!id || !isValidObjectId(id)) return null;
  return toObjectId(id);
}

function asDocument(doc: OrderDocument | null | undefined): OrderDocument | null {
  return doc ?? null;
}

function mapLineItems(items: OrderLineCreateData[] | undefined) {
  const totals = computeOrderTotals({ items: items ?? [] });
  return (items ?? []).map((item, index) => {
    const normalized = totals.items[index];
    return {
      menuItemId: optionalRef(item.menuItemId),
      name: item.name.trim(),
      price: normalized.price,
      quantity: item.quantity,
      discount: normalized.discount,
      tax: normalized.tax,
      subtotal: normalized.subtotal,
      notes: item.notes ?? "",
    };
  });
}

async function resolveTableLabels(
  tableIds: Array<string | null | undefined>
): Promise<Map<string, string>> {
  const unique = [
    ...new Set(
      tableIds.filter((id): id is string => Boolean(id && isValidObjectId(id)))
    ),
  ];
  if (unique.length === 0) return new Map();

  const docs = await RestaurantTableModel.find({
    _id: { $in: unique.map((id) => toObjectId(id)) },
  } as Record<string, unknown>)
    .select({ tableNumber: 1, tableName: 1 })
    .lean()
    .exec();

  const map = new Map<string, string>();
  for (const doc of docs) {
    map.set(
      String(doc._id),
      `${doc.tableNumber}${doc.tableName ? ` · ${doc.tableName}` : ""}`
    );
  }
  return map;
}

async function withLabels(doc: OrderDocument): Promise<RestaurantOrder> {
  const tableId = doc.tableId ? String(doc.tableId) : null;
  const labels = await resolveTableLabels([tableId]);
  return serializeOrder(doc, {
    tableLabel: tableId ? labels.get(tableId) ?? null : null,
    customerLabel: getCustomerLabel(doc.customerId ? String(doc.customerId) : null),
  });
}

function buildSearchFilter(
  restaurantId: string,
  input: SearchOrderInput
): OrderFilter {
  const filter: OrderFilter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  });

  if (input.status !== "all") filter.status = input.status;
  if (input.orderType !== "all") filter.orderType = input.orderType;
  if (input.paymentStatus !== "all") filter.paymentStatus = input.paymentStatus;
  if (input.priority !== "all") filter.priority = input.priority;

  if (input.tableId && isValidObjectId(input.tableId)) {
    filter.tableId = toObjectId(input.tableId);
  }
  if (input.customerId && isValidObjectId(input.customerId)) {
    filter.customerId = toObjectId(input.customerId);
  }
  if (input.assignedChefId && isValidObjectId(input.assignedChefId)) {
    filter.assignedChefId = toObjectId(input.assignedChefId);
  }

  if (input.dateFrom || input.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (input.dateFrom) {
      const from = new Date(input.dateFrom);
      if (!Number.isNaN(from.getTime())) createdAt.$gte = from;
    }
    if (input.dateTo) {
      const to = new Date(input.dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        createdAt.$lte = to;
      }
    }
    if (Object.keys(createdAt).length > 0) filter.createdAt = createdAt;
  }

  if (input.q && input.q.trim()) {
    const q = input.q.trim();
    filter.$or = [
      { orderNumber: { $regex: q, $options: "i" } },
      { notes: { $regex: q, $options: "i" } },
      { kitchenNotes: { $regex: q, $options: "i" } },
      { "items.name": { $regex: q, $options: "i" } },
    ];
  }

  return filter;
}

function buildSort(
  sortBy: RestaurantOrderSortField,
  sortOrder: "asc" | "desc"
): Record<string, SortOrder> {
  const direction: SortOrder = sortOrder === "asc" ? 1 : -1;
  return { [sortBy]: direction, _id: 1 };
}

export const orderRepository = {
  async create(data: OrderCreateData): Promise<RestaurantOrder> {
    await connectToDatabase();
    try {
      const totals = computeOrderTotals({
        items: data.items ?? [],
        discount: data.discount,
        tax: data.tax,
        serviceCharge: data.serviceCharge,
        subtotal: data.subtotal,
        grandTotal: data.grandTotal,
      });

      const status = data.status ?? "pending";
      const orderNumber = data.orderNumber?.trim() || buildOrderNumber();
      const history = createInitialStatusHistory(status, data.createdBy);

      const doc = await OrderModel.create({
        restaurantId: toObjectId(data.restaurantId),
        branchId: optionalRef(data.branchId),
        tableId: optionalRef(data.tableId),
        customerId: optionalRef(data.customerId),
        orderNumber,
        orderType: data.orderType ?? "dine-in",
        status,
        items: mapLineItems(data.items),
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        serviceCharge: totals.serviceCharge,
        grandTotal: totals.grandTotal,
        paymentStatus: data.paymentStatus ?? "pending",
        paymentMethod: data.paymentMethod ?? "none",
        priority: data.priority ?? "normal",
        assignedChefId: optionalRef(data.assignedChefId),
        notes: data.notes ?? "",
        kitchenNotes: data.kitchenNotes ?? "",
        statusHistory: [
          {
            ...history,
            changedBy: actorObjectId(history.changedBy),
          },
        ],
        createdBy: actorObjectId(data.createdBy),
        updatedBy: actorObjectId(data.createdBy),
      });

      return withLabels(doc);
    } catch (error) {
      throw handleDatabaseError(error, "Failed to create order");
    }
  },

  async update(
    id: string,
    restaurantId: string,
    data: OrderUpdateData
  ): Promise<RestaurantOrder | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const existing = await OrderModel.findOne(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as OrderFilter
      ).exec();

      if (!existing) return null;

      const $set: Record<string, unknown> = {
        updatedBy: actorObjectId(data.updatedBy),
      };

      if (data.orderNumber !== undefined) {
        $set.orderNumber = data.orderNumber.trim();
      }
      if (data.orderType !== undefined) $set.orderType = data.orderType;
      if (data.notes !== undefined) $set.notes = data.notes;
      if (data.kitchenNotes !== undefined) {
        $set.kitchenNotes = data.kitchenNotes;
      }
      if (data.paymentStatus !== undefined) {
        $set.paymentStatus = data.paymentStatus;
      }
      if (data.paymentMethod !== undefined) {
        $set.paymentMethod = data.paymentMethod;
      }
      if (data.priority !== undefined) {
        $set.priority = data.priority;
      }
      if (data.assignedChefId !== undefined) {
        $set.assignedChefId = optionalRef(data.assignedChefId);
      }
      if (data.branchId !== undefined) {
        $set.branchId = optionalRef(data.branchId);
      }
      if (data.tableId !== undefined) {
        $set.tableId = optionalRef(data.tableId);
      }
      if (data.customerId !== undefined) {
        $set.customerId = optionalRef(data.customerId);
      }

      const shouldRecalc =
        data.items !== undefined ||
        data.subtotal !== undefined ||
        data.discount !== undefined ||
        data.tax !== undefined ||
        data.serviceCharge !== undefined ||
        data.grandTotal !== undefined;

      if (shouldRecalc) {
        const existingItems = (existing.items ?? []).map((item) => ({
          menuItemId: item.menuItemId ? String(item.menuItemId) : null,
          name: item.name,
          price: (item as { price?: number }).price ?? 0,
          quantity: item.quantity,
          discount: (item as { discount?: number }).discount ?? 0,
          tax: (item as { tax?: number }).tax ?? 0,
          subtotal: (item as { subtotal?: number }).subtotal,
          notes: item.notes ?? "",
        }));

        const nextItems = data.items ?? existingItems;
        const totals = computeOrderTotals({
          items: nextItems,
          discount: data.discount ?? existing.discount,
          tax: data.tax ?? existing.tax,
          serviceCharge: data.serviceCharge ?? existing.serviceCharge,
          subtotal: data.subtotal,
          grandTotal: data.grandTotal,
        });

        if (data.items !== undefined) {
          $set.items = mapLineItems(nextItems);
        }
        $set.subtotal = totals.subtotal;
        $set.discount = totals.discount;
        $set.tax = totals.tax;
        $set.serviceCharge = totals.serviceCharge;
        $set.grandTotal = totals.grandTotal;
      }

      const updateOps: Record<string, unknown> = {
        $set,
        $inc: { version: 1 },
      };

      if (data.status !== undefined && data.status !== existing.status) {
        $set.status = data.status;
        updateOps.$push = {
          statusHistory: {
            status: data.status,
            changedAt: new Date(),
            changedBy: actorObjectId(data.updatedBy),
            note: data.statusNote ?? "Status updated",
          },
        };
      }

      const doc = await OrderModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as OrderFilter,
        updateOps,
        { new: true, runValidators: true }
      ).exec();

      const resolved = asDocument(doc as OrderDocument | null);
      return resolved ? withLabels(resolved) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to update order");
    }
  },

  async changeStatus(
    id: string,
    restaurantId: string,
    status: RestaurantOrderStatus,
    changedBy?: string | null,
    note?: string
  ): Promise<RestaurantOrder | null> {
    return this.update(id, restaurantId, {
      status,
      updatedBy: changedBy,
      statusNote: note || `Status changed to ${status}`,
    });
  },

  async softDelete(
    id: string,
    restaurantId: string,
    deletedBy?: string | null
  ): Promise<RestaurantOrder | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const doc = await OrderModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as OrderFilter,
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

      const resolved = asDocument(doc as OrderDocument | null);
      return resolved ? withLabels(resolved) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to delete order");
    }
  },

  async findById(
    id: string,
    restaurantId: string
  ): Promise<RestaurantOrder | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const doc = await OrderModel.findOne(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as OrderFilter
      ).exec();
      return doc ? withLabels(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load order");
    }
  },

  async findByOrderNumber(
    orderNumber: string,
    restaurantId: string,
    excludeId?: string
  ): Promise<RestaurantOrder | null> {
    await connectToDatabase();
    try {
      const filter: OrderFilter = notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        orderNumber: orderNumber.trim(),
      });
      if (excludeId && isValidObjectId(excludeId)) {
        filter._id = { $ne: toObjectId(excludeId) };
      }
      const doc = await OrderModel.findOne(filter).exec();
      return doc ? withLabels(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to check order number");
    }
  },

  async findMany(
    restaurantId: string,
    input: SearchOrderInput
  ): Promise<RestaurantOrderListResult> {
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
        (pagination.sortBy as RestaurantOrderSortField) || "createdAt",
        pagination.sortOrder ?? "desc"
      );

      const [total, docs] = await Promise.all([
        OrderModel.countDocuments(filter),
        OrderModel.find(filter)
          .sort(sort)
          .skip((pagination.page - 1) * pagination.pageSize)
          .limit(pagination.pageSize)
          .exec(),
      ]);

      const tableLabels = await resolveTableLabels(
        docs.map((doc) => (doc.tableId ? String(doc.tableId) : null))
      );

      return {
        items: docs.map((doc) => {
          const tableId = doc.tableId ? String(doc.tableId) : null;
          return serializeOrder(doc, {
            tableLabel: tableId ? tableLabels.get(tableId) ?? null : null,
            customerLabel: getCustomerLabel(
              doc.customerId ? String(doc.customerId) : null
            ),
          });
        }),
        meta: buildPaginationMeta(
          total,
          pagination.page,
          pagination.pageSize
        ),
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to list orders");
    }
  },
};
