import type { SubscriptionPlanDocument } from "@/models/subscription";
import type { RestaurantSubscriptionDocument } from "@/models/subscription";
import type { UsageMetricsDocument } from "@/models/subscription";
import type { InvoiceFoundationDocument } from "@/models/subscription";
import type { FeatureAccessDocument } from "@/models/subscription";
import { PLAN_SLUG_TO_ID, getPlanSeedBySlug } from "@/config/subscription";
import { normalizeSubscriptionStatus } from "@/lib/subscription/lifecycle";
import {
  addDays,
  addMonths,
  currentPeriodKey,
  daysRemaining,
} from "@/lib/subscription/dates";
import type {
  SubscriptionPlanEntity,
  RestaurantSubscription,
  UsageMetrics,
  InvoiceFoundation,
  FeatureAccess,
  SaasFeatureKey,
  SaasSubscriptionStatus,
  BillingCycle,
  InvoiceFoundationStatus,
  PlanId,
  PlanSlug,
  PaymentProviderStatus,
  PendingPlanChange,
} from "@/types/subscription";
import type { SubscriptionPlan as LegacyPlan } from "@/types/restaurant";
import type { SubscriptionStatus as LegacyStatus } from "@/types/restaurant";

export { addDays, addMonths, currentPeriodKey, daysRemaining };

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function slugifyPlanName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function generateLicenseKey(restaurantId: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  const suffix = restaurantId.slice(-6).toUpperCase();
  return `DF-${stamp}-${rand}-${suffix}`;
}

export function formatSubscriptionDate(
  value: string | null | undefined
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date
  );
}

export function formatMoney(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Map SaaS status → legacy restaurant.subscriptionStatus */
export function toLegacySubscriptionStatus(
  status: SaasSubscriptionStatus
): LegacyStatus {
  const normalized = normalizeSubscriptionStatus(status);
  switch (normalized) {
    case "trialing":
      return "trialing";
    case "active":
    case "grace_period":
      return "active";
    case "past_due":
      return "past_due";
    case "cancelled":
      return "cancelled";
    case "suspended":
      return "past_due";
    case "expired":
    default:
      return "inactive";
  }
}

/** Map plan slug → legacy restaurant.subscriptionPlan when compatible */
export function toLegacyPlanSlug(slug: string): LegacyPlan {
  const normalized = slug.toLowerCase();
  if (normalized === "free" || normalized === "free-trial") return "free";
  if (normalized === "basic" || normalized === "starter") return "starter";
  if (normalized === "pro") return "pro";
  if (normalized === "premium" || normalized === "enterprise") return "enterprise";
  return "starter";
}

function resolvePlanKey(
  planKey: unknown,
  slug: string
): PlanId | null {
  if (typeof planKey === "string" && planKey.trim()) {
    const key = planKey.trim().toUpperCase();
    if (
      key === "FREE_TRIAL" ||
      key === "BASIC" ||
      key === "PRO" ||
      key === "PREMIUM"
    ) {
      return key;
    }
  }
  const seed = getPlanSeedBySlug(slug);
  if (seed) return seed.planKey;
  if (slug in PLAN_SLUG_TO_ID) {
    return PLAN_SLUG_TO_ID[slug as PlanSlug];
  }
  return null;
}

export function serializePlan(
  doc: SubscriptionPlanDocument
): SubscriptionPlanEntity {
  const slug = doc.slug;
  const maxStaff = Number(
    (doc as { maxStaff?: number }).maxStaff ?? doc.maxUsers ?? 0
  );
  const maxUsers = Number(doc.maxUsers ?? maxStaff);
  const displayName =
    (doc as { displayName?: string }).displayName?.trim() || doc.name;

  return {
    id: String(doc._id),
    planKey: resolvePlanKey((doc as { planKey?: string | null }).planKey, slug),
    name: doc.name,
    displayName,
    slug,
    description: doc.description ?? "",
    monthlyPrice: Number(doc.monthlyPrice ?? 0),
    yearlyPrice: Number(doc.yearlyPrice ?? 0),
    currency: doc.currency ?? "INR",
    trialDays: Number(doc.trialDays ?? 0),
    maxBranches: Number(doc.maxBranches ?? 0),
    maxStaff,
    maxUsers,
    maxOrdersPerMonth: Number(doc.maxOrdersPerMonth ?? 0),
    maxMenuItems: Number(doc.maxMenuItems ?? 0),
    maxTables: Number(doc.maxTables ?? 0),
    maxCustomers: Number(
      (doc as { maxCustomers?: number }).maxCustomers ?? 0
    ),
    storageLimit: Number(doc.storageLimit ?? 0),
    features: (doc.features ?? []) as SaasFeatureKey[],
    isPopular: Boolean(doc.isPopular),
    isActive: Boolean(doc.isActive),
    sortOrder: Number(doc.sortOrder ?? 100),
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt: toIso(doc.createdAt) ?? "",
    updatedAt: toIso(doc.updatedAt) ?? "",
  };
}

function serializePendingChange(
  value: RestaurantSubscriptionDocument["pendingPlanChange"]
): PendingPlanChange | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as {
    planId?: unknown;
    mode?: "upgrade" | "downgrade";
    billingCycle?: BillingCycle | null;
    scheduledFor?: unknown;
    reason?: string | null;
  };
  if (!raw.mode || !raw.planId) return null;
  return {
    planId: idToString(raw.planId) ?? "",
    mode: raw.mode,
    billingCycle: raw.billingCycle ?? null,
    scheduledFor: toIso(raw.scheduledFor),
    reason: raw.reason ?? null,
  };
}

export function serializeSubscription(
  doc: RestaurantSubscriptionDocument,
  plan?: { name: string; slug: string } | null
): RestaurantSubscription {
  const status = (doc.status ?? "pending") as SaasSubscriptionStatus;
  const trialStart = toIso(doc.trialStart);
  const trialEnd = toIso(doc.trialEnd);
  const subscriptionStart = toIso(doc.subscriptionStart);
  const subscriptionEnd = toIso(doc.subscriptionEnd);
  const currentPeriodStart =
    toIso((doc as { currentPeriodStart?: unknown }).currentPeriodStart) ??
    subscriptionStart ??
    trialStart;
  const currentPeriodEnd =
    toIso((doc as { currentPeriodEnd?: unknown }).currentPeriodEnd) ??
    subscriptionEnd ??
    trialEnd;

  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    planId: idToString(doc.planId) ?? "",
    planName: plan?.name ?? "",
    planSlug: plan?.slug ?? "",
    status,
    effectiveStatus: normalizeSubscriptionStatus(status),
    billingCycle: (doc.billingCycle ?? "monthly") as BillingCycle,
    startDate: subscriptionStart ?? trialStart,
    trialStartDate: trialStart,
    trialEndDate: trialEnd,
    trialStart,
    trialEnd,
    subscriptionStart,
    subscriptionEnd,
    currentPeriodStart,
    currentPeriodEnd,
    gracePeriodEnd: toIso(
      (doc as { gracePeriodEnd?: unknown }).gracePeriodEnd
    ),
    renewalDate: toIso(doc.renewalDate),
    cancelledAt: toIso(doc.cancelledAt),
    cancelAtPeriodEnd: Boolean(
      (doc as { cancelAtPeriodEnd?: boolean }).cancelAtPeriodEnd
    ),
    pendingPlanChange: serializePendingChange(
      (doc as { pendingPlanChange?: RestaurantSubscriptionDocument["pendingPlanChange"] })
        .pendingPlanChange
    ),
    provider: (doc as { provider?: string | null }).provider ?? null,
    providerSubscriptionId:
      (doc as { providerSubscriptionId?: string | null })
        .providerSubscriptionId ?? null,
    paymentStatus: ((doc as { paymentStatus?: PaymentProviderStatus })
      .paymentStatus ?? "not_configured") as PaymentProviderStatus,
    licenseKey: doc.licenseKey ?? "",
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt: toIso(doc.createdAt) ?? "",
    updatedAt: toIso(doc.updatedAt) ?? "",
  };
}

export function serializeUsage(doc: UsageMetricsDocument): UsageMetrics {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    periodKey: doc.periodKey,
    users: Number(doc.users ?? 0),
    branches: Number(doc.branches ?? 0),
    orders: Number(doc.orders ?? 0),
    storage: Number(doc.storage ?? 0),
    apiRequests: Number(doc.apiRequests ?? 0),
    menuItems: Number(doc.menuItems ?? 0),
    customers: Number(doc.customers ?? 0),
    inventoryItems: Number(doc.inventoryItems ?? 0),
    tables: Number((doc as { tables?: number }).tables ?? 0),
    updatedAt: toIso(doc.updatedAt) ?? "",
  };
}

export function serializeInvoice(
  doc: InvoiceFoundationDocument
): InvoiceFoundation {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    subscriptionId: idToString(doc.subscriptionId),
    planId: idToString(doc.planId),
    invoiceNumber: doc.invoiceNumber,
    amount: Number(doc.amount ?? 0),
    currency: doc.currency ?? "INR",
    status: (doc.status ?? "draft") as InvoiceFoundationStatus,
    billingCycle: (doc.billingCycle ?? "monthly") as BillingCycle,
    periodStart: toIso(doc.periodStart),
    periodEnd: toIso(doc.periodEnd),
    paymentPlaceholder: doc.paymentPlaceholder ?? "",
    refundPlaceholder: doc.refundPlaceholder ?? "",
    couponPlaceholder: doc.couponPlaceholder ?? "",
    taxPlaceholder: Number(doc.taxPlaceholder ?? 0),
    issuedAt: toIso(doc.issuedAt),
    paidAt: toIso(doc.paidAt),
    createdAt: toIso(doc.createdAt) ?? "",
    updatedAt: toIso(doc.updatedAt) ?? "",
  };
}

export function serializeFeatureAccess(
  doc: FeatureAccessDocument
): FeatureAccess {
  const overrides: FeatureAccess["overrides"] = {};
  const raw = doc.overrides as
    | Map<string, boolean>
    | Record<string, boolean>
    | undefined;
  if (raw instanceof Map) {
    for (const [key, value] of raw.entries()) {
      overrides[key as SaasFeatureKey] = Boolean(value);
    }
  } else if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) {
      overrides[key as SaasFeatureKey] = Boolean(value);
    }
  }

  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    features: (doc.features ?? []) as SaasFeatureKey[],
    overrides,
    updatedAt: toIso(doc.updatedAt) ?? "",
  };
}
