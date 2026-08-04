import type { AppRole } from "@/types/navigation";

export type RbacRole = AppRole;

export type RbacResource =
  | "dashboard"
  | "restaurant"
  | "categories"
  | "menu-items"
  | "tables"
  | "orders"
  | "kitchen"
  | "billing"
  | "customers"
  | "vendors"
  | "purchases"
  | "staff"
  | "shifts"
  | "attendance"
  | "reports"
  | "analytics"
  | "users"
  | "roles"
  | "settings"
  | "subscription"
  | "plans"
  | "branches"
  | "admin"
  | "notifications"
  | "announcements"
  | "activity";

export type RbacAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "import"
  | "manage"
  | "approve"
  | "assign"
  | "access"
  | "changeStatus"
  | "update"
  | "complete"
  | "refund"
  | "print"
  | "dashboard"
  | "restaurants"
  | "users"
  | "subscriptions"
  | "reports"
  | "audit"
  | "settings"
  | "system"
  | "security"
  | "printers"
  | "devices"
  | "branding";

/** Access scope — branch/custom roles prepared for future multi-branch SaaS */
export type RbacScope =
  | "global"
  | "restaurant"
  | "branch"
  | "own";

export type PermissionKey = `${RbacResource}.${RbacAction}`;

export type PermissionDefinition = {
  key: PermissionKey;
  resource: RbacResource;
  action: RbacAction;
  scope: RbacScope;
  label: string;
  description?: string;
  group: PermissionGroupId;
};

export type PermissionGroupId =
  | "overview"
  | "restaurant"
  | "operations"
  | "commerce"
  | "people"
  | "insights"
  | "administration";

export type PermissionGroup = {
  id: PermissionGroupId;
  label: string;
  description?: string;
  permissions: PermissionKey[];
};

export type RolePermissionMap = Record<RbacRole, readonly PermissionKey[] | readonly ["*"]>;

export type RbacContext = {
  role?: RbacRole | null;
  /** Future: active restaurant tenant */
  restaurantId?: string | null;
  /** Future: branch-level scope */
  branchId?: string | null;
  /** Future: custom role permission overrides */
  customPermissions?: PermissionKey[];
  /** Future: subscription plan gates */
  subscriptionPlan?: string | null;
  /** Future: feature flags */
  featureFlags?: Record<string, boolean>;
};

export type VisibilityTarget =
  | "route"
  | "menu"
  | "sidebar"
  | "feature"
  | "button"
  | "page";

export type RoutePermissionBinding = {
  routeName?: string;
  path?: string;
  permissions?: PermissionKey[];
  roles?: RbacRole[];
  /** any = one permission; all = every permission */
  mode?: "any" | "all";
};
