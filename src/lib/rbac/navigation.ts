import { getRoutePermissionBinding } from "@/config/permissions";
import { canAccess, hasPermission, hasRole } from "@/lib/rbac/helpers";
import type { RouteConfig } from "@/types/navigation";
import type { NavItem } from "@/types/navigation";
import type { AppRole } from "@/types/navigation";
import type { RbacContext, RbacResource } from "@/types/rbac";

/**
 * Permission-aware route access check for the existing route registry.
 */
export function canAccessRoute(
  role: AppRole | null | undefined,
  pathOrName: string,
  context?: RbacContext
): boolean {
  const binding = getRoutePermissionBinding(pathOrName);
  if (!binding) {
    return Boolean(role);
  }

  if (binding.roles?.length && !hasRole(role, binding.roles)) {
    return false;
  }

  if (!binding.permissions?.length) {
    return Boolean(role);
  }

  return hasPermission(role, binding.permissions, {
    mode: binding.mode ?? "any",
    context,
  });
}

/**
 * Filters registry routes for sidebar / menu visibility.
 * Does not mutate the source list.
 */
export function filterRoutesByRole(
  routes: RouteConfig[],
  role: AppRole | null | undefined,
  context?: RbacContext
): RouteConfig[] {
  return routes.filter((route) => {
    if (route.showInSidebar === false && route.showInNavigation === false) {
      return false;
    }
    return canAccessRoute(role, route.name, context) ||
      canAccessRoute(role, route.path, context);
  });
}

/**
 * Filters legacy NavItem[] (mainNavigation) by RBAC.
 */
export function filterNavItemsByRole(
  items: NavItem[],
  role: AppRole | null | undefined,
  context?: RbacContext
): NavItem[] {
  return items.filter((item) => canAccessRoute(role, item.href, context));
}

/**
 * Maps a route path segment to an RBAC resource when possible.
 */
export function resourceFromPath(pathname: string): RbacResource | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  const map: Record<string, RbacResource> = {
    dashboard: "dashboard",
    categories: "categories",
    "menu-items": "menu-items",
    tables: "tables",
    orders: "orders",
    kitchen: "kitchen",
    billing: "billing",
    customers: "customers",
    vendors: "vendors",
    purchases: "purchases",
    staff: "staff",
    shifts: "shifts",
    reports: "reports",
    subscription: "subscription",
    admin: "admin",
    analytics: "analytics",
    settings: "settings",
    restaurant: "restaurant",
    administration: "admin",
  };
  return segment ? map[segment] ?? null : null;
}

export function canAccessPathResource(
  role: AppRole | null | undefined,
  pathname: string,
  context?: RbacContext
): boolean {
  if (canAccessRoute(role, pathname, context)) return true;
  const resource = resourceFromPath(pathname);
  if (!resource) return Boolean(role);
  return canAccess(role, resource, context);
}
