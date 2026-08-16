import { z } from "zod";
import {
  descriptionValidator,
  emailValidator,
  nameValidator,
  phoneValidator,
  slugValidator,
} from "@/lib/validations/validators";
import {
  BRANCH_SETUP_MODES,
  SETUP_SUBSCRIPTION_PLAN_IDS,
} from "@/types/restaurant-setup";

const optionalTrimmed = z
  .string()
  .trim()
  .max(120)
  .optional()
  .or(z.literal(""));

export const restaurantInformationSetupSchema = z.object({
  restaurantName: nameValidator,
  slug: slugValidator,
  ownerName: nameValidator,
  ownerEmail: emailValidator,
  ownerMobile: phoneValidator,
  restaurantPhone: phoneValidator,
  gstNumber: optionalTrimmed,
  logoPlaceholder: optionalTrimmed,
  description: descriptionValidator,
});

export const locationSetupSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(100),
  state: z.string().trim().min(1, "State is required").max(100),
  city: z.string().trim().min(1, "City is required").max(100),
  address: z.string().trim().min(1, "Address is required").max(255),
  postalCode: z
    .string()
    .trim()
    .min(3, "Postal code is required")
    .max(20, "Postal code is too long"),
  timezone: z.string().trim().min(1, "Timezone is required").max(100),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter code")
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code"),
});

export const subscriptionSetupSchema = z.object({
  planId: z.enum(SETUP_SUBSCRIPTION_PLAN_IDS),
});

export const branchSetupSchema = z.object({
  mode: z.enum(BRANCH_SETUP_MODES),
  branchName: nameValidator,
  branchPhone: phoneValidator,
  branchAddress: z
    .string()
    .trim()
    .min(1, "Branch address is required")
    .max(255, "Branch address is too long"),
});

export const tableSetupSchema = z.object({
  totalTables: z.coerce
    .number({ error: "Enter total tables" })
    .int("Tables must be a whole number")
    .min(1, "Add at least 1 table")
    .max(200, "Maximum 200 tables in this setup"),
});

export const restaurantSetupDraftSchema = z.object({
  restaurant: restaurantInformationSetupSchema,
  location: locationSetupSchema,
  subscription: subscriptionSetupSchema,
  branch: branchSetupSchema,
  tables: tableSetupSchema,
});

export type RestaurantInformationSetupValues = z.infer<
  typeof restaurantInformationSetupSchema
>;
export type LocationSetupValues = z.infer<typeof locationSetupSchema>;
export type SubscriptionSetupValues = z.infer<typeof subscriptionSetupSchema>;
export type BranchSetupValues = z.infer<typeof branchSetupSchema>;
export type TableSetupValues = z.infer<typeof tableSetupSchema>;
export type RestaurantSetupDraftValues = z.infer<
  typeof restaurantSetupDraftSchema
>;
