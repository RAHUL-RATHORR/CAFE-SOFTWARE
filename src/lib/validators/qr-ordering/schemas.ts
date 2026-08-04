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

export const guestCartItemSchema = z.object({
  key: z.string().trim().min(1).max(120),
  menuItemId: optionalObjectId,
  name: z.string().trim().min(1).max(160),
  price: z.number().min(0).max(1_000_000),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().trim().max(255).optional().or(z.literal("")),
  isVeg: z.boolean().optional().default(true),
  image: z.string().trim().max(500).optional().or(z.literal("")),
});

export const createGuestOrderSchema = z.object({
  restaurant: z.string().trim().min(1).max(120),
  table: z.string().trim().max(40).optional().or(z.literal("")),
  guestName: z.string().trim().min(1, "Name is required").max(120),
  guestPhone: z.string().trim().max(32).optional().or(z.literal("")),
  guestEmail: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(160)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  /** FUTURE PLACEHOLDER — payment method selection */
  paymentPlaceholder: z.enum(["pay-later", "counter", "online"]).default("pay-later"),
  items: z.array(guestCartItemSchema).min(1, "Cart is empty"),
});

export const trackOrderSchema = z.object({
  restaurant: z.string().trim().min(1).max(120),
  token: z.string().trim().min(4).max(80),
});

export type PublicMenuQueryInput = z.infer<typeof publicMenuQuerySchema>;
export type CreateGuestOrderInput = z.infer<typeof createGuestOrderSchema>;
export type TrackOrderInput = z.infer<typeof trackOrderSchema>;
