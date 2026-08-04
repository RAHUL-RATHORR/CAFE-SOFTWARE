import { z } from "zod";
import {
  emailValidator,
  phoneValidator,
  slugValidator,
  nameValidator,
} from "@/lib/validations/validators";
import type { DatabaseUserRole, UserStatus } from "@/types/database";

export const emailSchema = emailValidator;
export const phoneSchema = phoneValidator;
export const slugSchema = slugValidator;

export const subscriptionPlanSchema = z.enum([
  "free",
  "starter",
  "pro",
  "enterprise",
]);

export const subscriptionStatusSchema = z.enum([
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "inactive",
]);

export const databaseUserRoleSchema = z.enum([
  "super-admin",
  "restaurant-owner",
  "manager",
  "cashier",
  "chef",
  "waiter",
  "customer",
] as const satisfies readonly DatabaseUserRole[]);

export const userStatusSchema = z.enum([
  "active",
  "inactive",
  "invited",
  "suspended",
] as const satisfies readonly UserStatus[]);

export const restaurantSchema = z.object({
  name: nameValidator,
  slug: slugSchema,
  email: emailSchema,
  phone: phoneSchema.max(30, "Phone number is too long"),
  logo: z.string().trim().url("Invalid logo URL").optional().or(z.literal("")),
  address: z.string().trim().min(1, "Address is required").max(255),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State is required").max(100),
  country: z.string().trim().min(1, "Country is required").max(100),
  currency: z.string().trim().length(3, "Currency must be a 3-letter code"),
  timezone: z.string().trim().min(1, "Timezone is required").max(100),
  subscriptionPlan: subscriptionPlanSchema.default("free"),
  subscriptionStatus: subscriptionStatusSchema.default("trialing"),
  isActive: z.boolean().default(true),
});

export const restaurantUpdateSchema = restaurantSchema.partial();

export const userSchema = z.object({
  restaurantId: z.string().trim().min(1).nullable().optional(),
  name: nameValidator,
  email: emailSchema,
  /** Password placeholder — hashing/auth not implemented in this module */
  password: z.string().max(72).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  avatar: z.string().trim().url("Invalid avatar URL").optional().or(z.literal("")),
  role: databaseUserRoleSchema.default("manager"),
  status: userStatusSchema.default("invited"),
  lastLogin: z.coerce.date().nullable().optional(),
  emailVerified: z.boolean().default(false),
});

export const userUpdateSchema = userSchema.partial();

export type RestaurantInput = z.infer<typeof restaurantSchema>;
export type RestaurantUpdateInput = z.infer<typeof restaurantUpdateSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
