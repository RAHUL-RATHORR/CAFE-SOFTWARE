/**
 * Shared server-side plan limit / feature guards for create mutations.
 */

import {
  buildAccessSnapshot,
  canProceedWithLimit,
  canUseFeature,
  planToLimits,
  type LimitGateKey,
} from "@/lib/subscription";
import { subscriptionRepository } from "@/repositories/subscription";
import type {
  PlanLimitExceededDetails,
  SaasFeatureKey,
  SubscriptionActionResult,
  UsageMetrics,
} from "@/types/subscription";

const USAGE_KEY_BY_LIMIT: Record<
  Exclude<LimitGateKey, "feature" | "orders">,
  keyof UsageMetrics
> = {
  branches: "branches",
  staff: "users",
  tables: "tables",
  menuItems: "menuItems",
  customers: "customers",
};

export async function enforcePlanResourceLimit(input: {
  restaurantId: string;
  key: Exclude<LimitGateKey, "feature">;
  /** Number of resources about to be created (default 1) */
  incrementBy?: number;
}): Promise<SubscriptionActionResult<true>> {
  const dashboard = await subscriptionRepository.getDashboard(
    input.restaurantId
  );
  const limits = planToLimits(dashboard.currentPlan);
  const incrementBy = Math.max(1, input.incrementBy ?? 1);

  let usage = dashboard.usage;
  if (usage && incrementBy > 1 && input.key !== "orders") {
    const usageKey = USAGE_KEY_BY_LIMIT[input.key];
    usage = {
      ...usage,
      [usageKey]: Number(usage[usageKey] ?? 0) + (incrementBy - 1),
    };
  }

  const gate = canProceedWithLimit({
    key: input.key,
    usage,
    limits,
    planName:
      dashboard.currentPlan?.displayName ||
      dashboard.currentPlan?.name ||
      "Current plan",
  });

  if (!gate.allowed && gate.details) {
    return {
      success: false,
      error: {
        code: "PLAN_LIMIT_REACHED",
        message: gate.details.message,
        details: gate.details as PlanLimitExceededDetails,
      },
    };
  }

  const access = buildAccessSnapshot({
    subscription: dashboard.subscription,
    plan: dashboard.currentPlan,
    usage: dashboard.usage,
    limits,
    featureAccess: dashboard.featureAccess,
  });

  if (access.isExpired) {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message:
          "Your subscription has expired. Renew your plan to restore full access.",
        details: {
          upgradePath: "/subscription/plans",
          effectiveStatus: access.effectiveStatus,
        },
      },
    };
  }

  return { success: true, data: true };
}

export async function enforcePlanFeature(input: {
  restaurantId: string;
  feature: SaasFeatureKey;
}): Promise<SubscriptionActionResult<true>> {
  const dashboard = await subscriptionRepository.getDashboard(
    input.restaurantId
  );
  const allowed = canUseFeature(input.feature, {
    subscription: dashboard.subscription,
    plan: dashboard.currentPlan,
    access: dashboard.featureAccess,
  });

  if (!allowed) {
    return {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: `The ${input.feature} feature is not available on your current plan. Upgrade to unlock it.`,
        details: {
          upgradePath: "/subscription/plans",
          feature: input.feature,
        },
      },
    };
  }

  return { success: true, data: true };
}
