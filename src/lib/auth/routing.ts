import {
  ADMIN_ROUTE_PREFIXES,
  GUEST_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
  PUBLIC_ROUTES,
  RESTAURANT_ROUTE_PREFIXES,
} from "@/lib/auth/constants";
import type { AuthRouteKind, RouteProtectionConfig } from "@/types/auth";

function matchesPath(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isGuestRoute(pathname: string): boolean {
  return GUEST_ROUTES.some((route) => matchesPath(pathname, route));
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    matchesPath(pathname, prefix)
  );
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => matchesPath(pathname, route));
}

export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTE_PREFIXES.some((prefix) => matchesPath(pathname, prefix));
}

export function isRestaurantRoute(pathname: string): boolean {
  return RESTAURANT_ROUTE_PREFIXES.some((prefix) =>
    matchesPath(pathname, prefix)
  );
}

export function getRouteKind(pathname: string): AuthRouteKind {
  if (isPublicRoute(pathname)) return "public";
  if (isGuestRoute(pathname)) return "guest";
  if (isAdminRoute(pathname)) return "admin";
  if (isRestaurantRoute(pathname)) return "restaurant";
  if (isProtectedRoute(pathname)) return "protected";
  return "public";
}

/**
 * Route protection metadata. Roles/permissions are placeholders only.
 */
export function getRouteProtection(
  pathname: string
): RouteProtectionConfig {
  const kind = getRouteKind(pathname);

  if (kind === "admin") {
    return {
      kind,
      roles: ["super-admin"],
      permissions: undefined,
    };
  }

  if (kind === "restaurant") {
    return {
      kind,
      roles: ["restaurant-owner", "manager", "cashier", "chef", "waiter"],
      permissions: undefined,
    };
  }

  return {
    kind,
    roles: undefined,
    permissions: undefined,
  };
}

export function getSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!callbackUrl) return fallback;
  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return fallback;
  }
  return callbackUrl;
}
