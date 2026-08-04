import type { AppRole } from "@/types/navigation";

/**
 * Role placeholders for future permission architecture.
 * No enforcement is implemented.
 */
export const APP_ROLES: readonly AppRole[] = [
  "super-admin",
  "restaurant-owner",
  "manager",
  "cashier",
  "chef",
  "waiter",
  "customer",
] as const;

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  "super-admin": "Super Admin",
  "restaurant-owner": "Restaurant Owner",
  manager: "Manager",
  cashier: "Cashier",
  chef: "Chef",
  waiter: "Waiter",
  customer: "Customer",
};
