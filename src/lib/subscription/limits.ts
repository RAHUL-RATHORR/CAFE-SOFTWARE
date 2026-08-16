/**
 * Plan limit evaluation and feature helpers.
 */

import type {
  LimitCheckResult,
  SubscriptionPlanEntity,
  TenantLimitSnapshot,
  UsageMetricKey,
  UsageMetrics,
} from "@/types/subscription";
import {
  canCreateBranch,
  canCreateCustomer,
  canCreateMenuItem,
  canCreateStaff,
  canCreateTable,
  checkResourceLimit,
  isFeatureAvailable,
  type ResourceLimitKey,
} from "@/lib/subscription/access";

export { isFeatureAvailable };

export function planToLimits(
  plan: SubscriptionPlanEntity | null
): TenantLimitSnapshot | null {
  if (!plan) return null;
  const maxStaff = plan.maxStaff || plan.maxUsers;
  return {
    maxBranches: plan.maxBranches,
    maxStaff,
    maxUsers: plan.maxUsers || maxStaff,
    maxOrdersPerMonth: plan.maxOrdersPerMonth,
    maxMenuItems: plan.maxMenuItems,
    maxTables: plan.maxTables,
    maxCustomers: plan.maxCustomers,
    storageLimit: plan.storageLimit,
  };
}

function buildCheck(
  metric: LimitCheckResult["metric"],
  label: string,
  used: number,
  limit: number
): LimitCheckResult {
  const remaining = Math.max(0, limit - used);
  const wouldBlock = limit > 0 && used >= limit;
  return {
    metric,
    label,
    limit,
    used,
    remaining,
    wouldBlock,
    message: wouldBlock
      ? `You have reached your plan limit for ${label.toLowerCase()} (${used}/${limit}).`
      : `${label}: ${used}/${limit} used.`,
  };
}

/**
 * Prepare branch / staff / order / storage / feature checks.
 */
export function evaluateTenantLimits(input: {
  limits: TenantLimitSnapshot | null;
  usage: UsageMetrics | null;
  tablesUsed?: number;
}): LimitCheckResult[] {
  const limits = input.limits;
  const usage = input.usage;
  if (!limits || !usage) return [];

  const tablesUsed = input.tablesUsed ?? usage.tables ?? 0;

  return [
    buildCheck("branches", "Branches", usage.branches, limits.maxBranches),
    buildCheck(
      "users",
      "Staff",
      usage.users,
      limits.maxStaff || limits.maxUsers
    ),
    buildCheck(
      "orders",
      "Orders / month",
      usage.orders,
      limits.maxOrdersPerMonth
    ),
    buildCheck("menuItems", "Menu items", usage.menuItems, limits.maxMenuItems),
    buildCheck("tables", "Tables", tablesUsed, limits.maxTables),
    buildCheck(
      "customers",
      "Customers",
      usage.customers,
      limits.maxCustomers
    ),
    buildCheck("storage", "Storage (MB)", usage.storage, limits.storageLimit),
  ];
}

export function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export type LimitGateKey = ResourceLimitKey | "feature";

/**
 * Enforce resource limits for create mutations.
 */
export function canProceedWithLimit(input: {
  key: LimitGateKey;
  usage: UsageMetrics | null;
  limits: TenantLimitSnapshot | null;
  planName?: string;
}): {
  allowed: boolean;
  enforced: true;
  check: LimitCheckResult | null;
  details: ReturnType<typeof checkResourceLimit>["details"];
} {
  if (input.key === "feature") {
    return {
      allowed: true,
      enforced: true,
      check: null,
      details: null,
    };
  }

  const result = checkResourceLimit({
    resource: input.key,
    usage: input.usage,
    limits: input.limits,
    planName: input.planName,
  });

  return {
    allowed: result.allowed,
    enforced: true,
    check: result.check,
    details: result.details,
  };
}

export function metricLimitMap(
  limits: TenantLimitSnapshot
): Partial<Record<UsageMetricKey, number>> {
  return {
    users: limits.maxStaff || limits.maxUsers,
    branches: limits.maxBranches,
    orders: limits.maxOrdersPerMonth,
    menuItems: limits.maxMenuItems,
    customers: limits.maxCustomers,
    storage: limits.storageLimit,
    tables: limits.maxTables,
  };
}

export {
  canCreateBranch,
  canCreateStaff,
  canCreateTable,
  canCreateMenuItem,
  canCreateCustomer,
};
