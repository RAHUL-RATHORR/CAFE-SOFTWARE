import { productionConfig } from "@/config/production";
import type { RateLimitBucket, RateLimitResult } from "@/types/production";

type WindowState = {
  count: number;
  resetAt: number;
};

const windows = new Map<string, WindowState>();

function getBucketConfig(bucket: RateLimitBucket) {
  return productionConfig.rateLimiting[bucket];
}

/**
 * In-memory sliding fixed-window rate limiter foundation.
 * Per-process only — replace with edge/distributed store later.
 */
export function checkRateLimit(
  bucket: RateLimitBucket,
  identity: string
): RateLimitResult {
  const config = getBucketConfig(bucket);
  const now = Date.now();
  const key = `${bucket}:${identity}`;

  if (!productionConfig.rateLimiting.enabled) {
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
      retryAfterSeconds: 0,
    };
  }

  const existing = windows.get(key);
  if (!existing || now >= existing.resetAt) {
    const resetAt = now + config.windowMs;
    windows.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - 1),
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      ),
    };
  }

  existing.count += 1;
  windows.set(key, existing);
  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "x-ratelimit-limit": String(result.limit),
    "x-ratelimit-remaining": String(result.remaining),
    "x-ratelimit-reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed
      ? {}
      : { "retry-after": String(result.retryAfterSeconds) }),
  };
}

export function resetRateLimitStore(): void {
  windows.clear();
}
