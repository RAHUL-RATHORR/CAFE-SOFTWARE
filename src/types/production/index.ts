/**
 * Production hardening domain types.
 */

import type {
  AppEnvironment,
  CacheNamespace,
  LogLevel,
} from "@/config/production";

export type { AppEnvironment, CacheNamespace, LogLevel };

export type LogContext = {
  requestId?: string;
  correlationId?: string;
  traceId?: string;
  userId?: string | null;
  restaurantId?: string | null;
  operation?: string;
  path?: string;
  method?: string;
  durationMs?: number;
  [key: string]: unknown;
};

export type StructuredLogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  environment: AppEnvironment;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
};

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "DATABASE_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "BUSINESS_ERROR"
  | "UNEXPECTED_ERROR"
  | "SERVER_ERROR"
  | "CLIENT_ERROR"
  | "RATE_LIMITED"
  | "NOT_FOUND";

export type AppErrorKind =
  | "validation"
  | "database"
  | "authentication"
  | "authorization"
  | "business"
  | "unexpected"
  | "server"
  | "client"
  | "rate_limit"
  | "not_found";

export type TraceContext = {
  requestId: string;
  correlationId: string;
  traceId: string;
  operation?: string;
  startedAt: number;
};

export type OperationMetric = {
  name: string;
  category: "api" | "server-action" | "database" | "cache" | "other";
  durationMs: number;
  success: boolean;
  slow: boolean;
  requestId?: string;
  timestamp: string;
};

export type MonitoringSnapshot = {
  requestCount: number;
  actionCount: number;
  databaseQueryCount: number;
  slowOperationCount: number;
  errorCount: number;
  memoryUsagePlaceholder: {
    rssMb: number | null;
    heapUsedMb: number | null;
  };
  cpuUsagePlaceholder: {
    percent: number | null;
  };
  recentOperations: OperationMetric[];
};

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export type ComponentHealth = {
  name: string;
  status: HealthStatus;
  ok: boolean;
  latencyMs: number | null;
  message: string;
};

export type ApplicationHealthResult = {
  status: HealthStatus;
  ok: boolean;
  version: string;
  buildId: string;
  environment: AppEnvironment;
  uptimeSeconds: number;
  checkedAt: string;
  components: ComponentHealth[];
};

export type CacheEntryMeta = {
  key: string;
  namespace: CacheNamespace;
  expiresAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export type RateLimitBucket =
  | "auth"
  | "serverActions"
  | "public"
  | "api";

export type AuditChangePayload = {
  entity: string;
  entityId?: string | null;
  action: string;
  userId?: string | null;
  userEmail?: string | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
  oldValuePlaceholder?: unknown;
  newValuePlaceholder?: unknown;
  ipPlaceholder?: string | null;
  devicePlaceholder?: string | null;
  message?: string;
  category?:
    | "login"
    | "subscription"
    | "restaurant"
    | "user"
    | "role"
    | "system"
    | "feature-flag";
  metadata?: Record<string, unknown>;
};

export type SecurityHeaderMap = Record<string, string>;
