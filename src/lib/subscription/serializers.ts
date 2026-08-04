import type { SubscriptionPlanDocument } from "@/models/subscription";
import type { RestaurantSubscriptionDocument } from "@/models/subscription";
import type { UsageMetricsDocument } from "@/models/subscription";
import type { InvoiceFoundationDocument } from "@/models/subscription";
import type { FeatureAccessDocument } from "@/models/subscription";
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
} from "@/types/subscription";
import type { SubscriptionPlan as LegacyPlan } from "@/types/restaurant";
import type { SubscriptionStatus as LegacyStatus } from "@/types/restaurant";

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

export function currentPeriodKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

export function daysRemaining(end: string | Date | null | undefined): number | null {
  if (!end) return null;
  const endDate = end instanceof Date ? end : new Date(end);
  if (Number.isNaN(endDate.getTime())) return null;
  const diff = endDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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

export function formatMoney(amount: number, currency = "USD"): string {
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
  switch (status) {
    case "trial":
    case "pending":
      return "trialing";
    case "active":
      return "active";
    case "suspended":
      return "past_due";
    case "cancelled":
      return "cancelled";
    case "expired":
    default:
      return "inactive";
  }
}

/** Map plan slug → legacy restaurant.subscriptionPlan when compatible */
export function toLegacyPlanSlug(slug: string): LegacyPlan {
  if (slug === "free" || slug === "starter" || slug === "pro" || slug === "enterprise") {
    return slug;
  }
  return "starter";
}

export function serializePlan(
  doc: SubscriptionPlanDocument
): SubscriptionPlanEntity {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? "",
    monthlyPrice: Number(doc.monthlyPrice ?? 0),
    yearlyPrice: Number(doc.yearlyPrice ?? 0),
    currency: doc.currency ?? "USD",
    trialDays: Number(doc.trialDays ?? 0),
    maxBranches: Number(doc.maxBranches ?? 0),
    maxUsers: Number(doc.maxUsers ?? 0),
    maxOrdersPerMonth: Number(doc.maxOrdersPerMonth ?? 0),
    maxMenuItems: Number(doc.maxMenuItems ?? 0),
    maxTables: Number(doc.maxTables ?? 0),
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

export function serializeSubscription(
  doc: RestaurantSubscriptionDocument,
  plan?: { name: string; slug: string } | null
): RestaurantSubscription {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    planId: idToString(doc.planId) ?? "",
    planName: plan?.name ?? "",
    planSlug: plan?.slug ?? "",
    status: (doc.status ?? "pending") as SaasSubscriptionStatus,
    billingCycle: (doc.billingCycle ?? "monthly") as BillingCycle,
    trialStart: toIso(doc.trialStart),
    trialEnd: toIso(doc.trialEnd),
    subscriptionStart: toIso(doc.subscriptionStart),
    subscriptionEnd: toIso(doc.subscriptionEnd),
    renewalDate: toIso(doc.renewalDate),
    cancelledAt: toIso(doc.cancelledAt),
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
    currency: doc.currency ?? "USD",
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
