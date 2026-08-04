import type { LucideIcon } from "lucide-react";

/** Placeholder roles — no auth logic */
export type AppRole =
  | "super-admin"
  | "restaurant-owner"
  | "manager"
  | "cashier"
  | "chef"
  | "waiter"
  | "customer";

/** Permission architecture placeholder only */
export type PermissionPlaceholder = {
  roles?: AppRole[];
  permissions?: string[];
  /** Future: require all vs any */
  mode?: "any" | "all";
};

/** Feature flag architecture placeholder only */
export type FeatureFlagPlaceholder = {
  flag: string;
  /** When unset, treat as visible (no real flag evaluation) */
  defaultEnabled?: boolean;
};

export type NavigationGroupId =
  | "dashboard"
  | "restaurant"
  | "operations"
  | "management"
  | "reports"
  | "administration"
  | "settings";

export type PageMetadataConfig = {
  title: string;
  description?: string;
  /** Keywords placeholder — not wired to SEO engines yet */
  keywords?: string[];
  breadcrumbTitle?: string;
  openGraph?: {
    title?: string;
    description?: string;
    images?: string[];
  };
};

export type RouteConfig = {
  name: string;
  path: string;
  icon?: LucideIcon;
  parent?: string | null;
  children?: string[];
  description?: string;
  breadcrumbTitle?: string;
  pageTitle?: string;
  /** SEO title placeholder */
  seoTitle?: string;
  permission?: PermissionPlaceholder;
  featureFlag?: FeatureFlagPlaceholder;
  showInNavigation?: boolean;
  showInSidebar?: boolean;
  showInTabs?: boolean;
  group?: NavigationGroupId;
  metadata?: PageMetadataConfig;
  /** Future extensibility bag */
  meta?: Record<string, unknown>;
};

export type NavigationGroup = {
  id: NavigationGroupId;
  label: string;
  description?: string;
  /** Route names belonging to this group */
  routes: string[];
  order: number;
};

export type MenuItem = {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  description?: string;
  /** Route name reference when linked to registry */
  route?: string;
  children?: MenuItem[];
  permission?: PermissionPlaceholder;
  featureFlag?: FeatureFlagPlaceholder;
  disabled?: boolean;
  external?: boolean;
  dividerAfter?: boolean;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
  icon?: LucideIcon;
  /** True when this is the current page crumb */
  current?: boolean;
};

/** Legacy sidebar/nav shape — kept for existing consumers */
export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type NavigationVisibilityContext = {
  /** Placeholder — unused until auth exists */
  roles?: AppRole[];
  /** Placeholder — unused until flags exist */
  featureFlags?: Record<string, boolean>;
};
