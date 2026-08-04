import { z } from "zod";
import {
  descriptionValidator,
  emailValidator,
  nameValidator,
  phoneValidator,
  slugValidator,
} from "@/lib/validations/validators";

const optionalTrimmed = z
  .string()
  .trim()
  .max(120)
  .optional()
  .or(z.literal(""));

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Use a valid hex color (e.g. #2563EB)");

export const restaurantInformationSchema = z.object({
  name: nameValidator,
  slug: slugValidator,
  businessEmail: emailValidator,
  phone: phoneValidator.max(30, "Phone number is too long"),
  logoPlaceholder: optionalTrimmed,
  description: descriptionValidator,
});

export const businessDetailsSchema = z.object({
  businessType: z.string().trim().min(1, "Business type is required"),
  cuisineType: optionalTrimmed,
  taxId: optionalTrimmed,
  registrationNumber: optionalTrimmed,
});

export const addressSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(100),
  state: z.string().trim().min(1, "State is required").max(100),
  city: z.string().trim().min(1, "City is required").max(100),
  address: z.string().trim().min(1, "Address is required").max(255),
  postalCode: z
    .string()
    .trim()
    .min(3, "Postal code is required")
    .max(20, "Postal code is too long"),
});

export const currencyTimezoneSchema = z.object({
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter code")
    .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code"),
  timezone: z.string().trim().min(1, "Timezone is required").max(100),
});

export const brandingSchema = z.object({
  logoUrl: optionalTrimmed,
  receiptLogoUrl: optionalTrimmed,
  primaryColor: hexColor,
  secondaryColor: hexColor,
  themePreference: z.enum(["light", "dark", "system"]),
});

/** Combined draft schema for full-review validation (client only) */
export const onboardingDraftSchema = z.object({
  restaurant: restaurantInformationSchema,
  business: businessDetailsSchema,
  address: addressSchema,
  regional: currencyTimezoneSchema,
  branding: brandingSchema,
});

export type RestaurantInformationValues = z.infer<
  typeof restaurantInformationSchema
>;
export type BusinessDetailsValues = z.infer<typeof businessDetailsSchema>;
export type AddressValues = z.infer<typeof addressSchema>;
export type CurrencyTimezoneValues = z.infer<typeof currencyTimezoneSchema>;
export type BrandingValues = z.infer<typeof brandingSchema>;
export type OnboardingDraftValues = z.infer<typeof onboardingDraftSchema>;
