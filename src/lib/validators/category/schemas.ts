import { z } from "zod";
import {
  descriptionValidator,
  nameValidator,
  optionalUrlValidator,
  slugValidator,
} from "@/lib/validations/validators";

const hexColor = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value),
    "Enter a valid hex color"
  )
  .default("#2563EB");

const optionalObjectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid id")
  .nullable()
  .optional();

export const createCategorySchema = z.object({
  name: nameValidator,
  slug: slugValidator,
  description: descriptionValidator,
  image: optionalUrlValidator,
  displayOrder: z.coerce
    .number()
    .int("Display order must be a whole number")
    .min(0, "Display order cannot be negative")
    .max(9999)
    .default(0),
  color: hexColor,
  icon: z.string().trim().max(64).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  branchId: optionalObjectId,
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().trim().min(1, "Category id is required"),
});

export const deleteCategorySchema = z.object({
  id: z.string().trim().min(1, "Category id is required"),
});

export const toggleCategoryStatusSchema = z.object({
  id: z.string().trim().min(1, "Category id is required"),
  isActive: z.boolean().optional(),
});

export const searchCategorySchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  createdFrom: z.string().trim().optional().or(z.literal("")),
  createdTo: z.string().trim().optional().or(z.literal("")),
  branchId: z.string().trim().optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(["name", "slug", "displayOrder", "createdAt", "isActive"])
    .default("displayOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
export type ToggleCategoryStatusInput = z.infer<
  typeof toggleCategoryStatusSchema
>;
export type SearchCategoryInput = z.infer<typeof searchCategorySchema>;
