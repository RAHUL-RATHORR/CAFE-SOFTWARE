/**
 * Limit enforcement foundation — informational only.
 * Do not block create/update flows yet.
 */

import type {
  LimitCheckResult,
  SaasFeatureKey,
  SubscriptionPlanEntity,
  TenantLimitSnapshot,
  UsageMetricKey,
  UsageMetrics,
  FeatureAccess,
} from "@/types/subscription";

export function planToLimits(
  plan: SubscriptionPlanEntity | null
): TenantLimitSnapshot | null {
  if (!plan) return null;
  return {
    maxBranches: plan.maxBranches,
    maxUsers: plan.maxUsers,
    maxOrdersPerMonth: plan.maxOrdersPerMonth,
    maxMenuItems: plan.maxMenuItems,
    maxTables: plan.maxTables,
    storageLimit: plan.storageLimit,
  };
}

function buildCheck(
  metric: LimitCheckResult["metric"],
  used: number,
  limit: number,
  label: string
): LimitCheckResult {
  const remaining = Math.max(0, limit - used);
  const wouldBlock = limit > 0 && used >= limit;
  return {
    metric,
    limit,
    used,
    remaining,
    wouldBlock,
    message: wouldBlock
      ? `${label} limit reached (${used}/${limit}). Enforcement not active.`
      : `${label}: ${used}/${limit} used.`,
  };
}

/**
 * Prepare branch / user / order / storage / feature checks.
 * Returns checks only — never throws or blocks.
 */
export function evaluateTenantLimits(input: {
  limits: TenantLimitSnapshot | null;
  usage: UsageMetrics | null;
  tablesUsed?: number;
}): LimitCheckResult[] {
  const limits = input.limits;
  const usage = input.usage;
  if (!limits || !usage) return [];

  return [
    buildCheck("branches", usage.branches, limits.maxBranches, "Branches"),
    buildCheck("users", usage.users, limits.maxUsers, "Users"),
    buildCheck(
      "orders",
      usage.orders,
      limits.maxOrdersPerMonth,
      "Orders / month"
    ),
    buildCheck("menuItems", usage.menuItems, limits.maxMenuItems, "Menu items"),
    buildCheck(
      "tables",
      input.tablesUsed ?? 0,
      limits.maxTables,
      "Tables"
    ),
    buildCheck("storage", usage.storage, limits.storageLimit, "Storage (MB)"),
  ];
}

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

export function usagePercent(
  used: number,
  limit: number
): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export type LimitGateKey =
  | "branches"
  | "users"
  | "orders"
  | "storage"
  | "menuItems"
  | "tables"
  | "feature";

/**
 * Future enforcement hook — always allows today.
 */
export function canProceedWithLimit(key: LimitGateKey): {
  allowed: true;
  enforced: false;
} {
  void key;
  return { allowed: true, enforced: false };
}

export function metricLimitMap(
  limits: TenantLimitSnapshot
): Partial<Record<UsageMetricKey, number>> {
  return {
    users: limits.maxUsers,
    branches: limits.maxBranches,
    orders: limits.maxOrdersPerMonth,
    menuItems: limits.maxMenuItems,
    storage: limits.storageLimit,
  };
}
