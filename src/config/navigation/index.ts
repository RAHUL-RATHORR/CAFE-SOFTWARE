/**
 * Legacy-compatible navigation exports backed by the route registry.
 * Existing imports from `@/config/navigation` keep working.
 */

export type { NavItem } from "@/types/navigation";
export { DASHBOARD_HREF } from "@/config/routes";

import type { LucideIcon } from "lucide-react";
import type { NavItem } from "@/types/navigation";
import {
  getSidebarItems,
  findRouteByPath,
  isActiveRoute,
} from "@/lib/navigation";

/**
 * Flat sidebar items — same shape/order as the previous mainNavigation list.
 */
export const mainNavigation: NavItem[] = getSidebarItems()
  .filter((route) => Boolean(route.icon))
  .map((route) => ({
    title: route.pageTitle ?? route.breadcrumbTitle ?? route.name,
    href: route.path,
    icon: route.icon as LucideIcon,
  }));

export function getNavItemByHref(pathname: string): NavItem | undefined {
  const route = findRouteByPath(pathname);
  if (route?.icon) {
    return {
      title: route.pageTitle ?? route.breadcrumbTitle ?? route.name,
      href: route.path,
      icon: route.icon,
    };
  }

  return mainNavigation.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return isActiveRoute(pathname, href);
}

export { navigationGroups, getNavigationGroup } from "./groups";
export {
  topNavigation,
  quickActionsNavigation,
  footerNavigation,
  userMenuNavigation,
  settingsMenuNavigation,
  helpMenuNavigation,
  adminMenuNavigation,
  navigationMenus,
} from "./menus";

export { APP_ROLES, APP_ROLE_LABELS } from "./roles";
