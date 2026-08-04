import { routeList, routeRegistry, DASHBOARD_HREF } from "@/config/routes";
import type {
  BreadcrumbItem,
  MenuItem,
  NavigationVisibilityContext,
  RouteConfig,
} from "@/types/navigation";

const SIDEBAR_ORDER = [
  "dashboard",
  "categories",
  "menu-items",
  "tables",
  "orders",
  "kitchen",
  "billing",
  "customers",
  "vendors",
  "purchases",
  "staff",
  "shifts",
  "reports",
  "notifications",
  "announcements",
  "activity",
  "subscription",
  "settings",
  "admin",
] as const;

export function findRoute(name: string): RouteConfig | undefined {
  return routeList.find((route) => route.name === name);
}

export function findRouteByPath(pathname: string): RouteConfig | undefined {
  const exact = routeList.find((route) => route.path === pathname);
  if (exact) return exact;

  const matches = routeList
    .filter(
      (route) =>
        pathname === route.path || pathname.startsWith(`${route.path}/`)
    )
    .sort((a, b) => b.path.length - a.path.length);

  return matches[0];
}

export function findParent(routeName: string): RouteConfig | undefined {
  const route = findRoute(routeName);
  if (!route?.parent) return undefined;
  return findRoute(route.parent);
}

export function getRouteChildren(routeName: string): RouteConfig[] {
  const route = findRoute(routeName);
  if (!route?.children?.length) return [];
  return route.children
    .map((name) => findRoute(name))
    .filter((item): item is RouteConfig => Boolean(item));
}

/**
 * Permission-ready filter — placeholder only.
 * Always returns true until auth is implemented.
 */
export function matchesPermission(
  _permission: RouteConfig["permission"] | MenuItem["permission"],
  _context?: NavigationVisibilityContext
): boolean {
  return true;
}

/**
 * Feature-flag-ready filter — placeholder only.
 * Uses defaultEnabled when provided; otherwise visible.
 */
export function matchesFeatureFlag(
  flag: RouteConfig["featureFlag"] | MenuItem["featureFlag"],
  context?: NavigationVisibilityContext
): boolean {
  if (!flag) return true;
  if (context?.featureFlags && flag.flag in context.featureFlags) {
    return Boolean(context.featureFlags[flag.flag]);
  }
  return flag.defaultEnabled ?? true;
}

export function isRouteVisible(
  route: RouteConfig,
  context?: NavigationVisibilityContext
): boolean {
  return matchesPermission(route.permission, context) && matchesFeatureFlag(route.featureFlag, context);
}

export function getVisibleRoutes(
  context?: NavigationVisibilityContext,
  options?: { navigation?: boolean; sidebar?: boolean; tabs?: boolean }
): RouteConfig[] {
  return routeList.filter((route) => {
    if (!isRouteVisible(route, context)) return false;
    if (options?.navigation && route.showInNavigation === false) return false;
    if (options?.sidebar && route.showInSidebar === false) return false;
    if (options?.tabs && route.showInTabs === false) return false;
    return true;
  });
}

export function getSidebarItems(
  context?: NavigationVisibilityContext
): RouteConfig[] {
  const visible = getVisibleRoutes(context, { sidebar: true }).filter(
    (route) => route.showInSidebar !== false
  );

  const byName = new Map(visible.map((route) => [route.name, route]));
  const ordered: RouteConfig[] = [];

  for (const name of SIDEBAR_ORDER) {
    const route = byName.get(name);
    if (route) {
      ordered.push(route);
      byName.delete(name);
    }
  }

  for (const route of byName.values()) {
    ordered.push(route);
  }

  return ordered;
}

export function getTabRoutes(
  context?: NavigationVisibilityContext
): RouteConfig[] {
  return getVisibleRoutes(context, { tabs: true }).filter(
    (route) => route.showInTabs !== false
  );
}

export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type GenerateBreadcrumbsOptions = {
  /** Override the final crumb label */
  customTitle?: string;
  /** Include dashboard/home link when not already on dashboard */
  includeHome?: boolean;
  homeLabel?: string;
  homeHref?: string;
  /** Include icons from route registry */
  includeIcons?: boolean;
  /** Future: map of dynamic segment → label */
  params?: Record<string, string>;
};

function humanizeSegment(segment: string, params?: Record<string, string>) {
  if (params?.[segment]) return params[segment];
  if (segment.startsWith("[") && segment.endsWith("]")) {
    const key = segment.slice(1, -1);
    return params?.[key] ?? key;
  }
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Generates breadcrumb items for a pathname using the route registry.
 * Supports nested parent chains and custom titles.
 */
export function generateBreadcrumbs(
  pathname: string,
  options: GenerateBreadcrumbsOptions = {}
): BreadcrumbItem[] {
  const {
    customTitle,
    includeHome = true,
    homeLabel = "Dashboard",
    homeHref = DASHBOARD_HREF,
    includeIcons = false,
    params,
  } = options;

  const crumbs: BreadcrumbItem[] = [];
  const matched = findRouteByPath(pathname);
  const isHome =
    pathname === homeHref || pathname.startsWith(`${homeHref}/`);

  if (includeHome) {
    crumbs.push({
      label: homeLabel,
      href: isHome && !matched?.parent && pathname === homeHref ? undefined : homeHref,
      current: pathname === homeHref && !customTitle,
      icon: includeIcons ? routeRegistry.dashboard.icon : undefined,
    });
  }

  if (pathname === homeHref || pathname === "/") {
    if (customTitle && crumbs[0]) {
      crumbs[0] = { ...crumbs[0], label: customTitle, current: true, href: undefined };
    }
    return crumbs;
  }

  // Build parent chain from registry when available
  if (matched) {
    const chain: RouteConfig[] = [];
    let current: RouteConfig | undefined = matched;
    const guard = new Set<string>();

    while (current) {
      if (guard.has(current.name)) break;
      guard.add(current.name);
      chain.unshift(current);
      current = current.parent ? findRoute(current.parent) : undefined;
    }

    for (const route of chain) {
      if (route.path === homeHref) continue;

      const isLast = route.name === matched.name;
      crumbs.push({
        label:
          isLast && customTitle
            ? customTitle
            : route.breadcrumbTitle ?? route.pageTitle ?? route.name,
        href: isLast ? undefined : route.path,
        current: isLast,
        icon: includeIcons ? route.icon : undefined,
      });
    }

    return crumbs;
  }

  // Fallback: path segments for unregistered nested routes
  const segments = pathname.split("/").filter(Boolean);
  let acc = "";
  segments.forEach((segment, index) => {
    acc += `/${segment}`;
    if (acc === homeHref) return;
    const isLast = index === segments.length - 1;
    crumbs.push({
      label:
        isLast && customTitle
          ? customTitle
          : humanizeSegment(segment, params),
      href: isLast ? undefined : acc,
      current: isLast,
    });
  });

  return crumbs;
}

export function filterMenuItems(
  items: MenuItem[],
  context?: NavigationVisibilityContext
): MenuItem[] {
  return items.filter(
    (item) =>
      matchesPermission(item.permission, context) &&
      matchesFeatureFlag(item.featureFlag, context)
  );
}

export function resolveMenuItemHref(item: MenuItem): string | undefined {
  if (item.href) return item.href;
  if (item.route) return findRoute(item.route)?.path;
  return undefined;
}
