import type { BranchDocument } from "@/models/branch";
import type {
  Branch,
  BranchOpeningHoursDay,
  BranchStatus,
} from "@/types/branch";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  return String(value);
}

function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return value.toISOString();
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

type BranchDocExtras = BranchDocument & {
  gstin?: string;
  openingTime?: string;
  closingTime?: string;
};

export function serializeBranch(
  doc: BranchDocument,
  extras?: { tableCount?: number }
): Branch {
  const extended = doc as BranchDocExtras;
  const days = (doc.openingHours?.days ?? []).map(
    (day): BranchOpeningHoursDay => ({
      day: day.day as BranchOpeningHoursDay["day"],
      open: day.open ?? "",
      close: day.close ?? "",
      isClosed: Boolean(day.isClosed),
    })
  );

  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    name: doc.name,
    branchCode: doc.branchCode,
    email: doc.email,
    phone: doc.phone,
    managerId: idToString(doc.managerId),
    address: doc.address,
    city: doc.city,
    state: doc.state,
    country: doc.country,
    postalCode: doc.postalCode,
    timezone: doc.timezone,
    currency: doc.currency,
    status: (doc.status ?? "active") as BranchStatus,
    openingHours: doc.openingHours
      ? {
          timezone: doc.openingHours.timezone ?? "",
          days,
          notes: doc.openingHours.notes ?? "",
        }
      : undefined,
    coordinates: doc.coordinates
      ? {
          latitude: doc.coordinates.latitude ?? null,
          longitude: doc.coordinates.longitude ?? null,
        }
      : undefined,
    gstin: extended.gstin ?? "",
    openingTime: extended.openingTime ?? "",
    closingTime: extended.closingTime ?? "",
    isMainBranch: Boolean(doc.isMainBranch),
    tableCount: extras?.tableCount,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function formatBranchDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}
