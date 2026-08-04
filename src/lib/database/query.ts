import { performanceConfig } from "@/config/performance";

/**
 * Repository query helpers — projection, lean defaults, pagination caps.
 * Does not change business repositories until callers opt in.
 */

export type ProjectionMap = Record<string, 0 | 1>;

export function buildProjection(
  fields: string[],
  mode: "include" | "exclude" = "include"
): ProjectionMap {
  const projection: ProjectionMap = {};
  for (const field of fields) {
    projection[field] = mode === "include" ? 1 : 0;
  }
  return projection;
}

export const leanQueryOptions = {
  lean: true as const,
  /** Prefer plain objects for list endpoints */
  virtuals: false,
};

export function clampPageSize(
  pageSize: number | undefined,
  fallback = performanceConfig.tables.defaultPageSize
): number {
  const size = pageSize ?? fallback;
  return Math.min(
    performanceConfig.tables.maxPageSize,
    Math.max(1, Math.floor(size))
  );
}

export function shouldPreferLean(operation: "list" | "detail" | "aggregate") {
  return operation === "list" || operation === "aggregate";
}

/** Index guidance — document expected compound indexes per domain. */
export const recommendedIndexHints = {
  orders: [
    "{ restaurantId: 1, createdAt: -1 }",
    "{ restaurantId: 1, status: 1, createdAt: -1 }",
  ],
  menuItems: [
    "{ restaurantId: 1, categoryId: 1, displayOrder: 1 }",
    "{ restaurantId: 1, isAvailable: 1 }",
  ],
  customers: [
    "{ restaurantId: 1, name: 1 }",
    "{ restaurantId: 1, email: 1 }",
  ],
} as const;
