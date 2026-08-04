import type { CacheTagKey } from "@/config/performance";
import { performanceConfig } from "@/config/performance";

/**
 * Deterministic cache key builders for dashboard/reports/menu/settings/lookups.
 */
export function buildCacheKey(
  namespace: CacheTagKey,
  parts: Array<string | number | boolean | null | undefined>
): string {
  const normalized = parts
    .map((part) => {
      if (part == null) return "_";
      return String(part).trim().toLowerCase().replace(/\s+/g, "-");
    })
    .join(":");
  return `${namespace}:${normalized}`;
}

export function dashboardCacheKey(restaurantId: string, view = "summary") {
  return buildCacheKey("dashboard", [restaurantId, view]);
}

export function reportsCacheKey(
  restaurantId: string,
  reportKind: string,
  rangeKey: string
) {
  return buildCacheKey("reports", [restaurantId, reportKind, rangeKey]);
}

export function menuCacheKey(restaurantId: string, branchId?: string | null) {
  return buildCacheKey("menu", [restaurantId, branchId ?? "all"]);
}

export function settingsCacheKey(restaurantId: string, section: string) {
  return buildCacheKey("settings", [restaurantId, section]);
}

export function lookupCacheKey(resource: string, restaurantId?: string | null) {
  return buildCacheKey("lookup", [resource, restaurantId ?? "global"]);
}

export function referenceCacheKey(resource: string) {
  return buildCacheKey("reference", [resource]);
}

export function cacheTagFor(namespace: CacheTagKey): string {
  return performanceConfig.caching.tags[namespace];
}
