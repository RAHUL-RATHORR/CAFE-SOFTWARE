import { z } from "zod";
import { VENDOR_STATUSES } from "@/types/vendor";

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

export const vendorStatusSchema = z.enum(VENDOR_STATUSES);

const vendorFieldsSchema = z.object({
  branchId: optionalObjectId,
  vendorCode: z
    .string()
    .trim()
    .max(40)
    .regex(/^[A-Za-z0-9-]*$/, "Use letters, numbers, and hyphens only")
    .optional()
    .or(z.literal("")),
  companyName: z.string().trim().min(1, "Company name is required").max(160),
  contactPerson: z.string().trim().max(120).optional().or(z.literal("")),
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
  gstNumber: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().max(24).optional().or(z.literal("")),
  status: vendorStatusSchema.default("active"),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const createVendorSchema = vendorFieldsSchema;
export const updateVendorSchema = vendorFieldsSchema.partial().extend({
  id: z.string().trim().min(1, "Vendor id is required"),
});
export const deleteVendorSchema = z.object({
  id: z.string().trim().min(1, "Vendor id is required"),
});

export const searchVendorSchema = z.object({
  q: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["all", ...VENDOR_STATUSES]).default("all"),
  branchId: z.string().trim().optional().or(z.literal("")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum([
      "companyName",
      "vendorCode",
      "email",
      "phone",
      "status",
      "rating",
      "createdAt",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type DeleteVendorInput = z.infer<typeof deleteVendorSchema>;
export type SearchVendorInput = z.infer<typeof searchVendorSchema>;
