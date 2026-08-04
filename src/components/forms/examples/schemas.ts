import { z } from "zod";
import {
  descriptionValidator,
  emailValidator,
  nameValidator,
  phoneValidator,
  priceValidator,
  quantityValidator,
  requiredString,
  slugValidator,
} from "@/lib/validations";

export const restaurantFormSchema = z.object({
  name: nameValidator,
  slug: slugValidator,
  email: emailValidator,
  phone: phoneValidator,
  address: requiredString("Address is required"),
  city: requiredString("City is required"),
  currency: z.string().length(3, "Use a 3-letter currency code"),
  timezone: requiredString("Timezone is required"),
  isActive: z.boolean().default(true),
});

export const categoryFormSchema = z.object({
  name: nameValidator,
  slug: slugValidator,
  description: descriptionValidator,
  sortOrder: quantityValidator,
  isVisible: z.boolean().default(true),
});

export const menuItemFormSchema = z.object({
  name: nameValidator,
  category: requiredString("Category is required"),
  description: descriptionValidator,
  price: priceValidator,
  preparationTime: quantityValidator,
  isAvailable: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  image: z.string().optional(),
});

export const customerFormSchema = z.object({
  firstName: nameValidator,
  lastName: nameValidator,
  email: emailValidator,
  phone: phoneValidator,
  notes: descriptionValidator,
  marketingOptIn: z.boolean().default(false),
});

export const settingsFormSchema = z.object({
  businessName: nameValidator,
  supportEmail: emailValidator,
  defaultCurrency: z.string().length(3),
  taxRate: z.coerce.number().min(0).max(100),
  themeColor: z.string().default("#2563EB"),
  notificationsEnabled: z.boolean().default(true),
});

export const billingFormSchema = z.object({
  plan: requiredString("Plan is required"),
  billingEmail: emailValidator,
  companyName: nameValidator,
  billingCycle: z.enum(["monthly", "yearly"]),
  autoRenew: z.boolean().default(true),
});

export type RestaurantFormValues = z.infer<typeof restaurantFormSchema>;
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
export type BillingFormValues = z.infer<typeof billingFormSchema>;
