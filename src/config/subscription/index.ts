import type {
  SaasSubscriptionStatus,
  CanonicalSubscriptionStatus,
  SaasFeatureKey,
  BillingCycle,
  InvoiceFoundationStatus,
  UsageMetricKey,
  PlanId,
  PlanSlug,
  SubscriptionNotificationDescriptor,
} from "@/types/subscription";

export const SUBSCRIPTION_DEFAULTS = {
  trialDays: 14,
  gracePeriodDays: 7,
  currency: "INR",
  trialEndingSoonDays: 3,
  expiryWarningDays: 7,
} as const;

export const PLAN_ID_TO_SLUG: Record<PlanId, PlanSlug> = {
  FREE_TRIAL: "free-trial",
  BASIC: "basic",
  PRO: "pro",
  PREMIUM: "premium",
};

export const PLAN_SLUG_TO_ID: Record<PlanSlug, PlanId> = {
  "free-trial": "FREE_TRIAL",
  basic: "BASIC",
  pro: "PRO",
  premium: "PREMIUM",
};

export const SAAS_STATUS_LABELS: Record<SaasSubscriptionStatus, string> = {
  trialing: "Trial",
  trial: "Trial",
  active: "Active",
  past_due: "Payment overdue",
  grace_period: "Grace period",
  expired: "Expired",
  suspended: "Suspended",
  cancelled: "Cancelled",
  pending: "Pending",
};

export const SAAS_STATUS_VARIANTS: Record<
  SaasSubscriptionStatus,
  "success" | "warning" | "danger" | "secondary" | "info"
> = {
  trialing: "info",
  trial: "info",
  active: "success",
  past_due: "warning",
  grace_period: "warning",
  expired: "danger",
  suspended: "warning",
  cancelled: "secondary",
  pending: "warning",
};

export const CANONICAL_STATUS_LABELS: Record<
  CanonicalSubscriptionStatus,
  string
> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Payment overdue",
  grace_period: "Grace period",
  expired: "Expired",
  suspended: "Suspended",
  cancelled: "Cancelled",
};

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
};

export const SAAS_FEATURE_LABELS: Record<SaasFeatureKey, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  kitchen: "Kitchen",
  billing: "Billing",
  pos: "POS",
  inventory: "Inventory",
  crm: "Customer management",
  reports: "Reports",
  staff: "Staff",
  purchases: "Purchases",
  "qr-ordering": "QR ordering",
  "online-ordering": "Online ordering",
  "api-access": "API access",
  "custom-branding": "Custom branding",
  "advanced-analytics": "Advanced analytics",
};

export const USAGE_METRIC_LABELS: Record<UsageMetricKey, string> = {
  users: "Staff",
  branches: "Branches",
  orders: "Orders",
  storage: "Storage (MB)",
  apiRequests: "API requests",
  menuItems: "Menu items",
  customers: "Customers",
  inventoryItems: "Inventory items",
  tables: "Tables",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceFoundationStatus, string> = {
  draft: "Draft",
  open: "Open",
  paid: "Paid",
  void: "Void",
  refunded: "Refunded",
};

export const INVOICE_STATUS_VARIANTS: Record<
  InvoiceFoundationStatus,
  "secondary" | "info" | "success" | "danger" | "warning"
> = {
  draft: "secondary",
  open: "info",
  paid: "success",
  void: "danger",
  refunded: "warning",
};

export type PlanSeedDefinition = {
  planKey: PlanId;
  name: string;
  displayName: string;
  slug: PlanSlug;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  trialDays: number;
  maxBranches: number;
  maxStaff: number;
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
};

/** Default catalog used when DB has no plans yet */
export const DEFAULT_PLAN_SEEDS: readonly PlanSeedDefinition[] = [
  {
    planKey: "FREE_TRIAL",
    name: "Free Trial",
    displayName: "Free Trial",
    slug: "free-trial",
    description:
      "Evaluate DineFlow with core restaurant operations for a limited time.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "INR",
    trialDays: SUBSCRIPTION_DEFAULTS.trialDays,
    maxBranches: 1,
    maxStaff: 3,
    maxUsers: 3,
    maxOrdersPerMonth: 200,
    maxMenuItems: 50,
    maxTables: 10,
    maxCustomers: 100,
    storageLimit: 500,
    features: ["dashboard", "orders", "kitchen", "billing", "reports", "pos"],
    isPopular: false,
    isActive: true,
    sortOrder: 10,
  },
  {
    planKey: "BASIC",
    name: "Basic",
    displayName: "Basic",
    slug: "basic",
    description: "Solid starter plan for single-outlet cafés and restaurants.",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    currency: "INR",
    trialDays: SUBSCRIPTION_DEFAULTS.trialDays,
    maxBranches: 1,
    maxStaff: 5,
    maxUsers: 5,
    maxOrdersPerMonth: 2000,
    maxMenuItems: 100,
    maxTables: 20,
    maxCustomers: 500,
    storageLimit: 2048,
    features: [
      "dashboard",
      "orders",
      "kitchen",
      "billing",
      "pos",
      "reports",
      "staff",
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 20,
  },
  {
    planKey: "PRO",
    name: "Pro",
    displayName: "Pro",
    slug: "pro",
    description:
      "Growing restaurants that need multi-branch readiness and advanced tools.",
    monthlyPrice: 2499,
    yearlyPrice: 24990,
    currency: "INR",
    trialDays: SUBSCRIPTION_DEFAULTS.trialDays,
    maxBranches: 3,
    maxStaff: 20,
    maxUsers: 20,
    maxOrdersPerMonth: 20000,
    maxMenuItems: 500,
    maxTables: 100,
    maxCustomers: 5000,
    storageLimit: 10240,
    features: [
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
      "advanced-analytics",
    ],
    isPopular: true,
    isActive: true,
    sortOrder: 30,
  },
  {
    planKey: "PREMIUM",
    name: "Premium",
    displayName: "Premium",
    slug: "premium",
    description:
      "Full platform access for multi-outlet brands with priority features.",
    monthlyPrice: 4999,
    yearlyPrice: 49990,
    currency: "INR",
    trialDays: SUBSCRIPTION_DEFAULTS.trialDays,
    maxBranches: 25,
    maxStaff: 100,
    maxUsers: 100,
    maxOrdersPerMonth: 200000,
    maxMenuItems: 5000,
    maxTables: 500,
    maxCustomers: 50000,
    storageLimit: 51200,
    features: [
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
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 40,
  },
] as const;

export function getPlanSeedById(planKey: PlanId): PlanSeedDefinition {
  const seed = DEFAULT_PLAN_SEEDS.find((plan) => plan.planKey === planKey);
  if (!seed) {
    throw new Error(`Unknown plan key: ${planKey}`);
  }
  return seed;
}

export function getPlanSeedBySlug(slug: string): PlanSeedDefinition | null {
  return (
    DEFAULT_PLAN_SEEDS.find((plan) => plan.slug === slug.toLowerCase()) ?? null
  );
}

export const SUBSCRIPTION_NOTIFICATION_TEMPLATES: Record<
  SubscriptionNotificationDescriptor["kind"],
  Omit<SubscriptionNotificationDescriptor, "kind">
> = {
  trial_ending_soon: {
    title: "Trial ending soon",
    description: "Your free trial ends soon. Choose a plan to keep full access.",
    severity: "warning",
  },
  subscription_expiring: {
    title: "Subscription ending soon",
    description: "Your current period ends soon. Renew to avoid interruption.",
    severity: "warning",
  },
  payment_overdue: {
    title: "Payment overdue",
    description:
      "A payment is overdue. Update billing to avoid losing paid features.",
    severity: "warning",
  },
  grace_period: {
    title: "Grace period active",
    description:
      "You still have access during the grace period. Renew to restore normal billing.",
    severity: "warning",
  },
  subscription_expired: {
    title: "Subscription expired",
    description:
      "Your subscription has expired. Renew your plan to restore full access.",
    severity: "danger",
  },
  cancellation_scheduled: {
    title: "Cancellation scheduled",
    description:
      "Access continues until the end of the current period. You can reverse cancellation before then.",
    severity: "info",
  },
};
