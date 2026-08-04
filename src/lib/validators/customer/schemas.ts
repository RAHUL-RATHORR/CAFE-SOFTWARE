import { z } from "zod";
import {
  CUSTOMER_GENDERS,
  CUSTOMER_ORDER_TYPES,
  CUSTOMER_STATUSES,
} from "@/types/customer";

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

export const customerStatusSchema = z.enum(CUSTOMER_STATUSES);
export const customerGenderSchema = z.enum(CUSTOMER_GENDERS);

export const customerAddressSchema = z.object({
  label: z.string().trim().min(1).max(80).default("Home"),
  addressLine1: z.string().trim().max(160).default(""),
  addressLine2: z.string().trim().max(160).default(""),
  city: z.string().trim().max(80).default(""),
  state: z.string().trim().max(80).default(""),
  country: z.string().trim().max(80).default(""),
  postalCode: z.string().trim().max(24).default(""),
  landmark: z.string().trim().max(120).default(""),
  isDefault: z.boolean().default(false),
});

export const customerTagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(20)
  .default([]);

export const customerNotesSchema = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .or(z.literal(""));

const customerFieldsSchema = z.object({
  branchId: optionalObjectId,
  customerCode: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/, "Use letters, numbers, and hyphens only")
    .optional()
    .or(z.literal("")),
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(160)
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7, "Phone is required")
    .max(32)
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  dateOfBirth: optionalDate,
  anniversary: optionalDate,
  gender: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    customerGenderSchema.nullable().optional()
  ),
  avatar: z.string().trim().max(500).optional().or(z.literal("")),
  addresses: z.array(customerAddressSchema).default([]),
  tags: customerTagsSchema,
  notes: customerNotesSchema,
  preferredOrderType: z.enum(CUSTOMER_ORDER_TYPES).default("any"),
  preferredTable: optionalObjectId,
  status: customerStatusSchema.default("active"),
  loyaltyPoints: z.coerce.number().int().min(0).optional().default(0),
});

export const createCustomerSchema = customerFieldsSchema;

export const updateCustomerSchema = customerFieldsSchema.partial().extend({
  id: z.string().trim().min(1, "Customer id is required"),
});

export const deleteCustomerSchema = z.object({
  id: z.string().trim().min(1, "Customer id is required"),
});

export const updateCustomerStatusSchema = z.object({
  id: z.string().trim().min(1, "Customer id is required"),
  status: customerStatusSchema,
  note: z.string().trim().max(255).optional().or(z.literal("")),
});

export const addCustomerNoteSchema = z.object({
  id: z.string().trim().min(1, "Customer id is required"),
  body: z.string().trim().min(1, "Note is required").max(1000),
});

export const searchCustomerSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["all", ...CUSTOMER_STATUSES]).default("all"),
  tag: z.string().trim().optional().or(z.literal("")),
  vipOnly: z
    .preprocess((value) => {
      if (value === true || value === "true" || value === "1") return true;
      return false;
    }, z.boolean())
    .default(false),
  minOrders: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().int().min(0).optional()
  ),
  maxOrders: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().int().min(0).optional()
  ),
  minSpent: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
  maxSpent: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().min(0).optional()
  ),
  lastVisitFrom: z.string().trim().optional().or(z.literal("")),
  lastVisitTo: z.string().trim().optional().or(z.literal("")),
  dateFrom: z.string().trim().optional().or(z.literal("")),
  dateTo: z.string().trim().optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum([
      "fullName",
      "customerCode",
      "email",
      "phone",
      "status",
      "totalOrders",
      "totalSpent",
      "lastVisit",
      "loyaltyPoints",
      "createdAt",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type DeleteCustomerInput = z.infer<typeof deleteCustomerSchema>;
export type UpdateCustomerStatusInput = z.infer<
  typeof updateCustomerStatusSchema
>;
export type AddCustomerNoteInput = z.infer<typeof addCustomerNoteSchema>;
export type SearchCustomerInput = z.infer<typeof searchCustomerSchema>;
