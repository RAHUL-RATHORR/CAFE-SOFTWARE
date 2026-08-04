import { z } from "zod";
import {
  descriptionValidator,
  nameValidator,
  optionalUrlValidator,
  priceValidator,
  percentageValidator,
  quantityValidator,
  slugValidator,
} from "@/lib/validations/validators";

const optionalObjectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid id")
  .nullable()
  .optional();

const requiredObjectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Category is required");

const optionalPrice = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return value;
  },
  z.coerce
    .number()
    .min(0, "Discount price cannot be negative")
    .finite()
    .nullable()
    .optional()
);

const optionalCalories = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return value;
  },
  z.coerce.number().min(0).finite().nullable().optional()
);

const tagsSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}, z.array(z.string().trim().max(40)).max(20).default([]));

export const menuItemPriceSchema = z
  .object({
    price: priceValidator,
    discountPrice: optionalPrice,
  })
  .superRefine((data, ctx) => {
    if (
      data.discountPrice != null &&
      data.discountPrice > data.price
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["discountPrice"],
        message: "Discount price cannot exceed price",
      });
    }
  });

const menuItemFieldsSchema = z.object({
  categoryId: requiredObjectId,
  name: nameValidator,
  slug: slugValidator,
  description: descriptionValidator,
  shortDescription: z
    .string()
    .trim()
    .max(240, "Short description must be 240 characters or less")
    .optional()
    .or(z.literal("")),
  sku: z
    .string()
    .trim()
    .max(64)
    .optional()
    .or(z.literal("")),
  image: optionalUrlValidator,
  gallery: z.array(z.string().trim()).max(12).optional().default([]),
  price: priceValidator,
  discountPrice: optionalPrice,
  taxRate: percentageValidator.default(0),
  preparationTime: quantityValidator.default(0),
  calories: optionalCalories,
  isVeg: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  displayOrder: z.coerce
    .number()
    .int()
    .min(0)
    .max(9999)
    .default(0),
  tags: tagsSchema,
  branchId: optionalObjectId,
});

function refineMenuItemPrices<T extends { price: number; discountPrice?: number | null }>(
  data: T,
  ctx: z.RefinementCtx
) {
  if (data.discountPrice != null && data.discountPrice > data.price) {
    ctx.addIssue({
      code: "custom",
      path: ["discountPrice"],
      message: "Discount price cannot exceed price",
    });
  }
}

export const createMenuItemSchema = menuItemFieldsSchema.superRefine(
  refineMenuItemPrices
);

export const updateMenuItemSchema = menuItemFieldsSchema
  .partial()
  .extend({
    id: z.string().trim().min(1, "Menu item id is required"),
  })
  .superRefine((data, ctx) => {
    if (data.price == null || data.discountPrice == null) return;
    if (data.discountPrice > data.price) {
      ctx.addIssue({
        code: "custom",
        path: ["discountPrice"],
        message: "Discount price cannot exceed price",
      });
    }
  });

export const deleteMenuItemSchema = z.object({
  id: z.string().trim().min(1, "Menu item id is required"),
});

export const toggleMenuItemAvailabilitySchema = z.object({
  id: z.string().trim().min(1, "Menu item id is required"),
  isAvailable: z.boolean().optional(),
});

export const toggleMenuItemFeaturedSchema = z.object({
  id: z.string().trim().min(1, "Menu item id is required"),
  isFeatured: z.boolean().optional(),
});

export const searchMenuItemSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  categoryId: z.string().trim().optional().or(z.literal("")),
  availability: z.enum(["all", "available", "unavailable"]).default("all"),
  veg: z.enum(["all", "veg", "non-veg"]).default("all"),
  featured: z.enum(["all", "featured", "not-featured"]).default("all"),
  minPrice: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
  maxPrice: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum([
      "name",
      "slug",
      "price",
      "displayOrder",
      "createdAt",
      "isAvailable",
      "isFeatured",
    ])
    .default("displayOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type DeleteMenuItemInput = z.infer<typeof deleteMenuItemSchema>;
export type ToggleMenuItemAvailabilityInput = z.infer<
  typeof toggleMenuItemAvailabilitySchema
>;
export type ToggleMenuItemFeaturedInput = z.infer<
  typeof toggleMenuItemFeaturedSchema
>;
export type SearchMenuItemInput = z.infer<typeof searchMenuItemSchema>;
export type MenuItemPriceInput = z.infer<typeof menuItemPriceSchema>;
