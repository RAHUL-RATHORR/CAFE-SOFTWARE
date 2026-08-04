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
  computeBillTotals,
  derivePaymentStatus,
  normalizeBillLines,
  serializeBill,
  serializePayment,
} from "@/lib/billing";
import { getCustomerLabel } from "@/config/orders";
import { BillModel, PaymentModel, type BillDocument } from "@/models/billing";
import { OrderModel } from "@/models/order";
import type {
  Bill,
  BillListResult,
  BillPaymentMethod,
  BillPaymentStatus,
  BillSortField,
  BillingSummary,
  DiscountType,
  Invoice,
  Payment,
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
