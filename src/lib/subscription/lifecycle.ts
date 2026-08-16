/**
 * Pure subscription lifecycle helpers — injectable `now` for tests.
 */

import { SUBSCRIPTION_DEFAULTS } from "@/config/subscription";
import { addDays, daysRemaining } from "@/lib/subscription/dates";
import type {
  BillingCycle,
  CanonicalSubscriptionStatus,
  RestaurantSubscription,
  SaasSubscriptionStatus,
  SubscriptionNotificationDescriptor,
  SubscriptionNotificationKind,
  SubscriptionPlanEntity,
  UsageMetrics,
} from "@/types/subscription";
import { SUBSCRIPTION_NOTIFICATION_TEMPLATES } from "@/config/subscription";

export function normalizeSubscriptionStatus(
  status: SaasSubscriptionStatus | string | null | undefined
): CanonicalSubscriptionStatus | "pending" {
  switch (status) {
    case "trial":
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "grace_period":
      return "grace_period";
    case "cancelled":
      return "cancelled";
    case "expired":
      return "expired";
    case "suspended":
      return "suspended";
    case "pending":
      return "pending";
    default:
      return "pending";
  }
}

export function getSubscriptionPeriodEnd(
  subscription: Pick<
    RestaurantSubscription,
    | "effectiveStatus"
    | "status"
    | "trialEnd"
    | "trialEndDate"
    | "subscriptionEnd"
    | "currentPeriodEnd"
    | "renewalDate"
    | "gracePeriodEnd"
  >
): string | null {
  const effective = normalizeSubscriptionStatus(
    subscription.effectiveStatus ?? subscription.status
  );
  if (effective === "trialing") {
    return (
      subscription.trialEndDate ??
      subscription.trialEnd ??
      subscription.currentPeriodEnd ??
      null
    );
  }
  if (effective === "grace_period") {
    return (
      subscription.gracePeriodEnd ??
      subscription.currentPeriodEnd ??
      subscription.subscriptionEnd ??
      null
    );
  }
  return (
    subscription.currentPeriodEnd ??
    subscription.subscriptionEnd ??
    subscription.renewalDate ??
    null
  );
}

export function resolveEffectiveStatus(
  subscription: RestaurantSubscription | null,
  now: Date = new Date(),
  gracePeriodDays = SUBSCRIPTION_DEFAULTS.gracePeriodDays
): CanonicalSubscriptionStatus | "pending" | "missing" {
  if (!subscription) return "missing";

  const stored = normalizeSubscriptionStatus(subscription.status);
  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const periodEndDate = periodEnd ? new Date(periodEnd) : null;

  if (subscription.cancelAtPeriodEnd && periodEndDate && now < periodEndDate) {
    if (stored === "cancelled") return "active";
  }

  if (stored === "trialing" && periodEndDate && now > periodEndDate) {
    return "expired";
  }

  if (stored === "active" && periodEndDate && now > periodEndDate) {
    const graceEnd =
      subscription.gracePeriodEnd != null
        ? new Date(subscription.gracePeriodEnd)
        : addDays(periodEndDate, gracePeriodDays);
    if (now <= graceEnd) return "grace_period";
    return "expired";
  }

  if (stored === "past_due") {
    const graceEnd =
      subscription.gracePeriodEnd != null
        ? new Date(subscription.gracePeriodEnd)
        : periodEndDate
          ? addDays(periodEndDate, gracePeriodDays)
          : null;
    if (graceEnd && now <= graceEnd) return "grace_period";
    if (graceEnd && now > graceEnd) return "expired";
    return "past_due";
  }

  if (stored === "grace_period") {
    const graceEnd = subscription.gracePeriodEnd
      ? new Date(subscription.gracePeriodEnd)
      : periodEndDate
        ? addDays(periodEndDate, gracePeriodDays)
        : null;
    if (graceEnd && now > graceEnd) return "expired";
    return "grace_period";
  }

  if (stored === "cancelled") {
    if (
      subscription.cancelAtPeriodEnd &&
      periodEndDate &&
      now <= periodEndDate
    ) {
      return "active";
    }
    return "cancelled";
  }

  return stored;
}

export function isSubscriptionActive(
  subscription: RestaurantSubscription | null,
  now: Date = new Date()
): boolean {
  const status = resolveEffectiveStatus(subscription, now);
  return status === "trialing" || status === "active" || status === "grace_period";
}

export function isTrialActive(
  subscription: RestaurantSubscription | null,
  now: Date = new Date()
): boolean {
  return resolveEffectiveStatus(subscription, now) === "trialing";
}

export function isSubscriptionExpired(
  subscription: RestaurantSubscription | null,
  now: Date = new Date()
): boolean {
  const status = resolveEffectiveStatus(subscription, now);
  return status === "expired" || status === "cancelled" || status === "suspended";
}

export function isInGracePeriod(
  subscription: RestaurantSubscription | null,
  now: Date = new Date()
): boolean {
  return resolveEffectiveStatus(subscription, now) === "grace_period";
}

export function buildTrialWindow(
  trialDays = SUBSCRIPTION_DEFAULTS.trialDays,
  now: Date = new Date()
): { trialStart: Date; trialEnd: Date } {
  const trialStart = new Date(now);
  const trialEnd = addDays(trialStart, trialDays);
  return { trialStart, trialEnd };
}

export function buildPaidPeriod(
  billingCycle: BillingCycle,
  now: Date = new Date()
): { start: Date; end: Date } {
  const start = new Date(now);
  const end =
    billingCycle === "yearly"
      ? addDays(start, 365)
      : addDays(start, 30);
  return { start, end };
}

export function canAccessPaidFeatures(
  subscription: RestaurantSubscription | null,
  now: Date = new Date()
): boolean {
  return isSubscriptionActive(subscription, now);
}

export function canAccessBillingPages(
  subscription: RestaurantSubscription | null
): boolean {
  void subscription;
  return true;
}

export function evaluateDowngradeImpact(input: {
  currentUsage: UsageMetrics | null;
  targetPlan: SubscriptionPlanEntity;
}): Array<{
  metric: string;
  used: number;
  limit: number;
  exceeds: boolean;
}> {
  const usage = input.currentUsage;
  if (!usage) return [];
  const checks = [
    {
      metric: "branches",
      used: usage.branches,
      limit: input.targetPlan.maxBranches,
    },
    {
      metric: "staff",
      used: usage.users,
      limit: input.targetPlan.maxStaff || input.targetPlan.maxUsers,
    },
    {
      metric: "tables",
      used: usage.tables,
      limit: input.targetPlan.maxTables,
    },
    {
      metric: "menuItems",
      used: usage.menuItems,
      limit: input.targetPlan.maxMenuItems,
    },
    {
      metric: "customers",
      used: usage.customers,
      limit: input.targetPlan.maxCustomers,
    },
  ];
  return checks.map((item) => ({
    ...item,
    exceeds: item.limit > 0 && item.used > item.limit,
  }));
}

export function buildSubscriptionNotifications(
  subscription: RestaurantSubscription | null,
  now: Date = new Date()
): SubscriptionNotificationDescriptor[] {
  if (!subscription) return [];

  const effective = resolveEffectiveStatus(subscription, now);
  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const remaining = daysRemaining(periodEnd, now);
  const items: SubscriptionNotificationDescriptor[] = [];

  function push(kind: SubscriptionNotificationKind) {
    const template = SUBSCRIPTION_NOTIFICATION_TEMPLATES[kind];
    items.push({ kind, ...template });
  }

  if (effective === "trialing" && remaining != null && remaining <= SUBSCRIPTION_DEFAULTS.trialEndingSoonDays) {
    push("trial_ending_soon");
  }
  if (
    (effective === "active" || effective === "trialing") &&
    remaining != null &&
    remaining <= SUBSCRIPTION_DEFAULTS.expiryWarningDays &&
    remaining > SUBSCRIPTION_DEFAULTS.trialEndingSoonDays
  ) {
    push("subscription_expiring");
  }
  if (effective === "past_due") push("payment_overdue");
  if (effective === "grace_period") push("grace_period");
  if (effective === "expired") push("subscription_expired");
  if (subscription.cancelAtPeriodEnd && !isSubscriptionExpired(subscription, now)) {
    push("cancellation_scheduled");
  }

  return items;
}
