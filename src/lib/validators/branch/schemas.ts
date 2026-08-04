import { z } from "zod";
import {
  emailValidator,
  nameValidator,
  phoneValidator,
  requiredString,
} from "@/lib/validations/validators";
import { BRANCH_STATUSES } from "@/types/branch";

const optionalTrimmed = z
  .string()
  .trim()
  .max(120)
  .optional()
  .or(z.literal(""));

export const branchStatusSchema = z.enum(BRANCH_STATUSES);

export const branchCodeSchema = z
  .string()
  .trim()
  .min(2, "Branch code is required")
  .max(32, "Branch code is too long")
  .regex(
    /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/,
    "Use uppercase letters, numbers, and hyphens"
  );

export const branchInformationSchema = z.object({
  name: nameValidator,
  branchCode: branchCodeSchema,
  status: branchStatusSchema.default("active"),
  isMainBranch: z.boolean().default(false),
  managerId: optionalTrimmed.nullable().optional(),
  timezone: requiredString("Timezone is required").max(100),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter code")
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code"),
});

export const branchContactSchema = z.object({
  email: emailValidator,
  phone: phoneValidator.max(30, "Phone number is too long"),
});

export const branchAddressSchema = z.object({
  address: requiredString("Address is required").max(255),
  city: requiredString("City is required").max(100),
  state: requiredString("State is required").max(100),
  country: requiredString("Country is required").max(100),
  postalCode: requiredString("Postal code is required").max(20),
});

export const branchOpeningHoursDaySchema = z.object({
  day: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
  open: z.string().trim().optional().or(z.literal("")),
  close: z.string().trim().optional().or(z.literal("")),
  isClosed: z.boolean().optional(),
});

/** Business hours placeholder — UI validation only */
export const branchBusinessHoursSchema = z.object({
  timezone: z.string().trim().max(100).optional().or(z.literal("")),
  days: z.array(branchOpeningHoursDaySchema).default([]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const branchCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const branchSchema = z.object({
  restaurantId: z.string().trim().min(1, "Restaurant is required"),
  name: nameValidator,
  branchCode: branchCodeSchema,
  email: emailValidator,
  phone: phoneValidator.max(30),
  managerId: z.string().trim().nullable().optional(),
  address: requiredString("Address is required").max(255),
  city: requiredString("City is required").max(100),
  state: requiredString("State is required").max(100),
  country: requiredString("Country is required").max(100),
  postalCode: requiredString("Postal code is required").max(20),
  timezone: requiredString("Timezone is required").max(100),
  currency: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Z]{3}$/),
  status: branchStatusSchema.default("active"),
  openingHours: branchBusinessHoursSchema.optional(),
  coordinates: branchCoordinatesSchema.optional(),
  isMainBranch: z.boolean().default(false),
});

export const branchUpdateSchema = branchSchema.partial().omit({
  restaurantId: true,
});

export type BranchInformationValues = z.infer<typeof branchInformationSchema>;
export type BranchContactValues = z.infer<typeof branchContactSchema>;
export type BranchAddressValues = z.infer<typeof branchAddressSchema>;
export type BranchBusinessHoursValues = z.infer<
  typeof branchBusinessHoursSchema
>;
export type BranchInput = z.infer<typeof branchSchema>;
export type BranchUpdateInput = z.infer<typeof branchUpdateSchema>;
