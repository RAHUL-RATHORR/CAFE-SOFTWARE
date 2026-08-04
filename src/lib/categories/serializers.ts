import type { CategoryDocument } from "@/models/category";
import type { Category } from "@/types/category";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return String(value);
  }
  return null;
}

export function serializeCategory(doc: CategoryDocument): Category {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? "",
    image: doc.image ?? "",
    displayOrder: doc.displayOrder ?? 0,
    color: doc.color || "#2563EB",
    icon: doc.icon ?? "",
    isActive: Boolean(doc.isActive),
    createdBy: idToString(doc.createdBy),
    updatedBy: idToString(doc.updatedBy),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt ?? ""),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt ?? ""),
  };
}

export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function formatCategoryDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}
