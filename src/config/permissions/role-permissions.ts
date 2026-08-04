import type { PermissionKey, RolePermissionMap } from "@/types/rbac";
import { permissionList } from "./registry";

const allPermissions = permissionList.map(
  (permission) => permission.key
) as PermissionKey[];

const pick = (...keys: PermissionKey[]): PermissionKey[] => keys;

/**
 * Default role → permission mapping for DineFlow multi-tenant RBAC.
 * Super Admin uses wildcard full access.
 */
export const rolePermissions: RolePermissionMap = {
  "super-admin": ["*"],

  "restaurant-owner": allPermissions.filter(
    (key) =>
      (!key.startsWith("roles.") ||
        key === "roles.view" ||
        key === "roles.assign") &&
      !key.startsWith("admin.")
  ),

  manager: pick(
    "dashboard.view",
    "dashboard.access",
    "restaurant.view",
    "restaurant.edit",
    "categories.view",
    "categories.create",
    "categories.edit",
    "categories.delete",
    "menu-items.view",
    "menu-items.create",
    "menu-items.edit",
    "menu-items.delete",
    "menu-items.import",
    "menu-items.export",
    "menu-items.manage",
    "tables.view",
    "tables.create",
    "tables.edit",
    "tables.delete",
    "tables.assign",
    "tables.manage",
    "orders.view",
    "orders.create",
    "orders.edit",
    "orders.delete",
    "orders.approve",
    "orders.export",
    "orders.changeStatus",
    "orders.manage",
    "kitchen.view",
    "kitchen.manage",
    "kitchen.edit",
    "kitchen.update",
    "kitchen.complete",
    "billing.view",
    "billing.create",
    "billing.edit",
    "billing.manage",
    "billing.export",
    "billing.refund",
    "billing.print",
    "customers.view",
    "customers.create",
    "customers.edit",
    "customers.delete",
    "customers.export",
    "customers.manage",
    "vendors.view",
    "vendors.create",
    "vendors.edit",
    "vendors.delete",
    "purchases.view",
    "purchases.create",
    "purchases.edit",
    "purchases.delete",
    "purchases.approve",
    "purchases.manage",
    "staff.view",
    "staff.create",
    "staff.edit",
    "staff.delete",
    "staff.manage",
    "shifts.view",
    "shifts.create",
    "shifts.edit",
    "attendance.view",
    "attendance.manage",
    "reports.view",
    "reports.export",
    "reports.manage",
    "analytics.view",
    "analytics.manage",
    "users.view",
    "users.create",
    "users.edit",
    "users.assign",
    "settings.view",
    "settings.edit",
    "settings.update",
    "settings.manage",
    "settings.security",
    "settings.printers",
    "settings.devices",
    "settings.branding",
    "subscription.view",
    "subscription.update",
    "branches.view",
    "branches.create",
    "branches.edit",
    "branches.manage",
    "branches.access",
    "branches.assign",
    "notifications.view",
    "notifications.manage",
    "notifications.settings",
    "announcements.manage",
    "activity.view"
  ),

  cashier: pick(
    "dashboard.view",
    "dashboard.access",
    "orders.view",
    "orders.create",
    "orders.edit",
    "orders.changeStatus",
    "tables.view",
    "billing.view",
    "billing.create",
    "billing.edit",
    "billing.manage",
    "billing.refund",
    "billing.print",
    "customers.view",
    "customers.create",
    "menu-items.view",
    "categories.view",
    "notifications.view",
    "notifications.settings",
    "activity.view"
  ),

  chef: pick(
    "dashboard.view",
    "dashboard.access",
    "kitchen.view",
    "kitchen.manage",
    "kitchen.edit",
    "kitchen.update",
    "kitchen.complete",
    "orders.view",
    "orders.edit",
    "orders.changeStatus",
    "menu-items.view",
    "categories.view",
    "notifications.view",
    "notifications.settings",
    "activity.view"
  ),

  waiter: pick(
    "dashboard.view",
    "dashboard.access",
    "orders.view",
    "orders.create",
    "orders.edit",
    "orders.changeStatus",
    "tables.view",
    "tables.assign",
    "tables.edit",
    "menu-items.view",
    "categories.view",
    "customers.view",
    "customers.create",
    "kitchen.view",
    "notifications.view",
    "notifications.settings",
    "activity.view"
  ),

  customer: pick(
    "dashboard.view",
    "orders.view",
    "orders.create",
    "menu-items.view",
    "categories.view",
    "billing.view",
    "settings.view",
    "notifications.view",
    "notifications.settings"
  ),
};

export function getRolePermissionKeys(
  role: keyof typeof rolePermissions
): readonly PermissionKey[] | readonly ["*"] {
  return rolePermissions[role];
}
