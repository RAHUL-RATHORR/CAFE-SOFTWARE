import type {
  TenantPlatformStatus,
  AuditEventCategory,
  FeatureFlagScope,
} from "@/types/admin";

export const TENANT_PLATFORM_STATUS_LABELS: Record<
  TenantPlatformStatus,
  string
> = {
  active: "Active",
  suspended: "Suspended",
  inactive: "Inactive",
};

export const TENANT_PLATFORM_STATUS_VARIANTS: Record<
  TenantPlatformStatus,
  "success" | "warning" | "secondary"
> = {
  active: "success",
  suspended: "warning",
  inactive: "secondary",
};

export const AUDIT_CATEGORY_LABELS: Record<AuditEventCategory, string> = {
  login: "Login",
  subscription: "Subscription",
  restaurant: "Restaurant",
  user: "User",
  role: "Role",
  system: "System",
  "feature-flag": "Feature flag",
};

export const FEATURE_FLAG_SCOPE_LABELS: Record<FeatureFlagScope, string> = {
  global: "Global",
  plan: "Per plan",
  tenant: "Per tenant",
  beta: "Beta",
  "early-access": "Early access",
};

export const DEFAULT_PLATFORM_FEATURE_FLAGS = [
  {
    key: "module.orders",
    label: "Orders module",
    description: "Enable orders across the platform",
    moduleKey: "orders",
    scope: "global" as const,
    enabled: true,
    isBeta: false,
    isEarlyAccess: false,
  },
  {
    key: "module.kitchen",
    label: "Kitchen module",
    description: "Enable kitchen display",
    moduleKey: "kitchen",
    scope: "global" as const,
    enabled: true,
    isBeta: false,
    isEarlyAccess: false,
  },
  {
    key: "module.staff",
    label: "Staff module",
    description: "Enable staff & shifts",
    moduleKey: "staff",
    scope: "global" as const,
    enabled: true,
    isBeta: false,
    isEarlyAccess: false,
  },
  {
    key: "module.purchases",
    label: "Purchases module",
    description: "Enable procurement",
    moduleKey: "purchases",
    scope: "global" as const,
    enabled: true,
    isBeta: false,
    isEarlyAccess: false,
  },
  {
    key: "beta.qr-ordering",
    label: "QR Ordering (beta)",
    description: "Beta QR table ordering",
    moduleKey: "qr-ordering",
    scope: "beta" as const,
    enabled: false,
    isBeta: true,
    isEarlyAccess: false,
  },
  {
    key: "early.api-access",
    label: "API Access (early)",
    description: "Early access public API",
    moduleKey: "api-access",
    scope: "early-access" as const,
    enabled: false,
    isBeta: false,
    isEarlyAccess: true,
  },
  {
    key: "admin-console",
    label: "Admin console",
    description: "Super admin panel visibility",
    moduleKey: "admin",
    scope: "global" as const,
    enabled: true,
    isBeta: false,
    isEarlyAccess: false,
  },
] as const;

export const ADMIN_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", permission: "admin.dashboard" },
  { href: "/admin/restaurants", label: "Restaurants", permission: "admin.restaurants" },
  { href: "/admin/users", label: "Users", permission: "admin.users" },
  { href: "/admin/subscriptions", label: "Subscriptions", permission: "admin.subscriptions" },
  { href: "/admin/plans", label: "Plans", permission: "admin.subscriptions" },
  { href: "/admin/revenue", label: "Revenue", permission: "admin.reports" },
  { href: "/admin/reports", label: "Reports", permission: "admin.reports" },
  { href: "/admin/system", label: "System", permission: "admin.system" },
  { href: "/admin/audit", label: "Audit", permission: "admin.audit" },
  { href: "/admin/settings", label: "Settings", permission: "admin.settings" },
] as const;
