import { productionConfig, type CacheNamespace } from "@/config/production";
import { logger } from "@/lib/logger";

type CacheRecord<T> = {
  value: T;
  expiresAt: number;
  namespace: CacheNamespace;
};

const store = new Map<string, CacheRecord<unknown>>();

function buildKey(namespace: CacheNamespace, key: string): string {
  return `dineflow:${namespace}:${key}`;
}

function isExpired(entry: CacheRecord<unknown>): boolean {
  return Date.now() >= entry.expiresAt;
}

/**
 * In-memory caching foundation (no Redis).
 * Suitable for single-instance / process-local warm data.
 */
export const appCache = {
  get<T>(namespace: CacheNamespace, key: string): T | null {
    if (!productionConfig.caching.enabled) return null;
    const fullKey = buildKey(namespace, key);
    const entry = store.get(fullKey);
    if (!entry) return null;
    if (isExpired(entry)) {
      store.delete(fullKey);
      return null;
    }
    return entry.value as T;
  },

  set<T>(
    namespace: CacheNamespace,
    key: string,
    value: T,
    ttlSeconds?: number
  ): void {
    if (!productionConfig.caching.enabled) return;
    const ttl =
      ttlSeconds ??
      productionConfig.caching.namespaces[namespace] ??
      productionConfig.caching.defaultTtlSeconds;
    store.set(buildKey(namespace, key), {
      value,
      namespace,
      expiresAt: Date.now() + Math.max(1, ttl) * 1000,
    });
  },

  async getOrSet<T>(
    namespace: CacheNamespace,
    key: string,
    loader: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    const cached = this.get<T>(namespace, key);
    if (cached !== null) return cached;
    const value = await loader();
    this.set(namespace, key, value, ttlSeconds);
    return value;
  },

  invalidate(namespace: CacheNamespace, key?: string): number {
    if (key) {
      const fullKey = buildKey(namespace, key);
      const existed = store.delete(fullKey);
      logger.debug("Cache invalidate key", { operation: "cache.invalidate", namespace, key });
      return existed ? 1 : 0;
    }
    let removed = 0;
    for (const [fullKey, entry] of store.entries()) {
      if (entry.namespace === namespace) {
        store.delete(fullKey);
        removed += 1;
      }
    }
    logger.debug("Cache invalidate namespace", {
      operation: "cache.invalidate",
      namespace,
      removed,
    });
    return removed;
  },

  /** Placeholder for future tagged / distributed invalidation */
  invalidatePlaceholder(tags: string[]): void {
    logger.debug("Cache invalidation placeholder", {
      operation: "cache.invalidatePlaceholder",
      tags,
    });
  },

  clear(): void {
    store.clear();
  },

  size(): number {
    return store.size;
  },
};

export type AppCache = typeof appCache;

export {
  buildCacheKey,
  dashboardCacheKey,
  reportsCacheKey,
  menuCacheKey,
  settingsCacheKey,
  lookupCacheKey,
  referenceCacheKey,
  cacheTagFor,
} from "./keys";

export {
  invalidateCacheNamespace,
  invalidateCacheTags,
} from "./invalidation";
