import { z } from "zod";
import {
  BILL_PAYMENT_METHODS,
  BILL_PAYMENT_STATUSES,
  DISCOUNT_TYPES,
  SPLIT_MODES,
  TAX_TYPES,
} from "@/types/billing";

const optionalObjectId = z.preprocess(
  (value) => {
    if (value === "" || value === undefined) return null;
    return value;
  },
  z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid id")
    .nullable()
    .optional()
);

const moneySchema = z.coerce.number().min(0).max(1_000_000);

export const billPaymentStatusSchema = z.enum(BILL_PAYMENT_STATUSES);
export const billPaymentMethodSchema = z.enum(BILL_PAYMENT_METHODS);

export const billLineItemSchema = z.object({
  menuItemId: optionalObjectId,
  name: z.string().trim().min(1).max(160),
  price: moneySchema,
  quantity: z.coerce.number().int().min(1).max(999),
  discount: moneySchema.optional().default(0),
  tax: moneySchema.optional().default(0),
  subtotal: moneySchema.optional(),
  notes: z.string().trim().max(255).optional().or(z.literal("")),
  modifiers: z.array(z.string().trim().max(80)).optional().default([]),
});

export const billDiscountSchema = z.object({
  type: z.enum(DISCOUNT_TYPES).default("fixed"),
  value: moneySchema.default(0),
  couponCode: z.string().trim().max(64).optional().or(z.literal("")),
});

export const billTaxSchema = z.object({
  type: z.enum(TAX_TYPES).default("gst"),
  label: z.string().trim().max(64).optional().default("GST"),
  rate: z.coerce.number().min(0).max(100).default(5),
});

export const billSplitSchema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(SPLIT_MODES).nullable().optional(),
  parties: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        amount: moneySchema,
        itemIndexes: z.array(z.coerce.number().int().min(0)).default([]),
      })
    )
    .optional()
    .default([]),
});

const billFieldsSchema = z.object({
  branchId: optionalObjectId,
  orderId: optionalObjectId,
  customerId: optionalObjectId,
  invoiceNumber: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/)
    .optional()
    .or(z.literal("")),
  items: z.array(billLineItemSchema).min(1, "Add at least one item"),
  discountConfig: billDiscountSchema.optional(),
  taxConfig: billTaxSchema.optional(),
  serviceCharge: moneySchema.optional().default(0),
  paymentStatus: billPaymentStatusSchema.optional().default("pending"),
  paymentMethod: billPaymentMethodSchema.optional().default("cash"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  splitConfig: billSplitSchema.optional(),
});

export const createBillSchema = billFieldsSchema;

export const updateBillSchema = billFieldsSchema.partial().extend({
  id: z.string().trim().min(1, "Bill id is required"),
  items: z.array(billLineItemSchema).min(1).optional(),
});

export const searchBillSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  paymentStatus: z.enum(["all", ...BILL_PAYMENT_STATUSES]).default("all"),
  paymentMethod: z.enum(["all", ...BILL_PAYMENT_METHODS]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum([
      "invoiceNumber",
      "paymentStatus",
      "grandTotal",
      "createdAt",
      "updatedAt",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createPaymentSchema = z.object({
  billId: z.string().trim().min(1),
  amount: moneySchema.min(0.01, "Payment amount is required"),
  method: billPaymentMethodSchema,
  reference: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().trim().min(1),
  amount: moneySchema.min(0.01).optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const generateInvoiceSchema = z.object({
  billId: z.string().trim().min(1),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type SearchBillInput = z.infer<typeof searchBillSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
