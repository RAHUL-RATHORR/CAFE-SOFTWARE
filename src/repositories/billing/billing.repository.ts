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
  buildInvoiceNumber,
  calculateGstTaxBreakdown,
  computeBillTotals,
  computeDiscountAmount,
  derivePaymentStatus,
  normalizeBillLines,
  serializeBill,
  serializePayment,
} from "@/lib/billing";
import { generateNextInvoiceNumber } from "@/lib/billing/invoice-number";
import { getCustomerLabel } from "@/config/orders";
import { BillModel, PaymentModel, type BillDocument } from "@/models/billing";
import { OrderModel } from "@/models/order";
import { CustomerModel } from "@/models/customer";
import { NotificationService } from "@/lib/notification/notification.service";
import { BranchModel } from "@/models/branch";
import { RestaurantTableModel } from "@/models/restaurant-table";
import { MenuItemModel } from "@/models/menu-item";
import { TaxSettingsModel } from "@/models/settings";
import { RestaurantModel } from "@/models/restaurant";
import { UserModel } from "@/models/user";
import { emitKitchenEvent } from "@/lib/kitchen/realtime";
import { serializeOrder } from "@/lib/orders/serializers";
import { InventoryConsumptionService } from "@/lib/inventory/inventory-consumption-service";
import type {
  Bill,
  BillListResult,
  BillPaymentMethod,
  BillPaymentStatus,
  BillSortField,
  BillingSummary,
  DiscountType,
  GstBreakdown,
  Invoice,
  InvoicePrintData,
  Payment,
  PosCartLineCustomization,
  PosCheckoutInput,
  PosCheckoutResult,
  PosPaymentTender,
  Receipt,
  TaxType,
} from "@/types/billing";
import type { SearchBillInput } from "@/lib/validators/billing";

type Filter = Record<string, unknown>;

function actorObjectId(userId: string | null | undefined) {
  if (!userId || !isValidObjectId(userId)) return null;
  return toObjectId(userId);
}

function optionalRef(id: string | null | undefined) {
  if (!id || !isValidObjectId(id)) return null;
  return toObjectId(id);
}

export type BillCreateData = {
  restaurantId: string;
  branchId?: string | null;
  orderId?: string | null;
  customerId?: string | null;
  invoiceNumber?: string;
  items: Array<{
    menuItemId?: string | null;
    name: string;
    price: number;
    quantity: number;
    discount?: number;
    tax?: number;
    subtotal?: number;
    notes?: string;
    modifiers?: string[];
  }>;
  discountType?: DiscountType;
  discountValue?: number;
  couponCode?: string;
  taxType?: TaxType;
  taxLabel?: string;
  taxRate?: number;
  serviceCharge?: number;
  paymentStatus?: BillPaymentStatus;
  paymentMethod?: BillPaymentMethod;
  notes?: string;
  splitConfig?: Bill["splitConfig"];
  cashierId?: string | null;
  createdBy?: string | null;
};

export type BillUpdateData = Partial<
  Omit<BillCreateData, "restaurantId" | "createdBy">
> & {
  updatedBy?: string | null;
  amountPaid?: number;
};

async function resolveOrderNumber(
  orderId: string | null | undefined
): Promise<string | null> {
  if (!orderId || !isValidObjectId(orderId)) return null;
  const order = await OrderModel.findById(orderId)
    .select({ orderNumber: 1 })
    .lean()
    .exec();
  return order?.orderNumber ?? null;
}

async function withLabels(doc: BillDocument): Promise<Bill> {
  const orderNumber = await resolveOrderNumber(
    doc.orderId ? String(doc.orderId) : null
  );
  return serializeBill(doc, {
    orderNumber,
    customerLabel: getCustomerLabel(
      doc.customerId ? String(doc.customerId) : null
    ),
  });
}

function mapItems(items: BillCreateData["items"]) {
  const lines = normalizeBillLines(items);
  return lines.map((item) => ({
    menuItemId: optionalRef(item.menuItemId),
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    discount: item.discount,
    tax: item.tax,
    subtotal: item.subtotal,
    notes: item.notes,
    modifiers: item.modifiers,
  }));
}

export const billRepository = {
  async create(data: BillCreateData): Promise<Bill> {
    await connectToDatabase();
    try {
      const totals = computeBillTotals({
        items: data.items,
        discountType: data.discountType,
        discountValue: data.discountValue,
        taxType: data.taxType,
        taxLabel: data.taxLabel,
        taxRate: data.taxRate,
        serviceCharge: data.serviceCharge,
      });

      const doc = await BillModel.create({
        restaurantId: toObjectId(data.restaurantId),
        branchId: optionalRef(data.branchId),
        orderId: optionalRef(data.orderId),
        customerId: optionalRef(data.customerId),
        invoiceNumber: data.invoiceNumber?.trim() || buildInvoiceNumber(),
        items: mapItems(data.items),
        subtotal: totals.subtotal,
        discount: totals.discount,
        discountConfig: {
          kind: totals.discountConfig.type,
          value: totals.discountConfig.value,
          amount: totals.discountConfig.amount,
          couponCode: data.couponCode ?? "",
        },
        tax: totals.tax,
        taxConfig: {
          kind: totals.taxConfig.type,
          label: totals.taxConfig.label,
          rate: totals.taxConfig.rate,
          amount: totals.taxConfig.amount,
        },
        serviceCharge: totals.serviceCharge,
        grandTotal: totals.grandTotal,
        amountPaid: 0,
        paymentStatus: data.paymentStatus ?? "pending",
        paymentMethod: data.paymentMethod ?? "cash",
        notes: data.notes ?? "",
        cashierId: optionalRef(data.cashierId ?? data.createdBy),
        splitConfig: data.splitConfig ?? {
          enabled: false,
          mode: null,
          parties: [],
        },
        createdBy: actorObjectId(data.createdBy),
        updatedBy: actorObjectId(data.createdBy),
      });

      return withLabels(doc);
    } catch (error) {
      throw handleDatabaseError(error, "Failed to create bill");
    }
  },

  async update(
    id: string,
    restaurantId: string,
    data: BillUpdateData
  ): Promise<Bill | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;

    try {
      const existing = await BillModel.findOne(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as Filter
      ).exec();
      if (!existing) return null;

      const $set: Record<string, unknown> = {
        updatedBy: actorObjectId(data.updatedBy),
      };

      if (data.notes !== undefined) $set.notes = data.notes;
      if (data.paymentMethod !== undefined) {
        $set.paymentMethod = data.paymentMethod;
      }
      if (data.branchId !== undefined) $set.branchId = optionalRef(data.branchId);
      if (data.orderId !== undefined) $set.orderId = optionalRef(data.orderId);
      if (data.customerId !== undefined) {
        $set.customerId = optionalRef(data.customerId);
      }
      if (data.splitConfig !== undefined) $set.splitConfig = data.splitConfig;
      if (data.invoiceNumber !== undefined) {
        $set.invoiceNumber = data.invoiceNumber.trim();
      }

      if (data.items || data.discountType || data.discountValue != null || data.taxRate != null || data.serviceCharge != null || data.taxType) {
        const items =
          data.items ??
          (existing.items ?? []).map((item) => ({
            menuItemId: item.menuItemId ? String(item.menuItemId) : null,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            discount: item.discount ?? 0,
            tax: item.tax ?? 0,
            subtotal: item.subtotal,
            notes: item.notes ?? "",
            modifiers: (item as { modifiers?: string[] }).modifiers ?? [],
          }));

        const existingDiscount = existing.discountConfig as {
          kind?: DiscountType;
          type?: DiscountType;
          value?: number;
          couponCode?: string;
        } | null;
        const existingTax = existing.taxConfig as {
          kind?: TaxType;
          type?: TaxType;
          label?: string;
          rate?: number;
        } | null;

        const totals = computeBillTotals({
          items,
          discountType:
            data.discountType ?? existingDiscount?.kind ?? existingDiscount?.type,
          discountValue: data.discountValue ?? existingDiscount?.value,
          taxType: data.taxType ?? existingTax?.kind ?? existingTax?.type,
          taxLabel: data.taxLabel ?? existingTax?.label,
          taxRate: data.taxRate ?? existingTax?.rate,
          serviceCharge: data.serviceCharge ?? existing.serviceCharge,
        });

        if (data.items) $set.items = mapItems(items);
        $set.subtotal = totals.subtotal;
        $set.discount = totals.discount;
        $set.discountConfig = {
          kind: totals.discountConfig.type,
          value: totals.discountConfig.value,
          amount: totals.discountConfig.amount,
          couponCode: data.couponCode ?? existingDiscount?.couponCode ?? "",
        };
        $set.tax = totals.tax;
        $set.taxConfig = {
          kind: totals.taxConfig.type,
          label: totals.taxConfig.label,
          rate: totals.taxConfig.rate,
          amount: totals.taxConfig.amount,
        };
        $set.serviceCharge = totals.serviceCharge;
        $set.grandTotal = totals.grandTotal;

        const amountPaid =
          data.amountPaid != null ? data.amountPaid : existing.amountPaid ?? 0;
        $set.amountPaid = amountPaid;
        $set.paymentStatus =
          data.paymentStatus ??
          derivePaymentStatus(totals.grandTotal, amountPaid);
      } else {
        if (data.amountPaid != null) {
          $set.amountPaid = data.amountPaid;
          $set.paymentStatus =
            data.paymentStatus ??
            derivePaymentStatus(existing.grandTotal ?? 0, data.amountPaid);
        } else if (data.paymentStatus !== undefined) {
          $set.paymentStatus = data.paymentStatus;
        }
      }

      const doc = await BillModel.findOneAndUpdate(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as Filter,
        { $set, $inc: { version: 1 } },
        { new: true, runValidators: true }
      ).exec();

      return doc ? withLabels(doc as BillDocument) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to update bill");
    }
  },

  async findById(id: string, restaurantId: string): Promise<Bill | null> {
    await connectToDatabase();
    if (!isValidObjectId(id)) return null;
    try {
      const doc = await BillModel.findOne(
        notDeletedFilter({
          _id: toObjectId(id),
          restaurantId: toObjectId(restaurantId),
        }) as Filter
      ).exec();
      return doc ? withLabels(doc) : null;
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load bill");
    }
  },

  async findMany(
    restaurantId: string,
    input: SearchBillInput
  ): Promise<BillListResult> {
    await connectToDatabase();
    try {
      const pagination = normalizePagination({
        page: input.page,
        pageSize: input.pageSize,
        sortBy: input.sortBy,
        sortOrder: input.sortOrder,
      });
      const filter: Filter = notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
      });
      if (input.paymentStatus !== "all") {
        filter.paymentStatus = input.paymentStatus;
      }
      if (input.paymentMethod !== "all") {
        filter.paymentMethod = input.paymentMethod;
      }
      if (input.q?.trim()) {
        const q = input.q.trim();
        filter.$or = [
          { invoiceNumber: { $regex: q, $options: "i" } },
          { notes: { $regex: q, $options: "i" } },
          { "items.name": { $regex: q, $options: "i" } },
        ];
      }

      const sort: Record<string, SortOrder> = {
        [(pagination.sortBy as BillSortField) || "createdAt"]:
          pagination.sortOrder === "asc" ? 1 : -1,
        _id: 1,
      };

      const [total, docs] = await Promise.all([
        BillModel.countDocuments(filter),
        BillModel.find(filter)
          .sort(sort)
          .skip((pagination.page - 1) * pagination.pageSize)
          .limit(pagination.pageSize)
          .exec(),
      ]);

      const items = await Promise.all(docs.map((doc) => withLabels(doc)));
      return {
        items,
        meta: buildPaginationMeta(total, pagination.page, pagination.pageSize),
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to list bills");
    }
  },

  async getSummary(restaurantId: string): Promise<BillingSummary> {
    await connectToDatabase();
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const filter = notDeletedFilter({
        restaurantId: toObjectId(restaurantId),
        createdAt: { $gte: start },
      }) as Filter;

      const bills = await BillModel.find(filter).lean().exec();
      const payments = await PaymentModel.find(
        notDeletedFilter({
          restaurantId: toObjectId(restaurantId),
          createdAt: { $gte: start },
        }) as Filter
      )
        .lean()
        .exec();

      const paymentSummaryMap = new Map<
        BillPaymentMethod,
        { count: number; amount: number }
      >();
      for (const payment of payments) {
        if (payment.status === "refunded") continue;
        const method = (payment.method ?? "cash") as BillPaymentMethod;
        const current = paymentSummaryMap.get(method) ?? {
          count: 0,
          amount: 0,
        };
        current.count += 1;
        current.amount += payment.amount ?? 0;
        paymentSummaryMap.set(method, current);
      }

      const cashierMap = new Map<
        string,
        { billsCount: number; collected: number }
      >();
      for (const bill of bills) {
        const cashierId = bill.cashierId ? String(bill.cashierId) : "unknown";
        const current = cashierMap.get(cashierId) ?? {
          billsCount: 0,
          collected: 0,
        };
        current.billsCount += 1;
        current.collected += bill.amountPaid ?? 0;
        cashierMap.set(cashierId, current);
      }

      const refunds = payments.filter((payment) => payment.status === "refunded");

      return {
        dailySales: {
          billsCount: bills.length,
          grossTotal: bills.reduce((sum, bill) => sum + (bill.grandTotal ?? 0), 0),
          netCollected: bills.reduce(
            (sum, bill) => sum + (bill.amountPaid ?? 0),
            0
          ),
        },
        paymentSummary: [...paymentSummaryMap.entries()].map(
          ([method, value]) => ({ method, ...value })
        ),
        cashierSummary: [...cashierMap.entries()].map(([cashierId, value]) => ({
          cashierId,
          ...value,
        })),
        refundSummary: {
          count: refunds.length,
          amount: refunds.reduce(
            (sum, payment) => sum + (payment.refundAmount || payment.amount || 0),
            0
          ),
        },
      };
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load billing summary");
    }
  },

  async checkoutPosOrder(
    input: PosCheckoutInput,
    actor: {
      restaurantId: string;
      branchId: string;
      userId: string;
      role?: string;
    }
  ): Promise<PosCheckoutResult> {
    await connectToDatabase();

    if (!isValidObjectId(input.branchId)) {
      throw Object.assign(new Error("Invalid branch ID"), {
        code: "VALIDATION_ERROR",
      });
    }

    const branch = await BranchModel.findOne(
      notDeletedFilter({
        _id: toObjectId(input.branchId),
        restaurantId: toObjectId(actor.restaurantId),
      }) as Filter
    ).exec();

    if (!branch) {
      throw Object.assign(new Error("Branch not found or access denied"), {
        code: "FORBIDDEN",
      });
    }

    let tableDoc: import("@/models/restaurant-table").RestaurantTableDocument | null =
      null;
    if (input.orderType === "dine-in" && input.tableId) {
      if (!isValidObjectId(input.tableId)) {
        throw Object.assign(new Error("Invalid table ID"), {
          code: "VALIDATION_ERROR",
        });
      }
      tableDoc = await RestaurantTableModel.findOne(
        notDeletedFilter({
          _id: toObjectId(input.tableId),
          restaurantId: toObjectId(actor.restaurantId),
          branchId: toObjectId(input.branchId),
        }) as Filter
      ).exec();

      if (!tableDoc) {
        throw Object.assign(
          new Error("Table not found or not in selected branch"),
          { code: "VALIDATION_ERROR" }
        );
      }
      if (tableDoc.status === "inactive") {
        throw Object.assign(new Error("Selected table is inactive"), {
          code: "VALIDATION_ERROR",
        });
      }
    }

    if (!input.items || input.items.length === 0) {
      throw Object.assign(
        new Error("Cart must contain at least one item"),
        { code: "VALIDATION_ERROR" }
      );
    }

    const menuIds = [...new Set(input.items.map((i) => i.menuItemId))];
    const catalogDocs = await MenuItemModel.find(
      notDeletedFilter({
        _id: { $in: menuIds.filter(isValidObjectId).map(toObjectId) },
        restaurantId: toObjectId(actor.restaurantId),
      }) as Filter
    )
      .lean()
      .exec();

    const catalogMap = new Map(
      catalogDocs.map((doc) => [String(doc._id), doc])
    );

    const verifiedLines: Array<{
      menuItemId: unknown;
      name: string;
      price: number;
      quantity: number;
      subtotal: number;
      notes: string;
      customizations: PosCartLineCustomization[];
    }> = [];
    let subtotal = 0;

    for (const item of input.items) {
      const catalogItem = catalogMap.get(item.menuItemId);
      if (!catalogItem) {
        throw Object.assign(
          new Error(`Menu item not found or unauthorized: ${item.name}`),
          { code: "VALIDATION_ERROR" }
        );
      }
      if (catalogItem.isAvailable === false) {
        throw Object.assign(
          new Error(`Item is marked unavailable: ${catalogItem.name}`),
          { code: "VALIDATION_ERROR" }
        );
      }

      let lineUnitPrice = catalogItem.price;
      const appliedCustomizations: PosCartLineCustomization[] = [];

      if (item.customizations && item.customizations.length > 0) {
        const groups = catalogItem.customizationGroups || [];
        for (const cust of item.customizations) {
          const matchedGroup = groups.find(
            (g: { id?: string; name: string }) =>
              g.id === cust.groupId || g.name === cust.groupName
          );
          if (matchedGroup && matchedGroup.options) {
            const matchedOption = matchedGroup.options.find(
              (o: { id?: string; name: string; priceDelta?: number }) =>
                o.id === cust.optionId || o.name === cust.optionName
            );
            if (matchedOption) {
              const delta = matchedOption.priceDelta || 0;
              lineUnitPrice += delta;
              appliedCustomizations.push({
                groupId: cust.groupId,
                groupName: matchedGroup.name,
                optionId: cust.optionId,
                optionName: matchedOption.name,
                priceDelta: delta,
              });
            }
          }
        }
      }

      const lineSubtotal =
        Math.round(lineUnitPrice * item.quantity * 100) / 100;
      subtotal += lineSubtotal;

      verifiedLines.push({
        menuItemId: catalogItem._id,
        name: catalogItem.name,
        price: lineUnitPrice,
        quantity: item.quantity,
        subtotal: lineSubtotal,
        notes: item.notes?.trim() || "",
        customizations: appliedCustomizations,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    const discountType: DiscountType = input.discountType ?? "fixed";
    let discountAmount = 0;
    if (input.discountValue && input.discountValue > 0) {
      discountAmount = computeDiscountAmount(
        subtotal,
        discountType,
        input.discountValue
      );
    }
    discountAmount = Math.min(Math.max(0, discountAmount), subtotal);

    const taxSettings = await TaxSettingsModel.findOne(
      notDeletedFilter({ restaurantId: toObjectId(actor.restaurantId) }) as Filter
    )
      .lean()
      .exec();

    const defaultProfile =
      (taxSettings?.profiles ?? []).find((p: { isDefault?: boolean }) => p.isDefault) ||
      taxSettings?.profiles?.[0];
    const taxRate = defaultProfile ? (defaultProfile as { gstPercent?: number }).gstPercent || 5 : 5;
    const isInterState = Boolean(input.isInterState);
    const taxMode = taxSettings?.taxMode === "inclusive" ? "inclusive" : "exclusive";

    const gstBreakdown: GstBreakdown = calculateGstTaxBreakdown({
      taxableAmount: Math.max(0, subtotal - discountAmount),
      taxRate,
      taxMode,
      isInterState,
    });

    const grandTotal =
      taxMode === "inclusive"
        ? Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100)
        : Math.max(
            0,
            Math.round(
              (subtotal - discountAmount + gstBreakdown.totalTax) * 100
            ) / 100
          );

    let totalTenderPaid = 0;
    let changeAmount = 0;

    if (input.paymentTenders && input.paymentTenders.length > 0) {
      for (const tender of input.paymentTenders) {
        totalTenderPaid += Math.max(0, tender.amount);
        if (
          tender.method === "cash" &&
          tender.cashReceived &&
          tender.cashReceived > tender.amount
        ) {
          changeAmount = Math.max(
            0,
            Math.round((tender.cashReceived - tender.amount) * 100) / 100
          );
        }
      }
    }
    totalTenderPaid = Math.round(totalTenderPaid * 100) / 100;

    const paymentStatus: BillPaymentStatus =
      totalTenderPaid >= grandTotal - 0.001
        ? "paid"
        : totalTenderPaid > 0
          ? "partially-paid"
          : "pending";

    let primaryPaymentMethod: BillPaymentMethod = "cash";
    if ((input.paymentTenders ?? []).length === 1) {
      const m = input.paymentTenders[0].method;
      primaryPaymentMethod =
        m === "card"
          ? "card"
          : m === "upi"
            ? "upi"
            : "cash";
    } else if ((input.paymentTenders ?? []).length > 1) {
      primaryPaymentMethod = "multiple";
    }

    const orderPaymentMethod: "none" | "cash" | "card" | "upi" | "wallet" | "other" =
      primaryPaymentMethod === "multiple"
        ? "other"
        : primaryPaymentMethod;

    const invoiceNumber = await generateNextInvoiceNumber(
      actor.restaurantId,
      branch.branchCode
    );
    const orderNumber = `POS-${branch.branchCode || "ORD"}-${Date.now()
      .toString(36)
      .toUpperCase()
      .slice(-5)}`;

    const orderDoc = await OrderModel.create({
      restaurantId: toObjectId(actor.restaurantId),
      branchId: toObjectId(input.branchId),
      tableId: tableDoc ? toObjectId(String(tableDoc._id)) : null,
      orderNumber,
      orderType: input.orderType,
      source: "pos",
      status: "confirmed",
      items: verifiedLines.map((l) => ({
        menuItemId: l.menuItemId,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
        discount: 0,
        tax: 0,
        subtotal: l.subtotal,
        notes: l.notes,
        customizations: l.customizations,
      })),
      subtotal,
      discount: discountAmount,
      tax: gstBreakdown.totalTax,
      serviceCharge: 0,
      grandTotal,
      paymentStatus,
      paymentMethod: orderPaymentMethod,
      priority: "normal",
      notes: input.notes?.trim() || "",
      statusHistory: [
        {
          status: "confirmed",
          changedAt: new Date(),
          changedBy: toObjectId(actor.userId),
          note: `Order placed via POS by staff`,
        },
      ],
      createdBy: toObjectId(actor.userId),
      updatedBy: toObjectId(actor.userId),
    });

    const customerLabel = input.customerName
      ? `${input.customerName}${input.customerPhone ? ` (${input.customerPhone})` : ""}`
      : null;

    const serializedOrder = serializeOrder(orderDoc, {
      tableLabel: tableDoc
        ? `${tableDoc.tableName} (${tableDoc.tableNumber})`
        : null,
      customerLabel,
    });

    await emitKitchenEvent({
      type: "NEW_ORDER",
      restaurantId: actor.restaurantId,
      branchId: input.branchId,
      orderId: String(orderDoc._id),
      orderNumber,
      status: "confirmed",
      timestamp: new Date().toISOString(),
      order: serializedOrder,
    }).catch(() => {});

    // Deduct stock for POS confirmed order (server-authoritative, non-blocking to billing)
    InventoryConsumptionService.deductOrderStock(
      actor.restaurantId,
      input.branchId,
      String(orderDoc._id),
      verifiedLines.map((l) => {
        const customizations = Array.isArray(l.customizations) ? l.customizations : [];
        const variantCustomization = customizations.find((c) => c.groupId === "variant");
        const addonCustomizations = customizations.filter((c) => c.groupId !== "variant");

        return {
          menuItemId: String(l.menuItemId),
          name: l.name,
          quantity: l.quantity,
          variantId: variantCustomization?.optionId || null,
          selectedAddons: addonCustomizations.map((a) => ({
            addonOptionId: a.optionId,
            name: a.optionName,
            quantity: 1,
          })),
        };
      }),
      {
        orderNumber,
        performedBy: actor.userId,
      }
    ).catch((invErr) => {
      console.error("[POS Checkout] Inventory stock deduction non-fatal error:", invErr);
    });

    const billDoc = await BillModel.create({
      restaurantId: toObjectId(actor.restaurantId),
      branchId: toObjectId(input.branchId),
      orderId: toObjectId(String(orderDoc._id)),
      invoiceNumber,
      items: verifiedLines.map((l) => ({
        menuItemId: l.menuItemId,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
        discount: 0,
        tax: 0,
        subtotal: l.subtotal,
        notes: l.notes,
        modifiers: [],
        customizations: l.customizations,
      })),
      subtotal,
      discount: discountAmount,
      discountConfig: {
        kind: discountType,
        value: input.discountValue ?? 0,
        amount: discountAmount,
        couponCode: "",
      },
      tax: gstBreakdown.totalTax,
      taxConfig: {
        kind: taxMode,
        label: isInterState ? "IGST" : "GST",
        rate: taxRate,
        amount: gstBreakdown.totalTax,
        cgstRate: gstBreakdown.cgstRate,
        cgstAmount: gstBreakdown.cgstAmount,
        sgstRate: gstBreakdown.sgstRate,
        sgstAmount: gstBreakdown.sgstAmount,
        igstRate: gstBreakdown.igstRate,
        igstAmount: gstBreakdown.igstAmount,
        isInterState: gstBreakdown.isInterState,
      },
      serviceCharge: 0,
      grandTotal,
      amountPaid: totalTenderPaid,
      changeGiven: changeAmount,
      paymentStatus,
      paymentMethod: primaryPaymentMethod,
      notes: input.notes?.trim() || "",
      cashierId: toObjectId(actor.userId),
      createdBy: toObjectId(actor.userId),
      updatedBy: toObjectId(actor.userId),
    });

    if (input.paymentTenders && input.paymentTenders.length > 0) {
      for (const tender of input.paymentTenders) {
        if (tender.amount > 0) {
          await PaymentModel.create({
            restaurantId: toObjectId(actor.restaurantId),
            billId: toObjectId(String(billDoc._id)),
            amount: tender.amount,
            method: tender.method,
            status: "completed",
            reference: tender.reference?.trim() || "",
            cashReceived: tender.cashReceived ?? 0,
            changeGiven: tender.changeGiven ?? 0,
            createdBy: toObjectId(actor.userId),
          });
        }
      }
    }

    if (tableDoc) {
      await RestaurantTableModel.findByIdAndUpdate(toObjectId(String(tableDoc._id)), {
        $set: { status: "occupied" },
      }).catch(() => {});
    }

    const serializedBill = serializeBill(billDoc, {
      orderNumber,
      customerLabel,
    });

    return {
      bill: serializedBill,
      order: serializedOrder,
      invoiceNumber,
      changeAmount,
      gstBreakdown,
    };
  },

  async recordPosPayment(
    input: { billId: string; tenders: PosPaymentTender[] },
    actor: { restaurantId: string; userId: string }
  ): Promise<{ bill: Bill; changeAmount: number }> {
    await connectToDatabase();
    if (!isValidObjectId(input.billId)) {
      throw Object.assign(new Error("Invalid bill ID"), {
        code: "VALIDATION_ERROR",
      });
    }

    const billDoc = await BillModel.findOne(
      notDeletedFilter({
        _id: toObjectId(input.billId),
        restaurantId: toObjectId(actor.restaurantId),
      }) as Filter
    ).exec();

    if (!billDoc) {
      throw Object.assign(new Error("Bill not found or access denied"), {
        code: "NOT_FOUND",
      });
    }

    const grandTotal = billDoc.grandTotal ?? 0;
    const previousPaid = billDoc.amountPaid ?? 0;

    let newTendersTotal = 0;
    let changeAmount = 0;

    for (const tender of input.tenders) {
      newTendersTotal += Math.max(0, tender.amount);
      if (
        tender.method === "cash" &&
        tender.cashReceived &&
        tender.cashReceived > tender.amount
      ) {
        changeAmount = Math.max(
          0,
          Math.round((tender.cashReceived - tender.amount) * 100) / 100
        );
      }
    }

    const newTotalPaid =
      Math.round((previousPaid + newTendersTotal) * 100) / 100;
    const newPaymentStatus: BillPaymentStatus =
      newTotalPaid >= grandTotal - 0.001
        ? "paid"
        : newTotalPaid > 0
          ? "partially-paid"
          : "pending";

    const updatedBillDoc = await BillModel.findOneAndUpdate(
      notDeletedFilter({
        _id: toObjectId(String(billDoc._id)),
        restaurantId: toObjectId(actor.restaurantId),
      }) as Filter,
      {
        $set: {
          amountPaid: newTotalPaid,
          changeGiven: changeAmount,
          paymentStatus: newPaymentStatus,
          updatedBy: toObjectId(actor.userId),
        },
        $inc: { version: 1 },
      },
      { new: true }
    ).exec();

    for (const tender of input.tenders) {
      if (tender.amount > 0) {
        await PaymentModel.create({
          restaurantId: toObjectId(actor.restaurantId),
          billId: toObjectId(String(billDoc._id)),
          amount: tender.amount,
          method: tender.method,
          status: "completed",
          reference: tender.reference?.trim() || "",
          cashReceived: tender.cashReceived ?? 0,
          changeGiven: tender.changeGiven ?? changeAmount,
          createdBy: toObjectId(actor.userId),
        });
      }
    }

    if (billDoc.orderId) {
      await OrderModel.findByIdAndUpdate(billDoc.orderId, {
        $set: {
          paymentStatus: newPaymentStatus,
          updatedBy: toObjectId(actor.userId),
        },
      }).catch(() => {});
    }

    const serialized = await withLabels((updatedBillDoc ?? billDoc) as BillDocument);
    return { bill: serialized, changeAmount };
  },

  async refundPosBill(
    input: { billId: string; reason: string },
    actor: { restaurantId: string; userId: string }
  ): Promise<Bill> {
    await connectToDatabase();
    if (!isValidObjectId(input.billId)) {
      throw Object.assign(new Error("Invalid bill ID"), {
        code: "VALIDATION_ERROR",
      });
    }

    const billDoc = await BillModel.findOne(
      notDeletedFilter({
        _id: toObjectId(input.billId),
        restaurantId: toObjectId(actor.restaurantId),
      }) as Filter
    ).exec();

    if (!billDoc) {
      throw Object.assign(new Error("Bill not found or access denied"), {
        code: "NOT_FOUND",
      });
    }

    const updatedBillDoc = await BillModel.findOneAndUpdate(
      notDeletedFilter({
        _id: toObjectId(String(billDoc._id)),
        restaurantId: toObjectId(actor.restaurantId),
      }) as Filter,
      {
        $set: {
          paymentStatus: "refunded",
          notes: billDoc.notes
            ? `${billDoc.notes} | Refunded: ${input.reason}`
            : `Refunded: ${input.reason}`,
          updatedBy: toObjectId(actor.userId),
        },
        $inc: { version: 1 },
      },
      { new: true }
    ).exec();

    if (billDoc.orderId) {
      await OrderModel.findByIdAndUpdate(billDoc.orderId, {
        $set: {
          paymentStatus: "refunded",
          status: "cancelled",
          updatedBy: toObjectId(actor.userId),
        },
        $push: {
          statusHistory: {
            status: "cancelled",
            changedAt: new Date(),
            changedBy: toObjectId(actor.userId),
            note: `Refunded/Voided via POS: ${input.reason}`,
          },
        },
      }).catch(() => {});
    }

    return withLabels((updatedBillDoc ?? billDoc) as BillDocument);
  },

  async getInvoicePrintData(
    billId: string,
    restaurantId: string
  ): Promise<InvoicePrintData> {
    await connectToDatabase();
    if (!isValidObjectId(billId)) throw new Error("Invalid bill ID");

    const billDoc = await BillModel.findOne(
      notDeletedFilter({
        _id: toObjectId(billId),
        restaurantId: toObjectId(restaurantId),
      }) as Filter
    ).exec();

    if (!billDoc) throw new Error("Bill not found");

    const [restaurant, branch, order, payments, cashier] = await Promise.all([
      RestaurantModel.findById(restaurantId).lean().exec(),
      billDoc.branchId
        ? BranchModel.findById(billDoc.branchId).lean().exec()
        : null,
      billDoc.orderId
        ? OrderModel.findById(billDoc.orderId).lean().exec()
        : null,
      PaymentModel.find(
        notDeletedFilter({
          billId: toObjectId(String(billDoc._id)),
          restaurantId: toObjectId(restaurantId),
        }) as Filter
      )
        .sort({ createdAt: 1 })
        .lean()
        .exec(),
      billDoc.cashierId
        ? UserModel.findById(billDoc.cashierId)
            .select({ name: 1 })
            .lean()
            .exec()
        : null,
    ]);

    const taxCfg = billDoc.taxConfig as {
      rate?: number;
      cgstRate?: number;
      cgstAmount?: number;
      sgstRate?: number;
      sgstAmount?: number;
      igstRate?: number;
      igstAmount?: number;
      amount?: number;
      taxMode?: "exclusive" | "inclusive";
    } | null;
    const gstBreakdown: GstBreakdown = {
      taxableAmount: Math.max(
        0,
        (billDoc.subtotal ?? 0) - (billDoc.discount ?? 0)
      ),
      taxRate: taxCfg?.rate ?? 5,
      cgstRate: taxCfg?.cgstRate ?? (taxCfg?.rate ? taxCfg.rate / 2 : 2.5),
      cgstAmount:
        taxCfg?.cgstAmount ??
        (taxCfg?.amount ? taxCfg.amount / 2 : (billDoc.tax ?? 0) / 2),
      sgstRate: taxCfg?.sgstRate ?? (taxCfg?.rate ? taxCfg.rate / 2 : 2.5),
      sgstAmount:
        taxCfg?.sgstAmount ??
        (taxCfg?.amount ? taxCfg.amount / 2 : (billDoc.tax ?? 0) / 2),
      igstRate: taxCfg?.igstRate ?? 0,
      igstAmount: taxCfg?.igstAmount ?? 0,
      totalTax: billDoc.tax ?? 0,
      taxMode: taxCfg?.taxMode === "inclusive" ? "inclusive" : "exclusive",
      isInterState: Boolean(taxCfg?.igstRate && taxCfg.igstRate > 0),
    };

    let tableLabel: string | null = null;
    if (order?.tableId) {
      const tDoc = await RestaurantTableModel.findById(order.tableId)
        .select({ tableNumber: 1, tableName: 1 })
        .lean()
        .exec();
      if (tDoc) {
        tableLabel = `${tDoc.tableName || "Table"} (${tDoc.tableNumber})`;
      }
    }

    return {
      invoiceNumber: billDoc.invoiceNumber,
      orderNumber: order?.orderNumber ?? null,
      issuedAt:
        billDoc.createdAt instanceof Date
          ? billDoc.createdAt.toISOString()
          : String(billDoc.createdAt),
      restaurantName: restaurant?.name || "DineFlow Restaurant",
      legalName: branch?.name || restaurant?.name || "DineFlow Restaurant",
      logo: restaurant?.logo || "",
      address: branch?.address || restaurant?.address || "",
      phone: branch?.phone || restaurant?.phone || "",
      email: branch?.email || restaurant?.email || "",
      gstin: branch?.gstin || "",
      branchName: branch?.name || "Main Branch",
      branchAddress: branch?.address || "",
      branchGstin: branch?.gstin || "",
      tableLabel,
      orderType: order?.orderType || "dine-in",
      customerLabel: null,
      customerPhone: null,
      cashierName: cashier?.name || "Staff",
      items: (billDoc.items ?? []).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        rate: i.price,
        discount: i.discount ?? 0,
        amount: i.subtotal,
        notes: i.notes || "",
        customizations: ((i as unknown as { customizations?: Array<{ optionName?: string }> }).customizations ?? []).map(
          (c) => `+${c.optionName}`
        ),
      })),
      subtotal: billDoc.subtotal ?? 0,
      discount: billDoc.discount ?? 0,
      discountLabel:
        billDoc.discountConfig?.kind === "percentage"
          ? `${billDoc.discountConfig.value}%`
          : "Fixed",
      taxableAmount: gstBreakdown.taxableAmount,
      gstBreakdown,
      serviceCharge: billDoc.serviceCharge ?? 0,
      grandTotal: billDoc.grandTotal ?? 0,
      amountPaid: billDoc.amountPaid ?? 0,
      changeGiven: billDoc.changeGiven ?? 0,
      paymentStatus: billDoc.paymentStatus as BillPaymentStatus,
      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference || "",
        timestamp:
          p.createdAt instanceof Date
            ? p.createdAt.toISOString()
            : String(p.createdAt),
      })),
      footerNote: "Thank you for dining with us!",
    };
  },
};

export const paymentRepository = {
  async create(data: {
    restaurantId: string;
    billId: string;
    amount: number;
    method: BillPaymentMethod;
    reference?: string;
    notes?: string;
    createdBy?: string | null;
  }): Promise<Payment> {
    await connectToDatabase();
    try {
      const bill = await BillModel.findOne(
        notDeletedFilter({
          _id: toObjectId(data.billId),
          restaurantId: toObjectId(data.restaurantId),
        }) as Filter
      ).exec();
      if (!bill) {
        throw handleDatabaseError(
          new Error("Bill not found"),
          "Bill not found"
        );
      }

      const due = Math.max(0, (bill.grandTotal ?? 0) - (bill.amountPaid ?? 0));
      if (data.amount > due + 0.01) {
        throw Object.assign(new Error("Payment exceeds amount due"), {
          code: "PAYMENT_INVALID",
        });
      }

      const payment = await PaymentModel.create({
        restaurantId: toObjectId(data.restaurantId),
        billId: toObjectId(data.billId),
        amount: data.amount,
        method: data.method,
        status: "completed",
        reference: data.reference ?? "",
        notes: data.notes ?? "",
        createdBy: actorObjectId(data.createdBy),
        updatedBy: actorObjectId(data.createdBy),
      });

      const amountPaid = Math.round(((bill.amountPaid ?? 0) + data.amount) * 100) / 100;
      const paymentStatus = derivePaymentStatus(bill.grandTotal ?? 0, amountPaid);
      const methods = new Set<string>();
      const existingPayments = await PaymentModel.find(
        notDeletedFilter({
          billId: toObjectId(data.billId),
          status: { $ne: "refunded" },
        }) as Filter
      )
        .select({ method: 1 })
        .lean()
        .exec();
      for (const row of existingPayments) methods.add(String(row.method));
      methods.add(data.method);

      await BillModel.findByIdAndUpdate(bill._id, {
        $set: {
          amountPaid,
          paymentStatus,
          paymentMethod:
            methods.size > 1 ? "multiple" : data.method,
          updatedBy: actorObjectId(data.createdBy),
        },
        $inc: { version: 1 },
      }).exec();

      if (bill.orderId && paymentStatus === "paid") {
        await OrderModel.findByIdAndUpdate(bill.orderId, {
          $set: {
            paymentStatus: "paid",
            paymentMethod:
              data.method === "bank-transfer" || data.method === "multiple"
                ? "other"
                : data.method,
          },
        }).exec();
      }

      if (paymentStatus === "paid") {
        (async () => {
          try {
            let customerEmail = null;
            let customerPhone = null;
            let customerName = "Customer";
            if (bill.customerId) {
              const customer = await CustomerModel.findById(bill.customerId).lean();
              if (customer) {
                customerEmail = customer.email;
                customerPhone = customer.phone;
                customerName = customer.fullName || "Customer";
              }
            }

            if (customerEmail || customerPhone) {
               await NotificationService.dispatch({
                 eventType: "PAYMENT_SUCCESS",
                 restaurantId: data.restaurantId,
                 branchId: bill.branchId ? bill.branchId.toString() : null,
                 referenceKey: `PAYMENT_SUCCESS:${bill._id}`,
                 recipient: {
                   email: customerEmail,
                   phone: customerPhone,
                   userId: bill.customerId?.toString(),
                 },
                 variables: {
                   customerName,
                   orderNumber: bill.orderId?.toString() || "", // We might not have the order number directly here without populating
                   invoiceNumber: bill.invoiceNumber || "",
                   totalAmount: bill.grandTotal,
                   paymentMethod: data.method,
                 }
               });
            }
          } catch (e) {
             console.error("Payment notification failed", e);
          }
        })();
      }

      return serializePayment(payment, bill.invoiceNumber);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "PAYMENT_INVALID"
      ) {
        throw error;
      }
      throw handleDatabaseError(error, "Failed to create payment");
    }
  },

  async refund(data: {
    restaurantId: string;
    paymentId: string;
    amount?: number;
    notes?: string;
    updatedBy?: string | null;
  }): Promise<Payment> {
    await connectToDatabase();
    try {
      const payment = await PaymentModel.findOne(
        notDeletedFilter({
          _id: toObjectId(data.paymentId),
          restaurantId: toObjectId(data.restaurantId),
        }) as Filter
      ).exec();
      if (!payment) {
        throw handleDatabaseError(
          new Error("Payment not found"),
          "Payment not found"
        );
      }
      if (payment.status === "refunded") {
        throw Object.assign(new Error("Payment already refunded"), {
          code: "PAYMENT_INVALID",
        });
      }

      const refundAmount = data.amount ?? payment.amount ?? 0;
      if (refundAmount > (payment.amount ?? 0) + 0.01) {
        throw Object.assign(new Error("Refund exceeds payment amount"), {
          code: "PAYMENT_INVALID",
        });
      }

      payment.status = "refunded";
      payment.refundAmount = refundAmount;
      payment.refundedAt = new Date();
      payment.notes = data.notes
        ? `${payment.notes ? `${payment.notes}\n` : ""}${data.notes}`
        : payment.notes;
      payment.updatedBy = actorObjectId(data.updatedBy);
      await payment.save();

      const bill = await BillModel.findById(payment.billId).exec();
      if (bill) {
        const amountPaid = Math.max(
          0,
          Math.round(((bill.amountPaid ?? 0) - refundAmount) * 100) / 100
        );
        bill.amountPaid = amountPaid;
        bill.paymentStatus =
          amountPaid <= 0
            ? "refunded"
            : derivePaymentStatus(bill.grandTotal ?? 0, amountPaid);
        bill.updatedBy = actorObjectId(data.updatedBy);
        await bill.save();

        if (bill.orderId && bill.paymentStatus === "refunded") {
          InventoryConsumptionService.reverseOrderStock(
            data.restaurantId,
            String(bill.branchId),
            String(bill.orderId),
            data.notes || "Stock reversal for refunded POS bill",
            data.updatedBy || undefined
          ).catch((revErr) => {
            console.error("[POS Refund] Inventory reversal non-fatal error:", revErr);
          });
        }
      }

      return serializePayment(payment, bill?.invoiceNumber);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "PAYMENT_INVALID"
      ) {
        throw error;
      }
      throw handleDatabaseError(error, "Failed to refund payment");
    }
  },

  async findByBill(
    billId: string,
    restaurantId: string
  ): Promise<Payment[]> {
    await connectToDatabase();
    if (!isValidObjectId(billId)) return [];
    try {
      const docs = await PaymentModel.find(
        notDeletedFilter({
          billId: toObjectId(billId),
          restaurantId: toObjectId(restaurantId),
        }) as Filter
      )
        .sort({ createdAt: -1 })
        .exec();
      const bill = await BillModel.findById(billId)
        .select({ invoiceNumber: 1 })
        .lean()
        .exec();
      return docs.map((doc) =>
        serializePayment(doc, bill?.invoiceNumber ?? null)
      );
    } catch (error) {
      throw handleDatabaseError(error, "Failed to load payments");
    }
  },

  async generateInvoice(
    billId: string,
    restaurantId: string
  ): Promise<Invoice> {
    const bill = await billRepository.findById(billId, restaurantId);
    if (!bill) {
      throw handleDatabaseError(new Error("Bill not found"), "Bill not found");
    }
    const payments = await this.findByBill(billId, restaurantId);
    return {
      bill,
      payments,
      issuedAt: new Date().toISOString(),
      restaurantName: "DineFlow Restaurant",
    };
  },

  async generateReceipt(
    billId: string,
    restaurantId: string
  ): Promise<Receipt> {
    const invoice = await this.generateInvoice(billId, restaurantId);
    return {
      bill: invoice.bill,
      payments: invoice.payments,
      printedAt: null,
      delivery: { print: "pending", email: "pending" },
    };
  },
};
