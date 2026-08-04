/**
 * Super Admin / platform control plane types.
 */

export const TENANT_PLATFORM_STATUSES = [
  "active",
  "suspended",
  "inactive",
] as const;

export type TenantPlatformStatus = (typeof TENANT_PLATFORM_STATUSES)[number];

export const AUDIT_EVENT_CATEGORIES = [
  "login",
  "subscription",
  "restaurant",
  "user",
  "role",
  "system",
  "feature-flag",
] as const;

export type AuditEventCategory = (typeof AUDIT_EVENT_CATEGORIES)[number];

export const FEATURE_FLAG_SCOPES = [
  "global",
  "plan",
  "tenant",
  "beta",
  "early-access",
] as const;

export type FeatureFlagScope = (typeof FEATURE_FLAG_SCOPES)[number];

export type AdminTenantSummary = {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  isActive: boolean;
  platformStatus: TenantPlatformStatus;
  subscriptionPlan: string;
  subscriptionStatus: string;
  saasPlanName: string | null;
  saasStatus: string | null;
  branchCount: number;
  userCount: number;
  orderCount: number;
  storageUsage: number;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminTenantDetail = AdminTenantSummary & {
  address: string;
  state: string;
  currency: string;
  timezone: string;
  featureUsage: string[];
  licenseKey: string | null;
  renewalDate: string | null;
  trialEnd: string | null;
};

export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  restaurantId: string | null;
  restaurantName: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminAuditLog = {
  id: string;
  category: AuditEventCategory;
  action: string;
  message: string;
  actorId: string | null;
  actorEmail: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  /** Change / request context placeholders (sourced from metadata when present) */
  oldValuePlaceholder?: unknown;
  newValuePlaceholder?: unknown;
  ipPlaceholder?: string | null;
  devicePlaceholder?: string | null;
  createdAt: string;
};

export type PlatformFeatureFlag = {
  id: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  scope: FeatureFlagScope;
  planSlug: string | null;
  restaurantId: string | null;
  moduleKey: string;
  isBeta: boolean;
  isEarlyAccess: boolean;
  updatedAt: string;
};

export type AdminDashboardSummary = {
  totalRestaurants: number;
  activeRestaurants: number;
  trialRestaurants: number;
  expiredSubscriptions: number;
  monthlyRevenue: number;
  annualRevenue: number;
  ordersToday: number;
  usersOnlinePlaceholder: number;
  apiUsagePlaceholder: number;
  systemStatus: "healthy" | "degraded" | "down";
  recentActivities: AdminAuditLog[];
  latestSignups: AdminTenantSummary[];
  revenueChart: Array<{ label: string; value: number }>;
  subscriptionDistribution: Array<{ label: string; value: number }>;
};

export type AdminRevenueSummary = {
  monthlyRevenue: number;
  annualRevenue: number;
  paidInvoices: number;
  openInvoices: number;
  revenueByMonth: Array<{ label: string; value: number }>;
  revenueByPlan: Array<{ label: string; value: number }>;
};

export type AdminSystemHealth = {
  databaseStatus: "ok" | "error" | "unknown";
  applicationStatus: "ok" | "degraded";
  storageStatusPlaceholder: "ok" | "unknown";
  errorRatePlaceholder: number;
  serverUptimePlaceholder: string;
  latestDeploymentsPlaceholder: Array<{
    id: string;
    label: string;
    at: string;
  }>;
  checkedAt: string;
};

export type AdminGlobalReport = {
  kind:
    | "revenue"
    | "tenant-growth"
    | "subscription-growth"
    | "user-growth"
    | "restaurant-growth"
    | "platform-usage"
    | "storage-usage"
    | "api-usage";
  title: string;
  description: string;
  kpis: Array<{ id: string; title: string; value: string }>;
  series: Array<{ label: string; value: number }>;
};

export type AdminSearchResult = {
  id: string;
  type:
    | "restaurant"
    | "user"
    | "plan"
    | "subscription"
    | "audit"
    | "setting";
  title: string;
  subtitle: string;
  href: string;
};

export type AdminActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR";

export type AdminActionError = {
  code: AdminActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type AdminActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: AdminActionError };
