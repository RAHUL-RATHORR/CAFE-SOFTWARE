import { z } from "zod";
import { PUBLIC_DIETARY_FILTERS } from "@/types/qr-ordering";

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

const phoneSchema = z
  .string()
  .trim()
  .max(32)
  .regex(/^$|^[+]?[\d\s()-]{7,20}$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));

export const publicRestaurantParamSchema = z.object({
  restaurant: z.string().trim().min(1).max(120),
  table: z.string().trim().max(40).optional(),
});

export const publicMenuQuerySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  categoryId: optionalObjectId,
  dietary: z.enum(PUBLIC_DIETARY_FILTERS).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(48),
});

export const guestCustomizationSelectionSchema = z.object({
  groupId: z.string().trim().min(1).max(64),
  optionIds: z.array(z.string().trim().min(1).max(64)).max(20).default([]),
});

/** Client may send display fields; server ignores money/name authority. */
export const guestCartItemSchema = z.object({
  key: z.string().trim().min(1).max(160),
  menuItemId: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid menu item"),
  name: z.string().trim().max(160).optional().or(z.literal("")),
  price: z.number().min(0).max(1_000_000).optional(),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().trim().max(255).optional().or(z.literal("")),
  isVeg: z.boolean().optional().default(true),
  image: z.string().trim().max(500).optional().or(z.literal("")),
  customizations: z.array(guestCustomizationSelectionSchema).default([]),
});

export const createGuestOrderSchema = z.object({
  tableToken: z.string().trim().min(16).max(120),
  guestName: z.string().trim().max(120).optional().or(z.literal("")),
  guestPhone: phoneSchema,
  guestEmail: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(160)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  paymentPlaceholder: z
    .enum(["pay-later", "counter", "online"])
    .default("pay-later"),
  idempotencyKey: z.string().trim().min(8).max(120),
  items: z.array(guestCartItemSchema).min(1, "Cart is empty").max(50),
});

export const trackOrderSchema = z.object({
  restaurant: z.string().trim().max(120).optional().or(z.literal("")),
  token: z.string().trim().min(8).max(120),
});

export const tableTokenParamSchema = z.object({
  tableToken: z.string().trim().min(8).max(120),
});

export type PublicMenuQueryInput = z.infer<typeof publicMenuQuerySchema>;
export type CreateGuestOrderInput = z.infer<typeof createGuestOrderSchema>;
export type TrackOrderInput = z.infer<typeof trackOrderSchema>;
