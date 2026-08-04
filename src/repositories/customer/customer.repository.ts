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
  buildCustomerCode,
  buildFullName,
  serializeCustomer,
} from "@/lib/customers";
import { CustomerModel, type CustomerDocument } from "@/models/customer";
import { OrderModel } from "@/models/order";
import { BillModel } from "@/models/billing";
import type {
  Customer,
  CustomerAddress,
  CustomerGender,
  CustomerListResult,
  CustomerPreferredOrderType,
  CustomerProfile,
  CustomerSelectOption,
  CustomerSortField,
  CustomerStatus,
} from "@/types/customer";
import type { SearchCustomerInput } from "@/lib/validators/customer";

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

export type CustomerCreateData = {
  restaurantId: string;
  branchId?: string | null;
  customerCode?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  dateOfBirth?: string | null;
  anniversary?: string | null;
  gender?: CustomerGender | null;
  avatar?: string;
  addresses?: CustomerAddress[];
  tags?: string[];
  notes?: string;
  preferredOrderType?: CustomerPreferredOrderType;
  preferredTable?: string | null;
  status?: CustomerStatus;
  loyaltyPoints?: number;
  createdBy?: string | null;
};

export type CustomerUpdateData = Partial<
  Omit<CustomerCreateData, "restaurantId" | "createdBy">
> & {
  updatedBy?: string | null;
  statusNote?: string;
};

function buildSearchFilter(
  restaurantId: string,
  input: SearchCustomerInput
): Filter {
  const filter: Filter = notDeletedFilter({
    restaurantId: toObjectId(restaurantId),
  });

  if (input.vipOnly) {
    filter.status = "vip";
  } else if (input.status !== "all") {
    filter.status = input.status;
  }

  if (input.tag?.trim()) {
    filter.tags = input.tag.trim().toLowerCase();
  }

  if (input.q?.trim()) {
    const q = input.q.trim();
    filter.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { firstName: { $regex: q, $options: "i" } },
      { lastName: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { customerCode: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } },
    ];
  }

  const ordersFilter: Record<string, number> = {};
  if (input.minOrders != null) ordersFilter.$gte = input.minOrders;
  if (input.maxOrders != null) ordersFilter.$lte = input.maxOrders;
  if (Object.keys(ordersFilter).length) filter.totalOrders = ordersFilter;

  const spentFilter: Record<string, number> = {};
  if (input.minSpent != null) spentFilter.$gte = input.minSpent;
  if (input.maxSpent != null) spentFilter.$lte = input.maxSpent;
  if (Object.keys(spentFilter).length) filter.totalSpent = spentFilter;

  const lastVisit: Record<string, Date> = {};
  const lastFrom = parseDate(input.lastVisitFrom);
  const lastTo = parseDate(input.lastVisitTo);
  if (lastFrom) lastVisit.$gte = lastFrom;
  if (lastTo) {
    lastTo.setHours(23, 59, 59, 999);
    lastVisit.$lte = lastTo;
  }
  if (Object.keys(lastVisit).length) filter.lastVisit = lastVisit;

  const createdAt: Record<string, Date> = {};
  const from = parseDate(input.dateFrom);
  const to = parseDate(input.dateTo);
  if (from) createdAt.$gte = from;
  if (to) {
    to.setHours(23, 59, 59, 999);
    createdAt.$lte = to;
  }
  if (Object.keys(createdAt).length) filter.createdAt = createdAt;

  return filter;
}

export const customerRepository = {
  async create(data: CustomerCreateData): Promise<Customer> {
    await connectToDatabase();
    try {
      const firstName = data.firstName.trim();
      const lastName = (data.lastName ?? "").trim();
      const status = data.status ?? "active";
      const customerCode = data.customerCode?.trim() || buildCustomerCode();

      const doc = await CustomerModel.create({
        restaurantId: toObjectId(data.restaurantId),
        branchId: optionalRef(data.branchId),
        customerCode,
        firstName,
        lastName,
        fullName: buildFullName(firstName, lastName),
        email: (data.email ?? "").trim().toLowerCase(),
        phone: data.phone.trim(),
        dateOfBirth: parseDate(data.dateOfBirth),
        anniversary: parseDate(data.anniversary),
        gender: data.gender ?? null,
        avatar: data.avatar ?? "",
        addresses: data.addresses ?? [],
        tags: (data.tags ?? []).map((tag) => tag.trim().toLowerCase()),
        notes: data.notes ?? "",
        noteEntries: [],
        loyaltyPoints: data.loyaltyPoints ?? 0,
        loyaltyMeta: {
          rewardLevel: null,
          membershipTier: null,
          couponCodes: [],
          referralCode: null,
        },
        preferredOrderType: data.preferredOrderType ?? "any",
        preferredTable: optionalRef(data.preferredTable),
        status,
        statusHistory: [
          {
            status,
            changedAt: new Date(),
            changedBy: actorObjectId(data.createdBy),
            note: "Customer created",
          },
        ],
        createdBy: actorObjectId(data.createdBy),
        updatedBy: actorObjectId(data.createdBy),
      });

      return serializeCustomer(doc);
    } catch (error) {
      throw handleDatabaseError(error, "Failed to create customer");
    }
  },

  async update(
    id: string,
    restaurantId: string,
    data: CustomerUpdateData
  ): Promise<Customer | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const existing = await CustomerModel.findOne(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as Filter
      ).exec();
      if (!existing) return null;

      const $set: Record<string, unknown> = {
        updatedBy: actorObjectId(data.updatedBy),
      };

      if (data.firstName !== undefined || data.lastName !== undefined) {
        const firstName = (data.firstName ?? existing.firstName).trim();
        const lastName = (data.lastName ?? existing.lastName ?? "").trim();
        $set.firstName = firstName;
        $set.lastName = lastName;
        $set.fullName = buildFullName(firstName, lastName);
      }
      if (data.customerCode !== undefined) {
        $set.customerCode = data.customerCode.trim();
      }
      if (data.email !== undefined) {
        $set.email = data.email.trim().toLowerCase();
      }
      if (data.phone !== undefined) $set.phone = data.phone.trim();
      if (data.dateOfBirth !== undefined) {
        $set.dateOfBirth = parseDate(data.dateOfBirth);
      }
      if (data.anniversary !== undefined) {
        $set.anniversary = parseDate(data.anniversary);
      }
      if (data.gender !== undefined) $set.gender = data.gender;
      if (data.avatar !== undefined) $set.avatar = data.avatar;
      if (data.addresses !== undefined) $set.addresses = data.addresses;
      if (data.tags !== undefined) {
        $set.tags = data.tags.map((tag) => tag.trim().toLowerCase());
      }
      if (data.notes !== undefined) $set.notes = data.notes;
      if (data.preferredOrderType !== undefined) {
        $set.preferredOrderType = data.preferredOrderType;
      }
      if (data.preferredTable !== undefined) {
        $set.preferredTable = optionalRef(data.preferredTable);
      }
      if (data.loyaltyPoints !== undefined) {
        $set.loyaltyPoints = data.loyaltyPoints;
      }
      if (data.branchId !== undefined) {
        $set.branchId = optionalRef(data.branchId);
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

      const doc = await CustomerModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as Filter,
        updateOps,
        { new: true, runValidators: true }
      ).exec();

      return doc ? serializeCustomer(doc as CustomerDocument) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to update customer");
    }
  },

  async softDelete(
    id: string,
    restaurantId: string,
    deletedBy?: string | null
  ): Promise<Customer | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    try {
      const doc = await CustomerModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as Filter,
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
      return doc ? serializeCustomer(doc as CustomerDocument) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to delete customer");
    }
  },

  async findById(
    id: string,
    restaurantId: string
  ): Promise<Customer | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    try {
      const doc = await CustomerModel.findOne(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as Filter
      ).exec();
      return doc ? serializeCustomer(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load customer");
    }
  },

  async findByPhone(
    phone: string,
    restaurantId: string,
    excludeId?: string
  ): Promise<Customer | null> {
    await connectToDatabase();
    try {
      const filter: Filter = notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        phone: phone.trim(),
      });
      if (excludeId && isValidObjectId(excludeId)) {
        filter._id = { $ne: toObjectId(excludeId) };
      }
      const doc = await CustomerModel.findOne(filter).exec();
      return doc ? serializeCustomer(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to check customer phone");
    }
  },

  async findMany(
    restaurantId: string,
    input: SearchCustomerInput
  ): Promise<CustomerListResult> {
    await connectToDatabase();
    try {
      const pagination = normalizePagination({
        page: input.page,
        pageSize: input.pageSize,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      });
      const filter = buildSearchFilter(restaurantId, input);
      const sort: Record<string, SortOrder> = {
        [(pagination.sortBy as CustomerSortField) || "createdAt"]:
          pagination.sortOrder === "asc" ? 1 : -1,
        _id: 1,
      };

      const [total, docs] = await Promise.all([
        CustomerModel.countDocuments(filter),
        CustomerModel.find(filter)
          .sort(sort)
          .skip((pagination.page - 1) * pagination.pageSize)
          .limit(pagination.pageSize)
          .exec(),
      ]);

      return {
        items: docs.map(serializeCustomer),
        meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to list customers");
    }
  },

  async listOptions(restaurantId: string): Promise<CustomerSelectOption[]> {
    await connectToDatabase();
    try {
      const docs = await CustomerModel.find(
        notDeletedFilter({
          restaurantId: toObjectId(restaurantId),
          status: { $in: ["active", "vip"] },
        }) as Filter
      )
        .sort({ fullName: 1 })
        .select({ fullName: 1, phone: 1, customerCode: 1 })
        .limit(300)
        .lean()
        .exec();

      return docs.map((doc) => ({
        value: String(doc._id),
        label: doc.fullName,
        meta: doc.phone || doc.customerCode,
      }));
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load customer options");
    }
  },

  async addNote(
    id: string,
    restaurantId: string,
    body: string,
    createdBy?: string | null
  ): Promise<Customer | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    try {
      const doc = await CustomerModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as Filter,
        {
          $push: {
            noteEntries: {
              body: body.trim(),
              createdBy: actorObjectId(createdBy),
              createdAt: new Date(),
            },
          },
          $set: { updatedBy: actorObjectId(createdBy) },
          $inc: { version: 1 },
        },
        { new: true }
      ).exec();
      return doc ? serializeCustomer(doc as CustomerDocument) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to add customer note");
    }
  },

  async getProfile(
    id: string,
    restaurantId: string
  ): Promise<CustomerProfile | null> {
    const customer = await this.findById(id, restaurantId);
    if (!customer) return null;

    await connectToDatabase();
    try {
      const customerObjectId = toObjectId(id);
      const restaurantObjectId = toObjectId(restaurantId);

      const [orders, bills] = await Promise.all([
        OrderModel.find(
          notDeletedFilter({
            restaurantId: restaurantObjectId,
            customerId: customerObjectId,
          }) as Filter
        )
          .sort({ createdAt: -1 })
          .limit(20)
          .select({
            orderNumber: 1,
            orderType: 1,
            status: 1,
            grandTotal: 1,
            createdAt: 1,
          })
          .lean()
          .exec(),
        BillModel.find(
          notDeletedFilter({
            restaurantId: restaurantObjectId,
            customerId: customerObjectId,
          }) as Filter
        )
          .sort({ createdAt: -1 })
          .limit(50)
          .select({
            invoiceNumber: 1,
            grandTotal: 1,
            amountPaid: 1,
            createdAt: 1,
          })
          .lean()
          .exec(),
      ]);

      const orderHistory = orders.map((order) => ({
        id: String(order._id),
        orderNumber: order.orderNumber,
        orderType: String(order.orderType),
        status: String(order.status),
        grandTotal: order.grandTotal ?? 0,
        createdAt:
          order.createdAt instanceof Date
            ? order.createdAt.toISOString()
            : String(order.createdAt ?? ""),
      }));

      const visitHistory = [
        ...orders.map((order) => ({
          id: `order-${String(order._id)}`,
          label: `Order ${order.orderNumber}`,
          occurredAt:
            order.createdAt instanceof Date
              ? order.createdAt.toISOString()
              : String(order.createdAt ?? ""),
          source: "order" as const,
        })),
        ...bills.map((bill) => ({
          id: `bill-${String(bill._id)}`,
          label: `Bill ${bill.invoiceNumber}`,
          occurredAt:
            bill.createdAt instanceof Date
              ? bill.createdAt.toISOString()
              : String(bill.createdAt ?? ""),
          source: "bill" as const,
        })),
      ]
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .slice(0, 30);

      const billingSummary = {
        billsCount: bills.length,
        totalBilled: bills.reduce((sum, bill) => sum + (bill.grandTotal ?? 0), 0),
        totalPaid: bills.reduce((sum, bill) => sum + (bill.amountPaid ?? 0), 0),
        lastInvoiceNumber: bills[0]?.invoiceNumber ?? null,
      };

      return {
        customer,
        orderHistory,
        visitHistory,
        billingSummary,
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load customer profile");
    }
  },
};
