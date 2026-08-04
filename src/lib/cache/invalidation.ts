import { revalidateTag } from "next/cache";
import { performanceConfig, type CacheTagKey } from "@/config/performance";
import { appCache } from "@/lib/cache";
import { logger } from "@/lib/logger";

/**
 * Invalidation strategy — clears process cache + Next data cache tags.
 * Redis invalidation hooks in later without changing callers.
 */
export function invalidateCacheNamespace(namespace: CacheTagKey): void {
  const tag = performanceConfig.caching.tags[namespace];
  try {
    revalidateTag(tag);
  } catch {
    // revalidateTag is a no-op outside of Next request/action contexts
  }

  const localNs =
    namespace === "reference"
      ? "lookup"
      : (namespace as "dashboard" | "reports" | "menu" | "settings" | "lookup");
  appCache.invalidate(localNs);
  logger.debug("Cache namespace invalidated", {
    operation: "cache.invalidateNamespace",
    namespace,
    tag,
  });
}

export function invalidateCacheTags(tags: string[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch {
      /* ignore outside Next runtime */
    }
  }
  appCache.invalidatePlaceholder(tags);
}
