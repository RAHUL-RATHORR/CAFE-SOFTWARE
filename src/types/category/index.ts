import type { PaginationMeta } from "@/types/database";

export type Category = {
  id: string;
  restaurantId: string;
  branchId: string | null;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  color: string;
  icon: string;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryListResult = {
  items: Category[];
  meta: PaginationMeta;
};

export type CategorySortField =
  | "name"
  | "slug"
  | "displayOrder"
  | "createdAt"
  | "isActive";

export type CategoryActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_SLUG"
  | "DATABASE_ERROR"
  | "UNEXPECTED_ERROR"
  | "NO_RESTAURANT";

export type CategoryActionError = {
  code: CategoryActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type CategoryActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: CategoryActionError };
