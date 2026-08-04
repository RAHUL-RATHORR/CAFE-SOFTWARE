import { z } from "zod";
import { PURCHASE_STATUSES } from "@/types/purchase";
import { INVENTORY_UNITS } from "@/types/inventory";

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

const optionalDate = z.preprocess(
  (value) => {
    if (value === "" || value == null) return null;
    return value;
  },
  z.string().trim().nullable().optional()
);

export const moneySchema = z.coerce
  .number()
  .min(0, "Amount cannot be negative")
  .max(1_000_000, "Amount is too large");

export const purchaseStatusSchema = z.enum(PURCHASE_STATUSES);
export const inventoryUnitSchema = z.enum(INVENTORY_UNITS);

export const purchaseItemSchema = z
  .object({
    ingredientId: optionalObjectId,
    name: z.string().trim().min(1, "Item name is required").max(160),
    quantity: z.coerce.number().min(0.001, "Quantity is required").max(999999),
    unit: inventoryUnitSchema.default("piece"),
    unitPrice: moneySchema,
    discount: moneySchema.optional().default(0),
    tax: moneySchema.optional().default(0),
    subtotal: moneySchema.optional(),
    quantityReceived: z.coerce.number().min(0).optional().default(0),
  })
  .superRefine((item, ctx) => {
    const computed = Math.max(
      0,
      item.quantity * item.unitPrice -
        (item.discount ?? 0) +
        (item.tax ?? 0)
    );
    if (item.subtotal != null && Math.abs(item.subtotal - computed) > 0.05) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Item subtotal does not match unit price, quantity, discount, and tax.",
        path: ["subtotal"],
      });
    }
  });

const purchaseFieldsBaseSchema = z.object({
  branchId: optionalObjectId,
  vendorId: optionalObjectId,
  purchaseNumber: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/, "Use letters, numbers, and hyphens only")
    .optional()
    .or(z.literal("")),
  status: purchaseStatusSchema.default("draft"),
  items: z
    .array(purchaseItemSchema)
    .min(1, "Add at least one purchase item")
    .default([]),
  subtotal: moneySchema.optional(),
  discount: moneySchema.optional().default(0),
  tax: moneySchema.optional().default(0),
  shippingCost: moneySchema.optional().default(0),
  grandTotal: moneySchema.optional(),
  expectedDelivery: optionalDate,
  receivedDate: optionalDate,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

function refinePurchasePricing(
  values: z.infer<typeof purchaseFieldsBaseSchema>,
  ctx: z.RefinementCtx
) {
  if (!values.items?.length) return;

  const itemsSubtotal = values.items.reduce((sum, item) => {
    const line =
      item.subtotal != null
        ? item.subtotal
        : Math.max(
            0,
            item.quantity * item.unitPrice -
              (item.discount ?? 0) +
              (item.tax ?? 0)
          );
    return sum + line;
  }, 0);

  const expectedGrand = Math.max(
    0,
    itemsSubtotal -
      (values.discount ?? 0) +
      (values.tax ?? 0) +
      (values.shippingCost ?? 0)
  );

  if (
    values.subtotal != null &&
    Math.abs(values.subtotal - itemsSubtotal) > 0.05
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Subtotal does not match line items.",
      path: ["subtotal"],
    });
  }

  if (
    values.grandTotal != null &&
    Math.abs(values.grandTotal - expectedGrand) > 0.05
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Grand total does not match pricing fields.",
      path: ["grandTotal"],
    });
  }
}

export const createPurchaseOrderSchema = purchaseFieldsBaseSchema.superRefine(
  refinePurchasePricing
);

export const updatePurchaseOrderSchema = purchaseFieldsBaseSchema
  .partial()
  .extend({
    id: z.string().trim().min(1, "Purchase id is required"),
    items: z.array(purchaseItemSchema).min(1).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.items) {
      refinePurchasePricing(
        values as z.infer<typeof purchaseFieldsBaseSchema>,
        ctx
      );
    }
  });

export const deletePurchaseOrderSchema = z.object({
  id: z.string().trim().min(1, "Purchase id is required"),
});

export const updatePurchaseStatusSchema = z.object({
  id: z.string().trim().min(1, "Purchase id is required"),
  status: purchaseStatusSchema,
  note: z.string().trim().max(255).optional().or(z.literal("")),
});

export const searchPurchaseOrderSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["all", ...PURCHASE_STATUSES]).default("all"),
  vendorId: z.string().trim().optional().or(z.literal("")),
  branchId: z.string().trim().optional().or(z.literal("")),
  minAmount: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
  maxAmount: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
  dateFrom: z.string().trim().optional().or(z.literal("")),
  dateTo: z.string().trim().optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum([
      "purchaseNumber",
      "status",
      "grandTotal",
      "expectedDelivery",
      "receivedDate",
      "createdAt",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type DeletePurchaseOrderInput = z.infer<typeof deletePurchaseOrderSchema>;
export type UpdatePurchaseStatusInput = z.infer<
  typeof updatePurchaseStatusSchema
>;
export type SearchPurchaseOrderInput = z.infer<
  typeof searchPurchaseOrderSchema
>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;
