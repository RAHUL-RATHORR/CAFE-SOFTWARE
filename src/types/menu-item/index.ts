import type { PaginationMeta } from "@/types/database";

export type MenuItemCustomizationOption = {
  id: string;
  name: string;
  priceDelta: number;
  isAvailable: boolean;
};

export type MenuItemCustomizationGroup = {
  id: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  options: MenuItemCustomizationOption[];
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  categoryId: string;
  categoryName?: string | null;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  image: string;
  gallery: string[];
  price: number;
  discountPrice: number | null;
  taxRate: number;
  preparationTime: number;
  calories: number | null;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  displayOrder: number;
  tags: string[];
  customizationGroups: MenuItemCustomizationGroup[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MenuItemListResult = {
  items: MenuItem[];
  meta: PaginationMeta;
};

export type MenuItemSortField =
  | "name"
  | "slug"
  | "price"
  | "displayOrder"
  | "createdAt"
  | "isAvailable"
  | "isFeatured";

export type MenuItemActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_SLUG"
  | "DUPLICATE_SKU"
  | "CATEGORY_NOT_FOUND"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type MenuItemActionError = {
  code: MenuItemActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type MenuItemActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: MenuItemActionError };

export type CategoryOption = {
  value: string;
  label: string;
};
