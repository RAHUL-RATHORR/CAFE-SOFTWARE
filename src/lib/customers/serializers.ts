import type { CustomerDocument } from "@/models/customer";
import type {
  Customer,
  CustomerAddress,
  CustomerGender,
  CustomerNote,
  CustomerPreferredOrderType,
  CustomerStatus,
  CustomerStatusHistoryEntry,
} from "@/types/customer";
import { LOYALTY_TIER_PLACEHOLDERS } from "@/config/customers";
import {
  buildReferralCodePlaceholder,
  resolveRewardLevelPlaceholder,
} from "@/lib/customers/loyalty";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function buildFullName(firstName: string, lastName?: string | null) {
  return [firstName.trim(), (lastName ?? "").trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function buildCustomerCode(date = new Date()): string {
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `CUS-${y}${m}${d}-${suffix}`;
}

export function serializeCustomer(doc: CustomerDocument): Customer {
  const loyaltyMeta = (doc.loyaltyMeta ?? {}) as {
    rewardLevel?: string | null;
    membershipTier?: string | null;
    couponCodes?: string[];
    referralCode?: string | null;
  };
  const points = doc.loyaltyPoints ?? 0;
  const reward = resolveRewardLevelPlaceholder(
    points,
    LOYALTY_TIER_PLACEHOLDERS.map((tier) => ({ ...tier }))
  );

  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    customerCode: doc.customerCode,
    firstName: doc.firstName,
    lastName: doc.lastName ?? "",
    fullName: doc.fullName || buildFullName(doc.firstName, doc.lastName),
    email: doc.email ?? "",
    phone: doc.phone,
    dateOfBirth: toIsoDate(doc.dateOfBirth),
    anniversary: toIsoDate(doc.anniversary),
    gender: (doc.gender ?? null) as CustomerGender | null,
    avatar: doc.avatar ?? "",
    addresses: ((doc.addresses ?? []) as CustomerAddress[]).map((address) => ({
      label: address.label ?? "Home",
      addressLine1: address.addressLine1 ?? "",
      addressLine2: address.addressLine2 ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
      country: address.country ?? "",
      postalCode: address.postalCode ?? "",
      landmark: address.landmark ?? "",
      isDefault: Boolean(address.isDefault),
    })),
    tags: (doc.tags ?? []).map(String),
    notes: doc.notes ?? "",
    noteEntries: ((doc.noteEntries ?? []) as Array<{
      _id?: unknown;
      body?: string;
      createdBy?: unknown;
      createdAt?: Date;
    }>).map((note) => ({
      id: String(note._id ?? cryptoRandom()),
      body: note.body ?? "",
      createdBy: idToString(note.createdBy),
      createdAt: toIsoDate(note.createdAt) ?? "",
    })) as CustomerNote[],
    loyaltyPoints: points,
    loyalty: {
      points,
      rewardLevel: loyaltyMeta.rewardLevel ?? reward?.label ?? null,
      membershipTier: loyaltyMeta.membershipTier ?? reward?.id ?? null,
      couponCodes: loyaltyMeta.couponCodes ?? [],
      referralCode:
        loyaltyMeta.referralCode ??
        buildReferralCodePlaceholder(doc.customerCode),
    },
    totalOrders: doc.totalOrders ?? 0,
    totalSpent: doc.totalSpent ?? 0,
    lastVisit: toIsoDate(doc.lastVisit),
    preferredOrderType: (doc.preferredOrderType ??
      "any") as CustomerPreferredOrderType,
    preferredTable: idToString(doc.preferredTable),
    status: (doc.status ?? "active") as CustomerStatus,
    statusHistory: ((doc.statusHistory ?? []) as Array<{
      status?: CustomerStatus;
      changedAt?: Date;
      changedBy?: unknown;
      note?: string;
    }>).map(
      (entry): CustomerStatusHistoryEntry => ({
        status: (entry.status ?? "active") as CustomerStatus,
        changedAt: toIsoDate(entry.changedAt) ?? "",
        changedBy: idToString(entry.changedBy),
        note: entry.note ?? "",
      })
    ),
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}

function cryptoRandom() {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatCustomerDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

export function formatCustomerDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatCustomerMoney(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}
