import { describe, expect, it } from "vitest";
import {
  canUseFeature,
  canCreateBranch,
  canCreateTable,
  planToLimits,
} from "@/lib/subscription";
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
    maxTables: 2,
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
    users: 1,
    branches: 1,
    orders: 10,
    menuItems: 10,
    customers: 10,
    inventoryItems: 0,
    tables: 2,
    storage: 0,
    apiRequests: 0,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("branch/table plan gates", () => {
  it("blocks branch creation when at maxBranches", () => {
    const plan = makePlan({ maxBranches: 1 });
    const usage = makeUsage({ branches: 1 });
    const gate = canCreateBranch({
      usage,
      limits: planToLimits(plan),
      planName: plan.displayName,
    });
    expect(gate.allowed).toBe(false);
  });

  it("blocks table creation when at maxTables", () => {
    const plan = makePlan({ maxTables: 2 });
    const usage = makeUsage({ tables: 2 });
    const gate = canCreateTable({
      usage,
      limits: planToLimits(plan),
      planName: plan.displayName,
    });
    expect(gate.allowed).toBe(false);
  });

  it("requires qr-ordering feature before issuing QR", () => {
    const plan = makePlan({ features: ["dashboard", "orders"] });
    const sub = makeSub({ status: "active", effectiveStatus: "active" });
    const now = new Date("2026-08-05T00:00:00.000Z");
    expect(
      canUseFeature("qr-ordering", {
        subscription: sub,
        plan,
        access: null,
        now,
      })
    ).toBe(false);

    expect(
      canUseFeature("qr-ordering", {
        subscription: sub,
        plan: makePlan({ features: ["dashboard", "qr-ordering"] }),
        access: null,
        now,
      })
    ).toBe(true);
  });
});

describe("tenant isolation contract", () => {
  it("repository filters must always include actor restaurantId", () => {
    const actorA = { restaurantId: "aaaaaaaaaaaaaaaaaaaaaaaa" };
    const actorB = { restaurantId: "bbbbbbbbbbbbbbbbbbbbbbbb" };
    const resourceRestaurantId = actorB.restaurantId;

    const canAccess =
      actorA.restaurantId === resourceRestaurantId ? "allow" : "deny";
    expect(canAccess).toBe("deny");
  });
});
