/**
 * Centralized production / ops configuration for DineFlow.
 * Foundations only — no external APM, Redis, or queue integrations.
 */

export const APP_ENVIRONMENTS = [
  "development",
  "staging",
  "production",
] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export const LOG_LEVELS = [
  "debug",
  "info",
  "warning",
  "error",
  "critical",
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export const CACHE_NAMESPACES = [
  "dashboard",
  "reports",
  "menu",
  "settings",
  "lookup",
] as const;

export type CacheNamespace = (typeof CACHE_NAMESPACES)[number];

const isProd = process.env.NODE_ENV === "production";

function resolveAppEnvironment(): AppEnvironment {
  const raw = (process.env.APP_ENV ?? process.env.NODE_ENV ?? "development")
    .trim()
    .toLowerCase();
  if (raw === "staging" || raw === "production" || raw === "development") {
    return raw;
  }
  if (raw === "test") return "development";
  return isProd ? "production" : "development";
}

export const productionConfig = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME ?? "DineFlow",
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
    buildId:
      process.env.NEXT_PUBLIC_BUILD_ID ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      "local",
    environment: resolveAppEnvironment(),
    isProduction: isProd,
  },
  logging: {
    level: (process.env.LOG_LEVEL as LogLevel | undefined) ??
      (isProd ? "info" : "debug"),
    structured: true,
    includeStack: !isProd,
    redactKeys: [
      "password",
      "secret",
      "token",
      "authorization",
      "cookie",
      "auth_secret",
      "mongodb_uri",
      "apiKey",
      "api_key",
    ] as const,
  },
  monitoring: {
    enabled: true,
    slowOperationMs: Number(process.env.SLOW_OPERATION_MS ?? 1_000),
    trackServerActions: true,
    trackDatabaseQueries: true,
    memoryUsagePlaceholder: true,
    cpuUsagePlaceholder: true,
  },
  caching: {
    enabled: true,
    defaultTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 60),
    namespaces: {
      dashboard: Number(process.env.CACHE_TTL_DASHBOARD ?? 30),
      reports: Number(process.env.CACHE_TTL_REPORTS ?? 120),
      menu: Number(process.env.CACHE_TTL_MENU ?? 60),
      settings: Number(process.env.CACHE_TTL_SETTINGS ?? 90),
      lookup: Number(process.env.CACHE_TTL_LOOKUP ?? 300),
    } satisfies Record<CacheNamespace, number>,
  },
  security: {
    headersEnabled: true,
    cspEnabled: true,
    /** Report-only until nonce pipeline is fully wired for Next.js */
    cspReportOnly: true,
    maskSensitiveData: true,
    secureCookiesInProduction: true,
  },
  rateLimiting: {
    enabled:
      process.env.RATE_LIMIT_ENABLED === "true" ||
      process.env.APP_ENV === "production" ||
      process.env.APP_ENV === "staging",
    auth: {
      windowMs: 60_000,
      maxRequests: Number(process.env.RATE_LIMIT_AUTH_MAX ?? 60),
    },
    serverActions: {
      windowMs: 60_000,
      maxRequests: Number(process.env.RATE_LIMIT_ACTIONS_MAX ?? 120),
    },
    public: {
      windowMs: 60_000,
      maxRequests: Number(process.env.RATE_LIMIT_PUBLIC_MAX ?? 120),
    },
    api: {
      windowMs: 60_000,
      maxRequests: Number(process.env.RATE_LIMIT_API_MAX ?? 100),
    },
  },
  performance: {
    imageOptimization: true,
    revalidateDefaults: {
      dashboard: 30,
      reports: 120,
      menu: 60,
      settings: 90,
    },
    webVitalsReporting: true,
    bundleAnalyze: process.env.ANALYZE === "true",
  },
  tracing: {
    enabled: true,
    headerName: "x-request-id",
    correlationHeaderName: "x-correlation-id",
  },
  health: {
    path: "/api/health",
    includeDatabase: true,
    includeBuildInfo: true,
  },
} as const;

export type ProductionConfig = typeof productionConfig;
