import type {
  PermissionDefinition,
  PermissionKey,
  RbacAction,
  RbacResource,
  RbacScope,
} from "@/types/rbac";

function definePermission(
  resource: RbacResource,
  action: RbacAction,
  options: {
    scope?: RbacScope;
    label?: string;
    description?: string;
    group: PermissionDefinition["group"];
  }
): PermissionDefinition {
  const key = `${resource}.${action}` as PermissionKey;
  return {
    key,
    resource,
    action,
    scope: options.scope ?? "restaurant",
    label: options.label ?? `${action} ${resource}`,
    description: options.description,
    group: options.group,
  };
}

/**
 * Central permission registry — single source of truth for RBAC keys.
 */
export const permissionRegistry = {
  "dashboard.view": definePermission("dashboard", "view", {
    group: "overview",
    scope: "restaurant",
    label: "View dashboard",
  }),
  "dashboard.access": definePermission("dashboard", "access", {
    group: "overview",
    label: "Access dashboard",
  }),

  "restaurant.view": definePermission("restaurant", "view", {
    group: "restaurant",
  }),
  "restaurant.edit": definePermission("restaurant", "edit", {
    group: "restaurant",
  }),
  "restaurant.manage": definePermission("restaurant", "manage", {
    group: "restaurant",
    scope: "global",
  }),

  "categories.view": definePermission("categories", "view", {
    group: "restaurant",
  }),
  "categories.create": definePermission("categories", "create", {
    group: "restaurant",
  }),
  "categories.edit": definePermission("categories", "edit", {
    group: "restaurant",
  }),
  "categories.delete": definePermission("categories", "delete", {
    group: "restaurant",
  }),

  "menu-items.view": definePermission("menu-items", "view", {
    group: "restaurant",
  }),
  "menu-items.create": definePermission("menu-items", "create", {
    group: "restaurant",
  }),
  "menu-items.edit": definePermission("menu-items", "edit", {
    group: "restaurant",
  }),
  "menu-items.delete": definePermission("menu-items", "delete", {
    group: "restaurant",
  }),
  "menu-items.import": definePermission("menu-items", "import", {
    group: "restaurant",
  }),
  "menu-items.export": definePermission("menu-items", "export", {
    group: "restaurant",
  }),
  "menu-items.manage": definePermission("menu-items", "manage", {
    group: "restaurant",
    label: "Manage menu items",
  }),

  "tables.view": definePermission("tables", "view", {
    group: "operations",
  }),
  "tables.create": definePermission("tables", "create", {
    group: "operations",
  }),
  "tables.edit": definePermission("tables", "edit", {
    group: "operations",
  }),
  "tables.delete": definePermission("tables", "delete", {
    group: "operations",
  }),
  "tables.assign": definePermission("tables", "assign", {
    group: "operations",
  }),
  "tables.manage": definePermission("tables", "manage", {
    group: "operations",
    label: "Manage tables",
  }),

  "orders.view": definePermission("orders", "view", {
    group: "operations",
  }),
  "orders.create": definePermission("orders", "create", {
    group: "operations",
  }),
  "orders.edit": definePermission("orders", "edit", {
    group: "operations",
  }),
  "orders.delete": definePermission("orders", "delete", {
    group: "operations",
  }),
  "orders.approve": definePermission("orders", "approve", {
    group: "operations",
  }),
  "orders.export": definePermission("orders", "export", {
    group: "operations",
  }),
  "orders.changeStatus": definePermission("orders", "changeStatus", {
    group: "operations",
    label: "Change order status",
  }),
  "orders.manage": definePermission("orders", "manage", {
    group: "operations",
    label: "Manage orders",
  }),

  "kitchen.view": definePermission("kitchen", "view", {
    group: "operations",
  }),
  "kitchen.manage": definePermission("kitchen", "manage", {
    group: "operations",
  }),
  "kitchen.edit": definePermission("kitchen", "edit", {
    group: "operations",
  }),
  "kitchen.update": definePermission("kitchen", "update", {
    group: "operations",
    label: "Update kitchen tickets",
  }),
  "kitchen.complete": definePermission("kitchen", "complete", {
    group: "operations",
    label: "Complete kitchen tickets",
  }),

  "billing.view": definePermission("billing", "view", {
    group: "commerce",
  }),
  "billing.create": definePermission("billing", "create", {
    group: "commerce",
  }),
  "billing.edit": definePermission("billing", "edit", {
    group: "commerce",
  }),
  "billing.manage": definePermission("billing", "manage", {
    group: "commerce",
  }),
  "billing.export": definePermission("billing", "export", {
    group: "commerce",
  }),
  "billing.refund": definePermission("billing", "refund", {
    group: "commerce",
    label: "Refund payments",
  }),
  "billing.print": definePermission("billing", "print", {
    group: "commerce",
    label: "Print invoices",
  }),

  "customers.view": definePermission("customers", "view", {
    group: "people",
  }),
  "customers.create": definePermission("customers", "create", {
    group: "people",
  }),
  "customers.edit": definePermission("customers", "edit", {
    group: "people",
  }),
  "customers.delete": definePermission("customers", "delete", {
    group: "people",
  }),
  "customers.export": definePermission("customers", "export", {
    group: "people",
  }),
  "customers.manage": definePermission("customers", "manage", {
    group: "people",
    label: "Manage customers",
  }),

  "vendors.view": definePermission("vendors", "view", {
    group: "commerce",
  }),
  "vendors.create": definePermission("vendors", "create", {
    group: "commerce",
  }),
  "vendors.edit": definePermission("vendors", "edit", {
    group: "commerce",
  }),
  "vendors.delete": definePermission("vendors", "delete", {
    group: "commerce",
  }),

  "purchases.view": definePermission("purchases", "view", {
    group: "commerce",
  }),
  "purchases.create": definePermission("purchases", "create", {
    group: "commerce",
  }),
  "purchases.edit": definePermission("purchases", "edit", {
    group: "commerce",
  }),
  "purchases.delete": definePermission("purchases", "delete", {
    group: "commerce",
  }),
  "purchases.approve": definePermission("purchases", "approve", {
    group: "commerce",
    label: "Approve purchases",
  }),
  "purchases.manage": definePermission("purchases", "manage", {
    group: "commerce",
    label: "Manage purchases",
  }),

  "staff.view": definePermission("staff", "view", {
    group: "people",
  }),
  "staff.create": definePermission("staff", "create", {
    group: "people",
  }),
  "staff.edit": definePermission("staff", "edit", {
    group: "people",
  }),
  "staff.delete": definePermission("staff", "delete", {
    group: "people",
  }),
  "staff.manage": definePermission("staff", "manage", {
    group: "people",
    label: "Manage staff",
  }),

  "shifts.view": definePermission("shifts", "view", {
    group: "people",
  }),
  "shifts.create": definePermission("shifts", "create", {
    group: "people",
  }),
  "shifts.edit": definePermission("shifts", "edit", {
    group: "people",
  }),

  "attendance.view": definePermission("attendance", "view", {
    group: "people",
  }),
  "attendance.manage": definePermission("attendance", "manage", {
    group: "people",
    label: "Manage attendance",
  }),

  "reports.view": definePermission("reports", "view", {
    group: "insights",
  }),
  "reports.export": definePermission("reports", "export", {
    group: "insights",
  }),
  "reports.manage": definePermission("reports", "manage", {
    group: "insights",
  }),

  "analytics.view": definePermission("analytics", "view", {
    group: "insights",
    label: "View analytics",
  }),
  "analytics.manage": definePermission("analytics", "manage", {
    group: "insights",
    label: "Manage analytics",
  }),

  "users.view": definePermission("users", "view", {
    group: "administration",
  }),
  "users.create": definePermission("users", "create", {
    group: "administration",
  }),
  "users.edit": definePermission("users", "edit", {
    group: "administration",
  }),
  "users.delete": definePermission("users", "delete", {
    group: "administration",
  }),
  "users.assign": definePermission("users", "assign", {
    group: "administration",
  }),
  "users.manage": definePermission("users", "manage", {
    group: "administration",
  }),

  "roles.view": definePermission("roles", "view", {
    group: "administration",
    scope: "global",
  }),
  "roles.manage": definePermission("roles", "manage", {
    group: "administration",
    scope: "global",
  }),
  "roles.assign": definePermission("roles", "assign", {
    group: "administration",
  }),

  "settings.view": definePermission("settings", "view", {
    group: "administration",
  }),
  "settings.edit": definePermission("settings", "edit", {
    group: "administration",
  }),
  "settings.update": definePermission("settings", "update", {
    group: "administration",
    label: "Update settings",
  }),
  "settings.manage": definePermission("settings", "manage", {
    group: "administration",
  }),
  "settings.security": definePermission("settings", "security", {
    group: "administration",
    label: "Security settings",
  }),
  "settings.printers": definePermission("settings", "printers", {
    group: "administration",
    label: "Printer settings",
  }),
  "settings.devices": definePermission("settings", "devices", {
    group: "administration",
    label: "Device settings",
  }),
  "settings.branding": definePermission("settings", "branding", {
    group: "administration",
    label: "Branding settings",
  }),

  "subscription.view": definePermission("subscription", "view", {
    group: "administration",
    scope: "global",
  }),
  "subscription.manage": definePermission("subscription", "manage", {
    group: "administration",
    scope: "global",
  }),
  "subscription.update": definePermission("subscription", "update", {
    group: "administration",
    scope: "restaurant",
    label: "Update subscription",
  }),
  "plans.manage": definePermission("plans", "manage", {
    group: "administration",
    scope: "global",
    label: "Manage plans",
  }),

  "notifications.view": definePermission("notifications", "view", {
    group: "administration",
    scope: "restaurant",
    label: "View notifications",
  }),
  "notifications.manage": definePermission("notifications", "manage", {
    group: "administration",
    scope: "restaurant",
    label: "Manage notifications",
  }),
  "notifications.settings": definePermission("notifications", "settings", {
    group: "administration",
    scope: "own",
    label: "Notification preferences",
  }),
  "announcements.manage": definePermission("announcements", "manage", {
    group: "administration",
    scope: "restaurant",
    label: "Manage announcements",
  }),
  "activity.view": definePermission("activity", "view", {
    group: "administration",
    scope: "restaurant",
    label: "View activity feed",
  }),

  "admin.dashboard": definePermission("admin", "dashboard", {
    group: "administration",
    scope: "global",
    label: "Admin dashboard",
  }),
  "admin.restaurants": definePermission("admin", "restaurants", {
    group: "administration",
    scope: "global",
    label: "Manage restaurants",
  }),
  "admin.users": definePermission("admin", "users", {
    group: "administration",
    scope: "global",
    label: "Manage platform users",
  }),
  "admin.subscriptions": definePermission("admin", "subscriptions", {
    group: "administration",
    scope: "global",
    label: "Manage subscriptions",
  }),
  "admin.reports": definePermission("admin", "reports", {
    group: "administration",
    scope: "global",
    label: "Admin reports",
  }),
  "admin.audit": definePermission("admin", "audit", {
    group: "administration",
    scope: "global",
    label: "Audit logs",
  }),
  "admin.settings": definePermission("admin", "settings", {
    group: "administration",
    scope: "global",
    label: "Admin settings",
  }),
  "admin.system": definePermission("admin", "system", {
    group: "administration",
    scope: "global",
    label: "System health",
  }),

  /** Branch / outlet permissions — scope branch; enforcement is future work */
  "branches.view": definePermission("branches", "view", {
    group: "restaurant",
    scope: "branch",
    label: "View branches",
  }),
  "branches.create": definePermission("branches", "create", {
    group: "restaurant",
    scope: "restaurant",
    label: "Create branches",
  }),
  "branches.edit": definePermission("branches", "edit", {
    group: "restaurant",
    scope: "branch",
    label: "Edit branches",
  }),
  "branches.delete": definePermission("branches", "delete", {
    group: "restaurant",
    scope: "restaurant",
    label: "Delete branches",
  }),
  "branches.manage": definePermission("branches", "manage", {
    group: "restaurant",
    scope: "restaurant",
    label: "Manage branches",
  }),
  "branches.access": definePermission("branches", "access", {
    group: "restaurant",
    scope: "branch",
    label: "Access branch workspace",
  }),
  "branches.assign": definePermission("branches", "assign", {
    group: "restaurant",
    scope: "branch",
    label: "Assign branch staff",
  }),
} as const satisfies Record<string, PermissionDefinition>;

export type RegisteredPermissionKey = keyof typeof permissionRegistry;

export const permissionList: PermissionDefinition[] = Object.values(
  permissionRegistry
);

export function getPermission(
  key: string
): PermissionDefinition | undefined {
  return permissionRegistry[key as RegisteredPermissionKey];
}

export function isRegisteredPermission(key: string): key is PermissionKey {
  return Object.prototype.hasOwnProperty.call(permissionRegistry, key);
}
