import { z } from "zod";
import {
  ORDER_PRIORITIES,
  ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "@/types/order";

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

export const moneySchema = z.coerce
  .number()
  .min(0, "Amount cannot be negative")
  .max(1_000_000, "Amount is too large");

export const orderTypeSchema = z.enum(ORDER_TYPES);
export const restaurantOrderStatusSchema = z.enum(ORDER_STATUSES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export const orderPrioritySchema = z.enum(ORDER_PRIORITIES);

export const orderLineItemSchema = z
  .object({
    menuItemId: optionalObjectId,
    name: z.string().trim().min(1, "Item name is required").max(160),
    price: moneySchema,
    quantity: z.coerce
      .number()
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .max(999),
    discount: moneySchema.optional().default(0),
    tax: moneySchema.optional().default(0),
    subtotal: moneySchema.optional(),
    notes: z.string().trim().max(255).optional().or(z.literal("")),
  })
  .superRefine((item, ctx) => {
    const computed = Math.max(
      0,
      item.quantity * item.price - (item.discount ?? 0) + (item.tax ?? 0)
    );
    if (item.subtotal != null && Math.abs(item.subtotal - computed) > 0.05) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Item subtotal does not match price, quantity, discount, and tax.",
        path: ["subtotal"],
      });
    }
  });

const orderFieldsBaseSchema = z.object({
  branchId: optionalObjectId,
  tableId: optionalObjectId,
  customerId: optionalObjectId,
  orderNumber: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/, "Use letters, numbers, and hyphens only")
    .optional()
    .or(z.literal("")),
  orderType: orderTypeSchema.default("dine-in"),
  status: restaurantOrderStatusSchema.default("pending"),
  items: z
    .array(orderLineItemSchema)
    .min(1, "Add at least one menu item")
    .default([]),
  subtotal: moneySchema.optional(),
  discount: moneySchema.optional().default(0),
  tax: moneySchema.optional().default(0),
  serviceCharge: moneySchema.optional().default(0),
  grandTotal: moneySchema.optional(),
  paymentStatus: paymentStatusSchema.default("pending"),
  paymentMethod: paymentMethodSchema.default("none"),
  priority: orderPrioritySchema.default("normal"),
  assignedChefId: optionalObjectId,
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  kitchenNotes: z.string().trim().max(500).optional().or(z.literal("")),
});

function refineOrderPricing(
  values: z.infer<typeof orderFieldsBaseSchema>,
  ctx: z.RefinementCtx
) {
  if (!values.items?.length) return;

  const itemsSubtotal = values.items.reduce((sum, item) => {
    const line =
      item.subtotal != null
        ? item.subtotal
        : Math.max(
            0,
            item.quantity * item.price - (item.discount ?? 0) + (item.tax ?? 0)
          );
    return sum + line;
  }, 0);

  if (
    values.subtotal != null &&
    Math.abs(values.subtotal - itemsSubtotal) > 0.05
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Order subtotal must match item totals.",
      path: ["subtotal"],
    });
  }

  const expectedGrand = Math.max(
    0,
    (values.subtotal ?? itemsSubtotal) -
      (values.discount ?? 0) +
      (values.tax ?? 0) +
      (values.serviceCharge ?? 0)
  );

  if (
    values.grandTotal != null &&
    Math.abs(values.grandTotal - expectedGrand) > 0.05
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Grand total does not match pricing breakdown.",
      path: ["grandTotal"],
    });
  }
}

export const createOrderSchema = orderFieldsBaseSchema.superRefine(
  refineOrderPricing
);

export const updateOrderSchema = orderFieldsBaseSchema
  .partial()
  .extend({
    id: z.string().trim().min(1, "Order id is required"),
    items: z.array(orderLineItemSchema).min(1, "Add at least one menu item").optional(),
  })
  .superRefine((values, ctx) => {
    if (values.items) {
      refineOrderPricing(
        values as z.infer<typeof orderFieldsBaseSchema>,
        ctx
      );
    }
  });

export const deleteOrderSchema = z.object({
  id: z.string().trim().min(1, "Order id is required"),
});

export const changeOrderStatusSchema = z.object({
  id: z.string().trim().min(1, "Order id is required"),
  status: restaurantOrderStatusSchema,
  note: z.string().trim().max(255).optional().or(z.literal("")),
});

export const duplicateOrderSchema = z.object({
  id: z.string().trim().min(1, "Order id is required"),
});

export const searchOrderSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["all", ...ORDER_STATUSES]).default("all"),
  orderType: z.enum(["all", ...ORDER_TYPES]).default("all"),
  paymentStatus: z.enum(["all", ...PAYMENT_STATUSES]).default("all"),
  priority: z.enum(["all", ...ORDER_PRIORITIES]).default("all"),
  tableId: z.string().trim().optional().or(z.literal("")),
  customerId: z.string().trim().optional().or(z.literal("")),
  assignedChefId: z.string().trim().optional().or(z.literal("")),
  dateFrom: z.string().trim().optional().or(z.literal("")),
  dateTo: z.string().trim().optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum([
      "orderNumber",
      "orderType",
      "status",
      "paymentStatus",
      "priority",
      "grandTotal",
      "createdAt",
      "updatedAt",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type DeleteOrderInput = z.infer<typeof deleteOrderSchema>;
export type ChangeOrderStatusInput = z.infer<typeof changeOrderStatusSchema>;
export type DuplicateOrderInput = z.infer<typeof duplicateOrderSchema>;
export type SearchOrderInput = z.infer<typeof searchOrderSchema>;
export type OrderLineItemInput = z.infer<typeof orderLineItemSchema>;
