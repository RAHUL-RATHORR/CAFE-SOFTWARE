import { z } from "zod";
import {
  nameValidator,
  quantityValidator,
  requiredString,
} from "@/lib/validations/validators";
import {
  RESTAURANT_TABLE_SHAPES,
  RESTAURANT_TABLE_STATUSES,
} from "@/types/restaurant-table";

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

export const restaurantTableStatusSchema = z.enum(RESTAURANT_TABLE_STATUSES);
export const restaurantTableShapeSchema = z.enum(RESTAURANT_TABLE_SHAPES);

const restaurantTableFieldsSchema = z.object({
  tableNumber: requiredString("Table number is required")
    .max(32, "Table number is too long")
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only"),
  tableName: nameValidator,
  capacity: z.coerce
    .number()
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(100, "Capacity cannot exceed 100"),
  shape: restaurantTableShapeSchema.default("square"),
  status: restaurantTableStatusSchema.default("available"),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  floorId: optionalObjectId,
  branchId: optionalObjectId,
  qrCodePlaceholder: z.string().trim().max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  displayOrder: quantityValidator.default(0),
});

export const createRestaurantTableSchema = restaurantTableFieldsSchema;

export const updateRestaurantTableSchema = restaurantTableFieldsSchema
  .partial()
  .extend({
    id: z.string().trim().min(1, "Table id is required"),
  });

export const deleteRestaurantTableSchema = z.object({
  id: z.string().trim().min(1, "Table id is required"),
});

export const updateRestaurantTableStatusSchema = z.object({
  id: z.string().trim().min(1, "Table id is required"),
  status: restaurantTableStatusSchema,
});

export const searchRestaurantTableSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z
    .enum(["all", ...RESTAURANT_TABLE_STATUSES])
    .default("all"),
  floorId: z.string().trim().optional().or(z.literal("")),
  branchId: z.string().trim().optional().or(z.literal("")),
  minCapacity: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().int().min(1).optional()
  ),
  maxCapacity: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().int().min(1).optional()
  ),
  active: z.enum(["all", "active", "inactive"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum([
      "tableNumber",
      "tableName",
      "capacity",
      "status",
      "displayOrder",
      "createdAt",
      "isActive",
    ])
    .default("displayOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const setRestaurantTableActiveSchema = z.object({
  id: z.string().trim().min(1, "Table id is required"),
  isActive: z.boolean(),
});

export const previewBulkTablesSchema = z.object({
  branchId: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Branch id is required"),
  prefix: z
    .string()
    .trim()
    .max(16)
    .regex(/^[A-Za-z0-9-]*$/, "Use letters, numbers, and hyphens only")
    .default("T"),
  startNumber: z.coerce.number().int().min(1).max(9999).default(1),
  count: z.coerce.number().int().min(1).max(100),
  capacity: z.coerce.number().int().min(1).max(100).default(4),
  namePrefix: z.string().trim().max(80).optional().or(z.literal("")),
});

export const confirmBulkTablesSchema = previewBulkTablesSchema.extend({
  /** Only create numbers that were confirmed as creatable in the preview */
  confirmedNumbers: z.array(z.string().trim().min(1)).min(1),
});

export const tableQrActionSchema = z.object({
  tableId: z.string().trim().min(1, "Table id is required"),
});

export type CreateRestaurantTableInput = z.infer<
  typeof createRestaurantTableSchema
>;
export type UpdateRestaurantTableInput = z.infer<
  typeof updateRestaurantTableSchema
>;
export type DeleteRestaurantTableInput = z.infer<
  typeof deleteRestaurantTableSchema
>;
export type UpdateRestaurantTableStatusInput = z.infer<
  typeof updateRestaurantTableStatusSchema
>;
export type SearchRestaurantTableInput = z.infer<
  typeof searchRestaurantTableSchema
>;
export type SetRestaurantTableActiveInput = z.infer<
  typeof setRestaurantTableActiveSchema
>;
export type PreviewBulkTablesInput = z.infer<typeof previewBulkTablesSchema>;
export type ConfirmBulkTablesInput = z.infer<typeof confirmBulkTablesSchema>;
export type TableQrActionInput = z.infer<typeof tableQrActionSchema>;
