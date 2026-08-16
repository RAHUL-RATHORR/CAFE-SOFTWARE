/**
 * SaaS Subscription & License domain types.
 * Distinct from Restaurant.subscriptionPlan enum (legacy scaffold).
 */

/** Canonical plan identifiers — never hard-code plan names in UI/actions. */
export const PLAN_IDS = [
  "FREE_TRIAL",
  "BASIC",
  "PRO",
  "PREMIUM",
] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export const PLAN_SLUGS = [
  "free-trial",
  "basic",
  "pro",
  "premium",
] as const;

export type PlanSlug = (typeof PLAN_SLUGS)[number];

/**
 * Canonical subscription statuses.
 * Legacy DB values `trial` and `pending` normalize to `trialing` / `pending`.
 */
export const SAAS_SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "grace_period",
  "cancelled",
  "expired",
  "suspended",
  "pending",
  /** @deprecated Prefer `trialing` — kept for migration-safe reads */
  "trial",
] as const;

export type SaasSubscriptionStatus = (typeof SAAS_SUBSCRIPTION_STATUSES)[number];

export const CANONICAL_SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "grace_period",
  "cancelled",
  "expired",
  "suspended",
] as const;

export type CanonicalSubscriptionStatus =
  (typeof CANONICAL_SUBSCRIPTION_STATUSES)[number];

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
  "tables",
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

export const PAYMENT_PROVIDER_STATUSES = [
  "not_configured",
  "pending",
  "requires_action",
  "succeeded",
  "failed",
] as const;

export type PaymentProviderStatus =
  (typeof PAYMENT_PROVIDER_STATUSES)[number];

/** Catalog subscription plan */
export type SubscriptionPlanEntity = {
  id: string;
  /** Immutable catalog key when known (FREE_TRIAL | BASIC | PRO | PREMIUM) */
  planKey: PlanId | null;
  name: string;
  displayName: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  trialDays: number;
  maxBranches: number;
  maxStaff: number;
  /** @deprecated Prefer maxStaff — alias for staff seats */
  maxUsers: number;
  maxOrdersPerMonth: number;
  maxMenuItems: number;
  maxTables: number;
  maxCustomers: number;
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

export type PendingPlanChange = {
  planId: string;
  mode: "upgrade" | "downgrade";
  billingCycle: BillingCycle | null;
  scheduledFor: string | null;
  reason: string | null;
};

export type RestaurantSubscription = {
  id: string;
  restaurantId: string;
  planId: string;
  planName: string;
  planSlug: string;
  status: SaasSubscriptionStatus;
  /** Normalized status for UI/policy (trial → trialing) */
  effectiveStatus: CanonicalSubscriptionStatus | "pending";
  billingCycle: BillingCycle;
  startDate: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  /** Aliases kept for backward-compatible consumers */
  trialStart: string | null;
  trialEnd: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  gracePeriodEnd: string | null;
  renewalDate: string | null;
  cancelledAt: string | null;
  cancelAtPeriodEnd: boolean;
  pendingPlanChange: PendingPlanChange | null;
  /** Provider reference placeholders — no real payment yet */
  provider: string | null;
  providerSubscriptionId: string | null;
  paymentStatus: PaymentProviderStatus;
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
  tables: number;
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
  maxStaff: number;
  maxUsers: number;
  maxOrdersPerMonth: number;
  maxMenuItems: number;
  maxTables: number;
  maxCustomers: number;
  storageLimit: number;
};

export type LimitCheckResult = {
  metric: UsageMetricKey | "feature";
  label: string;
  limit: number;
  used: number;
  remaining: number;
  wouldBlock: boolean;
  message: string;
};

export type PlanLimitExceededDetails = {
  code: "PLAN_LIMIT_REACHED";
  message: string;
  currentPlan: string;
  metric: LimitCheckResult["metric"];
  used: number;
  limit: number;
  upgradePath: string;
};

export type LicenseValidationResult = {
  valid: boolean;
  status: SaasSubscriptionStatus | "missing";
  effectiveStatus: CanonicalSubscriptionStatus | "pending" | "missing";
  licenseKey: string | null;
  daysRemaining: number | null;
  reason: string;
};

export type SubscriptionAccessSnapshot = {
  subscription: RestaurantSubscription | null;
  plan: SubscriptionPlanEntity | null;
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  featureAccess: FeatureAccess | null;
  effectiveStatus: CanonicalSubscriptionStatus | "pending" | "missing";
  isActive: boolean;
  isTrialActive: boolean;
  isExpired: boolean;
  isInGracePeriod: boolean;
  daysRemaining: number | null;
  warnings: string[];
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
  access: SubscriptionAccessSnapshot;
  limitChecks: LimitCheckResult[];
};

export type SubscriptionActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_PLAN"
  | "NO_SUBSCRIPTION"
  | "PLAN_LIMIT_REACHED"
  | "DOWNGRADE_EXCEEDS_LIMITS"
  | "PROVIDER_NOT_CONFIGURED"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type SubscriptionActionError = {
  code: SubscriptionActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
  details?: PlanLimitExceededDetails | Record<string, unknown>;
};

export type SubscriptionActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: SubscriptionActionError };

export type SubscriptionNotificationKind =
  | "trial_ending_soon"
  | "subscription_expiring"
  | "payment_overdue"
  | "grace_period"
  | "subscription_expired"
  | "cancellation_scheduled";

export type SubscriptionNotificationDescriptor = {
  kind: SubscriptionNotificationKind;
  title: string;
  description: string;
  severity: "info" | "warning" | "danger";
};
