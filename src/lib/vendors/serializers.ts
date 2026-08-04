import type { VendorDocument } from "@/models/vendor";
import type { Vendor, VendorStatus } from "@/types/vendor";

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

export function buildVendorCode(date = new Date()): string {
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `VEN-${y}${m}${d}-${suffix}`;
}

export function serializeVendor(doc: VendorDocument): Vendor {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    vendorCode: doc.vendorCode,
    companyName: doc.companyName,
    contactPerson: doc.contactPerson ?? "",
    email: doc.email ?? "",
    phone: doc.phone,
    gstNumber: doc.gstNumber ?? "",
    address: doc.address ?? "",
    city: doc.city ?? "",
    state: doc.state ?? "",
    country: doc.country ?? "",
    postalCode: doc.postalCode ?? "",
    status: (doc.status ?? "active") as VendorStatus,
    rating: Number(doc.rating ?? 0),
    notes: doc.notes ?? "",
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt: toIsoDate(doc.createdAt) ?? "",
    updatedAt: toIsoDate(doc.updatedAt) ?? "",
  };
}

export function formatVendorDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    date
  );
}
