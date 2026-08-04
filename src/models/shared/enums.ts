import type { DatabaseUserRole, UserStatus } from "@/types/database";

export const DATABASE_USER_ROLES: readonly DatabaseUserRole[] = [
  "super-admin",
  "restaurant-owner",
  "manager",
  "cashier",
  "chef",
  "waiter",
  "customer",
] as const;

export const DATABASE_USER_ROLE_LABELS: Record<DatabaseUserRole, string> = {
  "super-admin": "Super Admin",
  "restaurant-owner": "Restaurant Owner",
  manager: "Manager",
  cashier: "Cashier",
  chef: "Chef",
  waiter: "Waiter",
  customer: "Customer",
};

export const USER_STATUSES: readonly UserStatus[] = [
  "active",
  "inactive",
  "invited",
  "suspended",
] as const;

export const SUBSCRIPTION_PLANS = [
  "free",
  "starter",
  "pro",
  "enterprise",
] as const;

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "inactive",
] as const;
