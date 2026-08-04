export { productionConfig } from "@/config/production";
export {
  getEnv,
  validateEnvSoft,
  getAppEnvironment,
  requireMongoUri,
} from "@/config/env";

export { logger } from "@/lib/logger";
export {
  AppError,
  isAppError,
  normalizeError,
  validationError,
  authenticationError,
  authorizationError,
  businessError,
  clientError,
  notFoundError,
  rateLimitError,
  serverError,
} from "@/lib/errors";
export {
  createTraceContext,
  applyTraceHeaders,
  readTraceHeaders,
  elapsedMs,
  createId,
} from "@/lib/tracing";
export { appCache } from "@/lib/cache";
export { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
export {
  buildSecurityHeaders,
  applySecurityHeaders,
  getSecureCookieOptions,
  sanitizeText,
  sanitizeObjectStrings,
  maskSensitiveData,
} from "@/lib/security";
export { monitoring } from "@/lib/monitoring";
export { getApplicationHealth, getUptimeSeconds } from "@/lib/health";
export { recordAuditChange, buildAuditMetadata } from "@/lib/audit";
export {
  revalidateSeconds,
  cacheControlFor,
  createRequestMemo,
  cachedQuery,
  distributedCacheAdapter,
  measureAsync,
  dynamicImportPlaceholder,
} from "@/lib/performance";
export {
  observeWebVitals,
  reportWebVital,
} from "@/lib/performance/web-vitals";
export {
  buildCacheKey,
  dashboardCacheKey,
  menuCacheKey,
  invalidateCacheNamespace,
} from "@/lib/cache";
export { OptimizedImage } from "@/components/media";
export { WebVitalsReporter } from "@/components/performance";
export { useWebVitals } from "@/hooks/performance";
export {
  computeVirtualWindow,
  shouldVirtualize,
  sliceWindow,
} from "@/lib/tables/virtualization";
export { performanceConfig } from "@/config/performance";

export type {
  ApplicationHealthResult,
  MonitoringSnapshot,
  RateLimitResult,
  TraceContext,
  AuditChangePayload,
  LogContext,
} from "@/types/production";
