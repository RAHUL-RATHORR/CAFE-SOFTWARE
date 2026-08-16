/**
 * Subscription access & feature/limit enforcement layer.
 */

import {
  canAccessPaidFeatures,
  getSubscriptionPeriodEnd,
  isInGracePeriod,
  isSubscriptionActive,
  isSubscriptionExpired,
  isTrialActive,
  resolveEffectiveStatus,
} from "@/lib/subscription/lifecycle";
import { daysRemaining } from "@/lib/subscription/dates";
import type {
  FeatureAccess,
  LimitCheckResult,
  PlanLimitExceededDetails,
  RestaurantSubscription,
  SaasFeatureKey,
  SubscriptionAccessSnapshot,
  SubscriptionPlanEntity,
  TenantLimitSnapshot,
  UsageMetricKey,
  UsageMetrics,
} from "@/types/subscription";

export type ResourceLimitKey =
  | "branches"
  | "staff"
  | "tables"
  | "menuItems"
  | "customers"
  | "orders";

const RESOURCE_TO_METRIC: Record<
  ResourceLimitKey,
  {
    usageKey: keyof UsageMetrics;
    limitKey: keyof TenantLimitSnapshot;
    label: string;
    metric: UsageMetricKey;
  }
> = {
  branches: {
    usageKey: "branches",
    limitKey: "maxBranches",
    label: "Branches",
    metric: "branches",
  },
  staff: {
    usageKey: "users",
    limitKey: "maxStaff",
    label: "Staff",
    metric: "users",
  },
  tables: {
    usageKey: "tables",
    limitKey: "maxTables",
    label: "Tables",
    metric: "tables",
  },
  menuItems: {
    usageKey: "menuItems",
    limitKey: "maxMenuItems",
    label: "Menu items",
    metric: "menuItems",
  },
  customers: {
    usageKey: "customers",
    limitKey: "maxCustomers",
    label: "Customers",
    metric: "customers",
  },
  orders: {
    usageKey: "orders",
    limitKey: "maxOrdersPerMonth",
    label: "Orders / month",
    metric: "orders",
  },
};

export function isFeatureAvailable(
  feature: SaasFeatureKey,
  access: FeatureAccess | null,
  planFeatures?: SaasFeatureKey[]
): boolean {
  if (access?.overrides && feature in access.overrides) {
    return Boolean(access.overrides[feature]);
  }
  if (access?.features?.includes(feature)) return true;
  if (planFeatures?.includes(feature)) return true;
  return false;
}

export function hasPlanFeature(
  feature: SaasFeatureKey,
  plan: SubscriptionPlanEntity | null,
  access: FeatureAccess | null = null
): boolean {
  return isFeatureAvailable(feature, access, plan?.features);
}

export function canUseFeature(
  feature: SaasFeatureKey,
  input: {
    subscription: RestaurantSubscription | null;
    plan: SubscriptionPlanEntity | null;
    access?: FeatureAccess | null;
    now?: Date;
  }
): boolean {
  if (!canAccessPaidFeatures(input.subscription, input.now)) {
    // Billing stays available even when expired.
    if (feature === "billing") return true;
    return false;
  }
  return hasPlanFeature(feature, input.plan, input.access ?? null);
}

export function checkResourceLimit(input: {
  resource: ResourceLimitKey;
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  planName?: string;
}): {
  allowed: boolean;
  check: LimitCheckResult | null;
  details: PlanLimitExceededDetails | null;
} {
  const meta = RESOURCE_TO_METRIC[input.resource];
  if (!input.usage || !input.limits) {
    return { allowed: true, check: null, details: null };
  }

  const used = Number(input.usage[meta.usageKey] ?? 0);
  const limit =
    meta.limitKey === "maxStaff"
      ? Number(input.limits.maxStaff || input.limits.maxUsers || 0)
      : Number(input.limits[meta.limitKey] ?? 0);
  const remaining = Math.max(0, limit - used);
  const wouldBlock = limit > 0 && used >= limit;
  const check: LimitCheckResult = {
    metric: meta.metric,
    label: meta.label,
    limit,
    used,
    remaining,
    wouldBlock,
    message: wouldBlock
      ? `You have reached your plan limit for ${meta.label.toLowerCase()} (${used}/${limit}).`
      : `${meta.label}: ${used}/${limit} used.`,
  };

  if (!wouldBlock) {
    return { allowed: true, check, details: null };
  }

  return {
    allowed: false,
    check,
    details: {
      code: "PLAN_LIMIT_REACHED",
      message: "You have reached your plan limit.",
      currentPlan: input.planName ?? "Current plan",
      metric: meta.metric,
      used,
      limit,
      upgradePath: "/subscription/plans",
    },
  };
}

export function canCreateBranch(input: {
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  planName?: string;
}) {
  return checkResourceLimit({ ...input, resource: "branches" });
}

export function canCreateStaff(input: {
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  planName?: string;
}) {
  return checkResourceLimit({ ...input, resource: "staff" });
}

export function canCreateTable(input: {
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  planName?: string;
}) {
  return checkResourceLimit({ ...input, resource: "tables" });
}

export function canCreateMenuItem(input: {
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  planName?: string;
}) {
  return checkResourceLimit({ ...input, resource: "menuItems" });
}

export function canCreateCustomer(input: {
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  planName?: string;
}) {
  return checkResourceLimit({ ...input, resource: "customers" });
}

export function buildAccessSnapshot(input: {
  subscription: RestaurantSubscription | null;
  plan: SubscriptionPlanEntity | null;
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  featureAccess: FeatureAccess | null;
  now?: Date;
}): SubscriptionAccessSnapshot {
  const now = input.now ?? new Date();
  const effectiveStatus = resolveEffectiveStatus(input.subscription, now);
  const periodEnd = input.subscription
    ? getSubscriptionPeriodEnd(input.subscription)
    : null;
  const warnings: string[] = [];

  if (effectiveStatus === "grace_period") {
    warnings.push(
      "Your subscription is in a grace period. Renew soon to keep full access."
    );
  }
  if (effectiveStatus === "past_due") {
    warnings.push("Payment is overdue. Update billing to avoid losing access.");
  }
  if (effectiveStatus === "expired") {
    warnings.push(
      "Your subscription has expired. Renew your plan to restore full access."
    );
  }
  if (input.subscription?.cancelAtPeriodEnd) {
    warnings.push(
      "Cancellation is scheduled. Access continues until the current period ends."
    );
  }

  return {
    subscription: input.subscription,
    plan: input.plan,
    usage: input.usage,
    limits: input.limits,
    featureAccess: input.featureAccess,
    effectiveStatus,
    isActive: isSubscriptionActive(input.subscription, now),
    isTrialActive: isTrialActive(input.subscription, now),
    isExpired: isSubscriptionExpired(input.subscription, now),
    isInGracePeriod: isInGracePeriod(input.subscription, now),
    daysRemaining: daysRemaining(periodEnd, now),
    warnings,
  };
}

export {
  isSubscriptionActive,
  isTrialActive,
  isSubscriptionExpired,
  isInGracePeriod,
  canAccessPaidFeatures,
};
