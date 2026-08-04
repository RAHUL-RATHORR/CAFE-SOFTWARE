import type { RoutePermissionBinding } from "@/types/rbac";

/**
 * Maps app routes to required permissions.
 * Compatible with the existing route registry — does not mutate it.
 */
export const routePermissionBindings: RoutePermissionBinding[] = [
  {
    routeName: "dashboard",
    path: "/dashboard",
    permissions: ["dashboard.view", "dashboard.access"],
    mode: "any",
  },
  {
    routeName: "categories",
    path: "/categories",
    permissions: ["categories.view"],
  },
  {
    routeName: "menu-items",
    path: "/menu-items",
    permissions: ["menu-items.view"],
  },
  {
    routeName: "tables",
    path: "/tables",
    permissions: ["tables.view"],
  },
  {
    routeName: "orders",
    path: "/orders",
    permissions: ["orders.view"],
  },
  {
    routeName: "kitchen",
    path: "/kitchen",
    permissions: ["kitchen.view"],
  },
  {
    routeName: "billing",
    path: "/billing",
    permissions: ["billing.view"],
  },
  {
    routeName: "customers",
    path: "/customers",
    permissions: ["customers.view"],
  },
  {
    routeName: "vendors",
    path: "/vendors",
    permissions: ["vendors.view"],
  },
  {
    routeName: "purchases",
    path: "/purchases",
    permissions: ["purchases.view"],
  },
  {
    routeName: "staff",
    path: "/staff",
    permissions: ["staff.view", "staff.manage"],
    mode: "any",
  },
  {
    routeName: "shifts",
    path: "/shifts",
    permissions: ["shifts.view", "staff.view", "staff.manage"],
    mode: "any",
  },
  {
    routeName: "reports",
    path: "/reports",
    permissions: ["reports.view", "analytics.view"],
    mode: "any",
  },
  {
    routeName: "settings",
    path: "/settings",
    permissions: [
      "settings.view",
      "settings.update",
      "settings.edit",
      "settings.manage",
    ],
    mode: "any",
  },
  {
    routeName: "settings-security",
    path: "/settings/security",
    permissions: ["settings.security", "settings.manage"],
    mode: "any",
  },
  {
    routeName: "settings-printers",
    path: "/settings/printers",
    permissions: ["settings.printers", "settings.manage"],
    mode: "any",
  },
  {
    routeName: "settings-devices",
    path: "/settings/devices",
    permissions: ["settings.devices", "settings.manage"],
    mode: "any",
  },
  {
    routeName: "settings-branding",
    path: "/settings/branding",
    permissions: ["settings.branding", "settings.manage"],
    mode: "any",
  },
  {
    routeName: "subscription",
    path: "/subscription",
    permissions: ["subscription.view", "subscription.manage"],
    mode: "any",
  },
  {
    routeName: "settings-branches",
    path: "/settings/branches",
    permissions: ["branches.view", "branches.access", "settings.view"],
    mode: "any",
  },
  {
    routeName: "notifications",
    path: "/notifications",
    permissions: ["notifications.view", "notifications.manage"],
    mode: "any",
  },
  {
    routeName: "announcements",
    path: "/announcements",
    permissions: ["notifications.view", "announcements.manage"],
    mode: "any",
  },
  {
    routeName: "activity",
    path: "/activity",
    permissions: ["activity.view"],
  },
  {
    routeName: "administration",
    path: "/administration",
    permissions: ["admin.dashboard", "roles.manage", "users.manage"],
    roles: ["super-admin"],
    mode: "any",
  },
  {
    routeName: "admin",
    path: "/admin",
    permissions: ["admin.dashboard"],
    roles: ["super-admin"],
    mode: "any",
  },
  {
    routeName: "restaurant",
    path: "/restaurant",
    permissions: ["restaurant.view"],
  },
];

export function getRoutePermissionBinding(
  pathOrName: string
): RoutePermissionBinding | undefined {
  return routePermissionBindings.find(
    (binding) =>
      binding.path === pathOrName ||
      binding.routeName === pathOrName ||
      (binding.path != null &&
        (pathOrName === binding.path ||
          pathOrName.startsWith(`${binding.path}/`)))
  );
}
