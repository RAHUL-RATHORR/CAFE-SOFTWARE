import { cache } from "react";
import { unstable_cache } from "next/cache";
import { performanceConfig, type CacheTagKey } from "@/config/performance";
import { productionConfig } from "@/config/production";
import { appCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { monitoring } from "@/lib/monitoring";

export const revalidateSeconds = productionConfig.performance.revalidateDefaults;

export function cacheControlFor(namespace: keyof typeof revalidateSeconds) {
  const seconds = revalidateSeconds[namespace];
  return `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`;
}

/** Marker for intentional dynamic client islands. */
export function dynamicImportPlaceholder(moduleName: string) {
  return { moduleName, strategy: "lazy" as const };
}

/**
 * Request-scoped memoization (React.cache).
 * Deduplicates identical work within a single RSC/request tree.
 */
export function createRequestMemo<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult> | TResult,
  name = "requestMemo"
) {
  const memoized = cache(async (...args: TArgs) => {
    const started = Date.now();
    try {
      return await fn(...args);
    } finally {
      monitoring.trackServerAction({
        name: `memo.${name}`,
        durationMs: Date.now() - started,
        success: true,
      });
    }
  });
  return memoized;
}

/**
 * Next.js Data Cache wrapper with tag-based invalidation.
 * Redis-compatible shape later: swap body to Redis client without API changes.
 */
export function cachedQuery<T>(options: {
  namespace: CacheTagKey;
  key: string;
  loader: () => Promise<T>;
  ttlSeconds?: number;
  tags?: string[];
}) {
  const ttl =
    options.ttlSeconds ??
    performanceConfig.caching.ttlSeconds[options.namespace];
  const tags = [
    performanceConfig.caching.tags[options.namespace],
    ...(options.tags ?? []),
  ];

  const cachedLoader = unstable_cache(
    async () => {
      const value = await options.loader();
      const localNs = mapNamespace(options.namespace);
      appCache.set(localNs, options.key, value, ttl);
      return value;
    },
    [`dineflow`, options.namespace, options.key],
    { revalidate: ttl, tags }
  );

  return cachedLoader();
}

function mapNamespace(
  namespace: CacheTagKey
): "dashboard" | "reports" | "menu" | "settings" | "lookup" {
  if (namespace === "reference") return "lookup";
  return namespace;
}

/** Redis-compatible cache adapter placeholder (in-memory today). */
export const distributedCacheAdapter = {
  provider: "memory" as "memory" | "redis-placeholder",
  async get<T>(key: string): Promise<T | null> {
    const [namespace, ...rest] = key.split(":");
    if (!namespace || rest.length === 0) return null;
    const ns = mapNamespaceSafe(namespace);
    if (!ns) return null;
    return appCache.get<T>(ns, rest.join(":"));
  },
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const [namespace, ...rest] = key.split(":");
    const ns = mapNamespaceSafe(namespace ?? "");
    if (!ns) return;
    appCache.set(ns, rest.join(":"), value, ttlSeconds);
  },
  async del(key: string): Promise<void> {
    const [namespace, ...rest] = key.split(":");
    const ns = mapNamespaceSafe(namespace ?? "");
    if (!ns) return;
    appCache.invalidate(ns, rest.join(":"));
  },
  /** Future: wire ioredis / Upstash without changing call sites */
  async connectRedisPlaceholder(): Promise<void> {
    logger.debug("Redis cache adapter placeholder — not connected", {
      operation: "cache.redisPlaceholder",
    });
  },
};

function mapNamespaceSafe(
  value: string
): "dashboard" | "reports" | "menu" | "settings" | "lookup" | null {
  if (
    value === "dashboard" ||
    value === "reports" ||
    value === "menu" ||
    value === "settings" ||
    value === "lookup"
  ) {
    return value;
  }
  if (value === "reference") return "lookup";
  return null;
}

export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  category: "api" | "server-action" | "database" | "cache" | "other" = "other"
): Promise<T> {
  return monitoring.timeAsync(name, category, fn);
}
