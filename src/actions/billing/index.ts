"use server";

import { revalidatePath } from "next/cache";
import { isDatabaseError } from "@/lib/database";
import {
  billingFailure,
  billingSuccess,
  zodFieldErrors,
} from "@/lib/billing";
import {
  createBillSchema,
  createPaymentSchema,
  generateInvoiceSchema,
  posCheckoutSchema,
  posRecordPaymentSchema,
  posRefundBillSchema,
  refundPaymentSchema,
  searchBillSchema,
  updateBillSchema,
} from "@/lib/validators/billing";
import {
  billRepository,
  paymentRepository,
} from "@/repositories/billing";
import { resolveBillingActor } from "@/actions/billing/context";
import { getPosCatalog } from "@/actions/billing/catalog";
import {
  connectToDatabase,
  isValidObjectId,
  notDeletedFilter,
  toObjectId,
} from "@/lib/database";
import { BranchModel } from "@/models/branch";
import { RestaurantTableModel } from "@/models/restaurant-table";
import type {
  Bill,
  BillListResult,
  BillingActionResult,
  BillingSummary,
  Invoice,
  InvoicePrintData,
  Payment,
  PosBranchOption,
  PosCheckoutResult,
  PosTableOption,
  Receipt,
} from "@/types/billing";

function mapDbError(error: unknown): BillingActionResult<never> {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "PAYMENT_INVALID"
  ) {
    return billingFailure(
      "PAYMENT_INVALID",
      ((error as { message?: string }).message ?? "Invalid payment.")
    );
  }
  if (isDatabaseError(error)) {
    if (error.code === "DATABASE_DUPLICATE_KEY") {
      return billingFailure(
        "DUPLICATE_INVOICE",
        "An invoice with this number already exists.",
        { invoiceNumber: ["This invoice number is already in use."] }
      );
    }
    return billingFailure("DATABASE_ERROR", error.message);
  }
  return billingFailure(
    "UNEXPECTED_ERROR",
    "Something went wrong. Please try again."
  );
}

function revalidateBillingPaths(id?: string) {
  revalidatePath("/billing");
  if (id) {
    revalidatePath(`/billing/${id}`);
    revalidatePath(`/billing/${id}/invoice`);
  }
}

export async function createBill(
  input: unknown
): Promise<BillingActionResult<Bill>> {
  const actor = await resolveBillingActor([
    "billing.create",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = createBillSchema.safeParse(input);
  if (!parsed.success) {
    return billingFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;

  try {
    const bill = await billRepository.create({
      restaurantId: actor.data.restaurantId,
      branchId: values.branchId ?? null,
      orderId: values.orderId ?? null,
      customerId: values.customerId ?? null,
      invoiceNumber: values.invoiceNumber || undefined,
      items: values.items.map((item) => ({
        menuItemId: item.menuItemId ?? null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount ?? 0,
        tax: item.tax ?? 0,
        subtotal: item.subtotal,
        notes: item.notes ?? "",
        modifiers: item.modifiers ?? [],
      })),
      discountType: values.discountConfig?.type,
      discountValue: values.discountConfig?.value,
      couponCode: values.discountConfig?.couponCode,
      taxType: values.taxConfig?.type,
      taxLabel: values.taxConfig?.label,
      taxRate: values.taxConfig?.rate,
      serviceCharge: values.serviceCharge,
      paymentStatus: values.paymentStatus,
      paymentMethod: values.paymentMethod,
      notes: values.notes ?? "",
      splitConfig: values.splitConfig
        ? {
            enabled: values.splitConfig.enabled,
            mode: values.splitConfig.mode ?? null,
            parties: values.splitConfig.parties ?? [],
          }
        : undefined,
      cashierId: actor.data.userId,
      createdBy: actor.data.userId,
    });

    revalidateBillingPaths(bill.id);
    return billingSuccess(bill);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function updateBill(
  input: unknown
): Promise<BillingActionResult<Bill>> {
  const actor = await resolveBillingActor([
    "billing.edit",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = updateBillSchema.safeParse(input);
  if (!parsed.success) {
    return billingFailure(
      "VALIDATION_ERROR",
      "Please fix the highlighted fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const { id, ...rest } = parsed.data;

  try {
    const bill = await billRepository.update(id, actor.data.restaurantId, {
      branchId: rest.branchId,
      orderId: rest.orderId,
      customerId: rest.customerId,
      invoiceNumber: rest.invoiceNumber,
      items: rest.items?.map((item) => ({
        menuItemId: item.menuItemId ?? null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: item.discount ?? 0,
        tax: item.tax ?? 0,
        subtotal: item.subtotal,
        notes: item.notes ?? "",
        modifiers: item.modifiers ?? [],
      })),
      discountType: rest.discountConfig?.type,
      discountValue: rest.discountConfig?.value,
      couponCode: rest.discountConfig?.couponCode,
      taxType: rest.taxConfig?.type,
      taxLabel: rest.taxConfig?.label,
      taxRate: rest.taxConfig?.rate,
      serviceCharge: rest.serviceCharge,
      paymentStatus: rest.paymentStatus,
      paymentMethod: rest.paymentMethod,
      notes: rest.notes,
      splitConfig: rest.splitConfig
        ? {
            enabled: rest.splitConfig.enabled,
            mode: rest.splitConfig.mode ?? null,
            parties: rest.splitConfig.parties ?? [],
          }
        : undefined,
      updatedBy: actor.data.userId,
    });

    if (!bill) return billingFailure("NOT_FOUND", "Bill not found.");
    revalidateBillingPaths(bill.id);
    return billingSuccess(bill);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getBill(
  id: string
): Promise<BillingActionResult<Bill>> {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  if (!id?.trim()) {
    return billingFailure("VALIDATION_ERROR", "Bill id is required.");
  }

  try {
    const bill = await billRepository.findById(id, actor.data.restaurantId);
    if (!bill) return billingFailure("NOT_FOUND", "Bill not found.");
    return billingSuccess(bill);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getBills(
  input: unknown = {}
): Promise<BillingActionResult<BillListResult>> {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = searchBillSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return billingFailure(
      "VALIDATION_ERROR",
      "Invalid search parameters.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const result = await billRepository.findMany(
      actor.data.restaurantId,
      parsed.data
    );
    return billingSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function createPayment(
  input: unknown
): Promise<BillingActionResult<Payment>> {
  const actor = await resolveBillingActor([
    "billing.create",
    "billing.edit",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = createPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return billingFailure(
      "VALIDATION_ERROR",
      "Invalid payment details.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const payment = await paymentRepository.create({
      restaurantId: actor.data.restaurantId,
      billId: parsed.data.billId,
      amount: parsed.data.amount,
      method: parsed.data.method,
      reference: parsed.data.reference,
      notes: parsed.data.notes,
      createdBy: actor.data.userId,
    });
    revalidateBillingPaths(parsed.data.billId);
    return billingSuccess(payment);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function refundPayment(
  input: unknown
): Promise<BillingActionResult<Payment>> {
  const actor = await resolveBillingActor([
    "billing.refund",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = refundPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return billingFailure(
      "VALIDATION_ERROR",
      "Invalid refund request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const payment = await paymentRepository.refund({
      restaurantId: actor.data.restaurantId,
      paymentId: parsed.data.paymentId,
      amount: parsed.data.amount,
      notes: parsed.data.notes,
      updatedBy: actor.data.userId,
    });
    revalidateBillingPaths(payment.billId);
    return billingSuccess(payment);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function generateInvoice(
  input: unknown
): Promise<BillingActionResult<Invoice>> {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.print",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  const parsed = generateInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return billingFailure(
      "VALIDATION_ERROR",
      "Invalid invoice request.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  try {
    const invoice = await paymentRepository.generateInvoice(
      parsed.data.billId,
      actor.data.restaurantId
    );
    return billingSuccess(invoice);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getBillPayments(
  billId: string
): Promise<BillingActionResult<Payment[]>> {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const payments = await paymentRepository.findByBill(
      billId,
      actor.data.restaurantId
    );
    return billingSuccess(payments);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getBillingSummary(): Promise<
  BillingActionResult<BillingSummary>
> {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const summary = await billRepository.getSummary(actor.data.restaurantId);
    return billingSuccess(summary);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getReceipt(
  billId: string
): Promise<BillingActionResult<Receipt>> {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.print",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const receipt = await paymentRepository.generateReceipt(
      billId,
      actor.data.restaurantId
    );
    return billingSuccess(receipt);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function checkoutPosOrder(
  input: unknown
): Promise<BillingActionResult<PosCheckoutResult>> {
  const parsed = posCheckoutSchema.safeParse(input);
  if (!parsed.success) {
    return billingFailure(
      "VALIDATION_ERROR",
      "Please fix invalid cart fields.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const values = parsed.data;
  const actor = await resolveBillingActor(
    ["billing.create", "billing.manage", "orders.create"],
    values.branchId
  );
  if (!actor.success) return actor;

  try {
    const result = await billRepository.checkoutPosOrder(values, {
      restaurantId: actor.data.restaurantId,
      branchId: values.branchId,
      userId: actor.data.userId,
      role: actor.data.role,
    });

    revalidateBillingPaths(result.bill.id);
    revalidatePath("/pos");
    revalidatePath("/kitchen");
    revalidatePath("/orders");

    return billingSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function recordPosPayment(
  input: unknown
): Promise<BillingActionResult<{ bill: Bill; changeAmount: number }>> {
  const parsed = posRecordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return billingFailure(
      "VALIDATION_ERROR",
      "Please enter valid payment details.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const actor = await resolveBillingActor([
    "billing.create",
    "billing.edit",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const result = await billRepository.recordPosPayment(parsed.data, {
      restaurantId: actor.data.restaurantId,
      userId: actor.data.userId,
    });

    revalidateBillingPaths(result.bill.id);
    revalidatePath("/pos");
    return billingSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function refundPosBill(
  input: unknown
): Promise<BillingActionResult<Bill>> {
  const parsed = posRefundBillSchema.safeParse(input);
  if (!parsed.success) {
    return billingFailure(
      "VALIDATION_ERROR",
      "Please provide a refund reason.",
      zodFieldErrors(parsed.error.issues)
    );
  }

  const actor = await resolveBillingActor([
    "billing.refund",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const result = await billRepository.refundPosBill(parsed.data, {
      restaurantId: actor.data.restaurantId,
      userId: actor.data.userId,
    });

    revalidateBillingPaths(result.id);
    revalidatePath("/pos");
    revalidatePath("/orders");
    return billingSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getPosInvoicePrintData(
  billId: string
): Promise<BillingActionResult<InvoicePrintData>> {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.print",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const data = await billRepository.getInvoicePrintData(
      billId,
      actor.data.restaurantId
    );
    return billingSuccess(data);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getPosTables(
  branchId?: string | null
): Promise<BillingActionResult<PosTableOption[]>> {
  const actor = await resolveBillingActor(
    ["billing.view", "billing.create", "orders.view", "tables.view"],
    branchId
  );
  if (!actor.success) return actor;

  try {
    await connectToDatabase();
    const activeBranchId = branchId || actor.data.branchId;
    const filter: Record<string, unknown> = notDeletedFilter({
      restaurantId: toObjectId(actor.data.restaurantId),
      isActive: true,
    });

    if (activeBranchId && isValidObjectId(activeBranchId)) {
      filter.branchId = toObjectId(activeBranchId);
    }

    const docs = await RestaurantTableModel.find(filter)
      .sort({ tableNumber: 1, tableName: 1 })
      .select({
        tableNumber: 1,
        tableName: 1,
        status: 1,
        capacity: 1,
        location: 1,
      })
      .lean()
      .exec();

    const tables: PosTableOption[] = docs.map((d) => ({
      id: String(d._id),
      tableNumber: d.tableNumber,
      tableName: d.tableName || `Table ${d.tableNumber}`,
      status: (d.status as PosTableOption["status"]) || "available",
      capacity: d.capacity ?? 4,
      location: d.location || "",
    }));

    return billingSuccess(tables);
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getPosBranches(): Promise<
  BillingActionResult<{
    branches: PosBranchOption[];
    activeBranchId: string | null;
    canSwitchBranch: boolean;
  }>
> {
  const actor = await resolveBillingActor([
    "billing.view",
    "billing.create",
    "orders.view",
  ]);
  if (!actor.success) return actor;

  try {
    await connectToDatabase();
    const branchFilter: Record<string, unknown> = notDeletedFilter({
      restaurantId: toObjectId(actor.data.restaurantId),
      status: "active",
    });

    // If staff is restricted to one branch, only show that branch
    if (!actor.data.canSwitchBranch && actor.data.branchId) {
      branchFilter._id = toObjectId(actor.data.branchId);
    }

    const docs = await BranchModel.find(branchFilter)
      .sort({ isMainBranch: -1, name: 1 })
      .select({
        name: 1,
        branchCode: 1,
        isMainBranch: 1,
        gstin: 1,
        address: 1,
      })
      .lean()
      .exec();

    const branches: PosBranchOption[] = docs.map((b) => ({
      id: String(b._id),
      name: b.name,
      branchCode: b.branchCode,
      isMainBranch: Boolean(b.isMainBranch),
      gstin: b.gstin || "",
      address: b.address || "",
    }));

    const activeBranchId =
      actor.data.branchId || (branches.length > 0 ? branches[0].id : null);

    return billingSuccess({
      branches,
      activeBranchId,
      canSwitchBranch: actor.data.canSwitchBranch,
    });
  } catch (error) {
    return mapDbError(error);
  }
}

export async function getPosBillingHistory(
  input: unknown
): Promise<BillingActionResult<BillListResult>> {
  const parsed = searchBillSchema.safeParse(input ?? {});
  const query = parsed.success ? parsed.data : searchBillSchema.parse({});

  const actor = await resolveBillingActor([
    "billing.view",
    "billing.manage",
  ]);
  if (!actor.success) return actor;

  try {
    const result = await billRepository.findMany(
      actor.data.restaurantId,
      query
    );
    return billingSuccess(result);
  } catch (error) {
    return mapDbError(error);
  }
}

export { getPosCatalog };

