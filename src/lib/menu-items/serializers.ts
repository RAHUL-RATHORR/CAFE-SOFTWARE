import type { MenuItemDocument } from "@/models/menu-item";
import type { MenuItem } from "@/types/menu-item";

function idToString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toString" in value) {
    return String(value);
  }
  return null;
}

export function serializeMenuItem(
  doc: MenuItemDocument,
  categoryName?: string | null
): MenuItem {
  return {
    id: String(doc._id),
    restaurantId: idToString(doc.restaurantId) ?? "",
    branchId: idToString(doc.branchId),
    categoryId: idToString(doc.categoryId) ?? "",
    categoryName: categoryName ?? null,
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? "",
    shortDescription: doc.shortDescription ?? "",
    sku: doc.sku ?? "",
    image: doc.image ?? "",
    gallery: Array.isArray(doc.gallery) ? doc.gallery.map(String) : [],
    price: doc.price ?? 0,
    discountPrice:
      doc.discountPrice === undefined || doc.discountPrice === null
        ? null
        : Number(doc.discountPrice),
    taxRate: doc.taxRate ?? 0,
    preparationTime: doc.preparationTime ?? 0,
    calories:
      doc.calories === undefined || doc.calories === null
        ? null
        : Number(doc.calories),
    isVeg: Boolean(doc.isVeg),
    isAvailable: Boolean(doc.isAvailable),
    isFeatured: Boolean(doc.isFeatured),
    displayOrder: doc.displayOrder ?? 0,
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    customizationGroups: Array.isArray(
      (doc as MenuItemDocument & { customizationGroups?: unknown })
        .customizationGroups
    )
      ? (
          (
            doc as MenuItemDocument & {
              customizationGroups: Array<{
                id?: string;
                name?: string;
                required?: boolean;
                min?: number;
                max?: number;
                options?: Array<{
                  id?: string;
                  name?: string;
                  priceDelta?: number;
                  isAvailable?: boolean;
                }>;
              }>;
            }
          ).customizationGroups ?? []
        ).map((group) => ({
          id: String(group.id ?? ""),
          name: String(group.name ?? ""),
          required: Boolean(group.required),
          min: Number(group.min ?? 0),
          max: Number(group.max ?? 1),
          options: (group.options ?? []).map((option) => ({
            id: String(option.id ?? ""),
            name: String(option.name ?? ""),
            priceDelta: Number(option.priceDelta ?? 0),
            isAvailable: option.isAvailable !== false,
          })),
        }))
      : [],
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

export function slugifyMenuItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export function formatMenuItemDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function formatMenuItemPrice(
  amount: number,
  currency = "INR"
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
