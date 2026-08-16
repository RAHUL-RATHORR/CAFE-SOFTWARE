import { describe, expect, it } from "vitest";
import {
  buildTrialWindow,
  resolveEffectiveStatus,
  isSubscriptionActive,
  isTrialActive,
  isSubscriptionExpired,
  isInGracePeriod,
  evaluateDowngradeImpact,
  canCreateBranch,
  canCreateStaff,
  canCreateTable,
  hasPlanFeature,
  canUseFeature,
  validateLicense,
  planToLimits,
  normalizeSubscriptionStatus,
} from "@/lib/subscription";
import { SUBSCRIPTION_DEFAULTS } from "@/config/subscription";
import type {
  RestaurantSubscription,
  SubscriptionPlanEntity,
  UsageMetrics,
} from "@/types/subscription";

function makePlan(
  overrides: Partial<SubscriptionPlanEntity> = {}
): SubscriptionPlanEntity {
  return {
    id: "plan1",
    planKey: "BASIC",
    name: "Basic",
    displayName: "Basic",
    slug: "basic",
    description: "Basic plan",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    currency: "INR",
    trialDays: 14,
    maxBranches: 1,
    maxStaff: 5,
    maxUsers: 5,
    maxOrdersPerMonth: 2000,
    maxMenuItems: 100,
    maxTables: 20,
    maxCustomers: 500,
    storageLimit: 2048,
    features: ["dashboard", "orders", "pos", "billing"],
    isPopular: false,
    isActive: true,
    sortOrder: 20,
    createdBy: null,
    updatedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSub(
  overrides: Partial<RestaurantSubscription> = {}
): RestaurantSubscription {
  const now = new Date("2026-08-01T00:00:00.000Z");
  const trialEnd = new Date("2026-08-15T00:00:00.000Z").toISOString();
  return {
    id: "sub1",
    restaurantId: "rest1",
    planId: "plan1",
    planName: "Basic",
    planSlug: "basic",
    status: "trialing",
    effectiveStatus: "trialing",
    billingCycle: "monthly",
    startDate: now.toISOString(),
    trialStartDate: now.toISOString(),
    trialEndDate: trialEnd,
    trialStart: now.toISOString(),
    trialEnd,
    subscriptionStart: null,
    subscriptionEnd: null,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: trialEnd,
    gracePeriodEnd: null,
    renewalDate: trialEnd,
    cancelledAt: null,
    cancelAtPeriodEnd: false,
    pendingPlanChange: null,
    provider: null,
    providerSubscriptionId: null,
    paymentStatus: "not_configured",
    licenseKey: "DF-TEST-KEY",
    createdBy: null,
    updatedBy: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

function makeUsage(overrides: Partial<UsageMetrics> = {}): UsageMetrics {
  return {
    id: "usage1",
    restaurantId: "rest1",
    periodKey: "2026-08",
    users: 2,
    branches: 1,
    orders: 10,
    storage: 100,
    apiRequests: 0,
    menuItems: 20,
    customers: 30,
    inventoryItems: 0,
    tables: 5,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("subscription lifecycle", () => {
  it("creates a trial window with configurable days", () => {
    const now = new Date("2026-08-01T00:00:00.000Z");
    const { trialStart, trialEnd } = buildTrialWindow(
      SUBSCRIPTION_DEFAULTS.trialDays,
      now
    );
    expect(trialStart.toISOString()).toBe(now.toISOString());
    expect(trialEnd.toISOString()).toBe("2026-08-15T00:00:00.000Z");
  });

  it("normalizes legacy trial status to trialing", () => {
    expect(normalizeSubscriptionStatus("trial")).toBe("trialing");
  });

  it("detects active trial", () => {
    const sub = makeSub();
    const now = new Date("2026-08-05T00:00:00.000Z");
    expect(isTrialActive(sub, now)).toBe(true);
    expect(isSubscriptionActive(sub, now)).toBe(true);
    expect(resolveEffectiveStatus(sub, now)).toBe("trialing");
  });

  it("expires trial after trial end", () => {
    const sub = makeSub();
    const now = new Date("2026-08-20T00:00:00.000Z");
    expect(isTrialActive(sub, now)).toBe(false);
    expect(isSubscriptionExpired(sub, now)).toBe(true);
    expect(resolveEffectiveStatus(sub, now)).toBe("expired");
  });

  it("keeps access during grace period", () => {
    const periodEnd = "2026-08-10T00:00:00.000Z";
    const sub = makeSub({
      status: "active",
      effectiveStatus: "active",
      trialStart: null,
      trialEnd: null,
      trialStartDate: null,
      trialEndDate: null,
      subscriptionStart: "2026-07-10T00:00:00.000Z",
      subscriptionEnd: periodEnd,
      currentPeriodStart: "2026-07-10T00:00:00.000Z",
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      gracePeriodEnd: "2026-08-17T00:00:00.000Z",
    });
    const now = new Date("2026-08-12T00:00:00.000Z");
    expect(isInGracePeriod(sub, now)).toBe(true);
    expect(isSubscriptionActive(sub, now)).toBe(true);
  });

  it("marks subscription expired after grace period", () => {
    const periodEnd = "2026-08-10T00:00:00.000Z";
    const sub = makeSub({
      status: "active",
      effectiveStatus: "active",
      trialStart: null,
      trialEnd: null,
      trialStartDate: null,
      trialEndDate: null,
      subscriptionEnd: periodEnd,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      gracePeriodEnd: "2026-08-17T00:00:00.000Z",
    });
    const now = new Date("2026-08-20T00:00:00.000Z");
    expect(resolveEffectiveStatus(sub, now)).toBe("expired");
    expect(isSubscriptionExpired(sub, now)).toBe(true);
  });

  it("keeps access when cancellation is scheduled at period end", () => {
    const periodEnd = "2026-08-31T00:00:00.000Z";
    const sub = makeSub({
      status: "active",
      effectiveStatus: "active",
      cancelAtPeriodEnd: true,
      cancelledAt: "2026-08-05T00:00:00.000Z",
      trialStart: null,
      trialEnd: null,
      trialStartDate: null,
      trialEndDate: null,
      subscriptionEnd: periodEnd,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
    });
    const now = new Date("2026-08-10T00:00:00.000Z");
    expect(isSubscriptionActive(sub, now)).toBe(true);
  });
});

describe("plan limits and features", () => {
  it("blocks branch create when limit reached", () => {
    const plan = makePlan({ maxBranches: 1 });
    const usage = makeUsage({ branches: 1 });
    const result = canCreateBranch({
      usage,
      limits: planToLimits(plan),
      planName: plan.displayName,
    });
    expect(result.allowed).toBe(false);
    expect(result.details?.message).toContain("plan limit");
  });

  it("allows staff create under limit", () => {
    const plan = makePlan({ maxStaff: 5 });
    const usage = makeUsage({ users: 2 });
    const result = canCreateStaff({
      usage,
      limits: planToLimits(plan),
      planName: plan.displayName,
    });
    expect(result.allowed).toBe(true);
  });

  it("checks table limits", () => {
    const plan = makePlan({ maxTables: 20 });
    const usage = makeUsage({ tables: 20 });
    const result = canCreateTable({
      usage,
      limits: planToLimits(plan),
      planName: plan.displayName,
    });
    expect(result.allowed).toBe(false);
  });

  it("evaluates downgrade impact without deleting data", () => {
    const target = makePlan({
      planKey: "BASIC",
      maxBranches: 1,
      maxStaff: 3,
      maxTables: 10,
      maxMenuItems: 50,
      maxCustomers: 100,
    });
    const usage = makeUsage({
      branches: 2,
      users: 8,
      tables: 35,
      menuItems: 80,
      customers: 200,
    });
    const impact = evaluateDowngradeImpact({
      currentUsage: usage,
      targetPlan: target,
    });
    expect(impact.filter((item) => item.exceeds).length).toBeGreaterThan(0);
  });

  it("checks plan features and expired access", () => {
    const plan = makePlan();
    const active = makeSub({ status: "active", effectiveStatus: "active" });
    const expired = makeSub({
      status: "expired",
      effectiveStatus: "expired",
      trialEnd: "2026-07-01T00:00:00.000Z",
      trialEndDate: "2026-07-01T00:00:00.000Z",
      currentPeriodEnd: "2026-07-01T00:00:00.000Z",
    });
    expect(hasPlanFeature("pos", plan)).toBe(true);
    expect(
      canUseFeature("pos", {
        subscription: active,
        plan,
        now: new Date("2026-08-05T00:00:00.000Z"),
      })
    ).toBe(true);
    expect(
      canUseFeature("pos", {
        subscription: expired,
        plan,
        now: new Date("2026-08-05T00:00:00.000Z"),
      })
    ).toBe(false);
    expect(
      canUseFeature("billing", {
        subscription: expired,
        plan,
        now: new Date("2026-08-05T00:00:00.000Z"),
      })
    ).toBe(true);
  });

  it("validates license for active and expired subscriptions", () => {
    const active = makeSub();
    const expired = makeSub({
      status: "expired",
      effectiveStatus: "expired",
      trialEnd: "2026-07-01T00:00:00.000Z",
      trialEndDate: "2026-07-01T00:00:00.000Z",
      currentPeriodEnd: "2026-07-01T00:00:00.000Z",
    });
    expect(
      validateLicense(active, new Date("2026-08-05T00:00:00.000Z")).valid
    ).toBe(true);
    expect(
      validateLicense(expired, new Date("2026-08-05T00:00:00.000Z")).valid
    ).toBe(false);
  });
});
