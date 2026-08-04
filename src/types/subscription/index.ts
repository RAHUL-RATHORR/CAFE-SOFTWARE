/**
 * SaaS Subscription & License domain types.
 * Distinct from Restaurant.subscriptionPlan enum (legacy scaffold).
 */

export const SAAS_SUBSCRIPTION_STATUSES = [
  "trial",
  "active",
  "expired",
  "suspended",
  "cancelled",
  "pending",
] as const;

export type SaasSubscriptionStatus = (typeof SAAS_SUBSCRIPTION_STATUSES)[number];

export const BILLING_CYCLES = ["monthly", "yearly"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const SAAS_FEATURE_KEYS = [
  "dashboard",
  "orders",
  "kitchen",
  "billing",
  "pos",
  "inventory",
  "crm",
  "reports",
  "staff",
  "purchases",
  "qr-ordering",
  "online-ordering",
  "api-access",
  "custom-branding",
  "advanced-analytics",
] as const;

export type SaasFeatureKey = (typeof SAAS_FEATURE_KEYS)[number];

export const USAGE_METRIC_KEYS = [
  "users",
  "branches",
  "orders",
  "storage",
  "apiRequests",
  "menuItems",
  "customers",
  "inventoryItems",
] as const;

export type UsageMetricKey = (typeof USAGE_METRIC_KEYS)[number];

export const INVOICE_FOUNDATION_STATUSES = [
  "draft",
  "open",
  "paid",
  "void",
  "refunded",
] as const;

export type InvoiceFoundationStatus =
  (typeof INVOICE_FOUNDATION_STATUSES)[number];

/** Catalog subscription plan */
export type SubscriptionPlanEntity = {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  trialDays: number;
  maxBranches: number;
  maxUsers: number;
  maxOrdersPerMonth: number;
  maxMenuItems: number;
  maxTables: number;
  storageLimit: number;
  features: SaasFeatureKey[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RestaurantSubscription = {
  id: string;
  restaurantId: string;
  planId: string;
  planName: string;
  planSlug: string;
  status: SaasSubscriptionStatus;
  billingCycle: BillingCycle;
  trialStart: string | null;
  trialEnd: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  renewalDate: string | null;
  cancelledAt: string | null;
  licenseKey: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UsageMetrics = {
  id: string;
  restaurantId: string;
  periodKey: string;
  users: number;
  branches: number;
  orders: number;
  storage: number;
  apiRequests: number;
  menuItems: number;
  customers: number;
  inventoryItems: number;
  updatedAt: string;
};

export type InvoiceFoundation = {
  id: string;
  restaurantId: string;
  subscriptionId: string | null;
  planId: string | null;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: InvoiceFoundationStatus;
  billingCycle: BillingCycle;
  periodStart: string | null;
  periodEnd: string | null;
  /** FUTURE — payment gateway */
  paymentPlaceholder: string;
  /** FUTURE — refund */
  refundPlaceholder: string;
  /** FUTURE — coupon */
  couponPlaceholder: string;
  /** FUTURE — tax */
  taxPlaceholder: number;
  issuedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeatureAccess = {
  id: string;
  restaurantId: string;
  features: SaasFeatureKey[];
  overrides: Partial<Record<SaasFeatureKey, boolean>>;
  updatedAt: string;
};

export type TenantLimitSnapshot = {
  maxBranches: number;
  maxUsers: number;
  maxOrdersPerMonth: number;
  maxMenuItems: number;
  maxTables: number;
  storageLimit: number;
};

export type LimitCheckResult = {
  metric: UsageMetricKey | "tables" | "feature";
  limit: number;
  used: number;
  remaining: number;
  /** Enforcement not active — always informational for now */
  wouldBlock: boolean;
  message: string;
};

export type LicenseValidationResult = {
  valid: boolean;
  status: SaasSubscriptionStatus | "missing";
  licenseKey: string | null;
  daysRemaining: number | null;
  reason: string;
};

export type SubscriptionDashboardSummary = {
  currentPlan: SubscriptionPlanEntity | null;
  subscription: RestaurantSubscription | null;
  daysRemaining: number | null;
  renewalDate: string | null;
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  featureAccess: FeatureAccess | null;
  recentInvoices: InvoiceFoundation[];
  upgradeAvailable: boolean;
};

export type SubscriptionActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_PLAN"
  | "NO_SUBSCRIPTION"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type SubscriptionActionError = {
  code: SubscriptionActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type SubscriptionActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: SubscriptionActionError };
