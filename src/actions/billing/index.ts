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
import type {
  Bill,
  BillListResult,
  BillingActionResult,
  BillingSummary,
  Invoice,
  Payment,
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

export { getPosCatalog };
