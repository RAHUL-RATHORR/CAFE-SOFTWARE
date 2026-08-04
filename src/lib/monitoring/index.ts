import { productionConfig } from "@/config/production";
import { logger } from "@/lib/logger";
import type {
  MonitoringSnapshot,
  OperationMetric,
} from "@/types/production";

const MAX_RECENT = 100;

const counters = {
  requestCount: 0,
  actionCount: 0,
  databaseQueryCount: 0,
  slowOperationCount: 0,
  errorCount: 0,
};

const recentOperations: OperationMetric[] = [];

function pushOperation(metric: OperationMetric) {
  recentOperations.unshift(metric);
  if (recentOperations.length > MAX_RECENT) {
    recentOperations.length = MAX_RECENT;
  }
}

function readMemoryPlaceholder(): MonitoringSnapshot["memoryUsagePlaceholder"] {
  if (!productionConfig.monitoring.memoryUsagePlaceholder) {
    return { rssMb: null, heapUsedMb: null };
  }
  try {
    if (typeof process !== "undefined" && typeof process.memoryUsage === "function") {
      const mem = process.memoryUsage();
      return {
        rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      };
    }
  } catch {
    /* Edge / restricted runtimes */
  }
  return { rssMb: null, heapUsedMb: null };
}

/**
 * Lightweight in-process monitoring foundation (no Datadog/Sentry/etc.).
 */
export const monitoring = {
  trackRequest(meta: {
    name: string;
    durationMs: number;
    success: boolean;
    requestId?: string;
  }) {
    if (!productionConfig.monitoring.enabled) return;
    counters.requestCount += 1;
    const slow = meta.durationMs >= productionConfig.monitoring.slowOperationMs;
    if (slow) counters.slowOperationCount += 1;
    if (!meta.success) counters.errorCount += 1;
    const metric: OperationMetric = {
      name: meta.name,
      category: "api",
      durationMs: meta.durationMs,
      success: meta.success,
      slow,
      requestId: meta.requestId,
      timestamp: new Date().toISOString(),
    };
    pushOperation(metric);
    if (slow) {
      logger.warning("Slow API request", {
        operation: meta.name,
        durationMs: meta.durationMs,
        requestId: meta.requestId,
      });
    }
  },

  trackServerAction(meta: {
    name: string;
    durationMs: number;
    success: boolean;
    requestId?: string;
  }) {
    if (
      !productionConfig.monitoring.enabled ||
      !productionConfig.monitoring.trackServerActions
    ) {
      return;
    }
    counters.actionCount += 1;
    const slow = meta.durationMs >= productionConfig.monitoring.slowOperationMs;
    if (slow) counters.slowOperationCount += 1;
    if (!meta.success) counters.errorCount += 1;
    pushOperation({
      name: meta.name,
      category: "server-action",
      durationMs: meta.durationMs,
      success: meta.success,
      slow,
      requestId: meta.requestId,
      timestamp: new Date().toISOString(),
    });
  },

  trackDatabaseQuery(meta: {
    name: string;
    durationMs: number;
    success: boolean;
    requestId?: string;
  }) {
    if (
      !productionConfig.monitoring.enabled ||
      !productionConfig.monitoring.trackDatabaseQueries
    ) {
      return;
    }
    counters.databaseQueryCount += 1;
    const slow = meta.durationMs >= productionConfig.monitoring.slowOperationMs;
    if (slow) counters.slowOperationCount += 1;
    if (!meta.success) counters.errorCount += 1;
    pushOperation({
      name: meta.name,
      category: "database",
      durationMs: meta.durationMs,
      success: meta.success,
      slow,
      requestId: meta.requestId,
      timestamp: new Date().toISOString(),
    });
  },

  async timeAsync<T>(
    name: string,
    category: OperationMetric["category"],
    fn: () => Promise<T>,
    requestId?: string
  ): Promise<T> {
    const started = Date.now();
    let success = true;
    try {
      return await fn();
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const durationMs = Date.now() - started;
      if (category === "api") {
        this.trackRequest({ name, durationMs, success, requestId });
      } else if (category === "server-action") {
        this.trackServerAction({ name, durationMs, success, requestId });
      } else if (category === "database") {
        this.trackDatabaseQuery({ name, durationMs, success, requestId });
      } else {
        const slow =
          durationMs >= productionConfig.monitoring.slowOperationMs;
        if (slow) counters.slowOperationCount += 1;
        if (!success) counters.errorCount += 1;
        pushOperation({
          name,
          category,
          durationMs,
          success,
          slow,
          requestId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  },

  snapshot(): MonitoringSnapshot {
    return {
      ...counters,
      memoryUsagePlaceholder: readMemoryPlaceholder(),
      cpuUsagePlaceholder: {
        percent: productionConfig.monitoring.cpuUsagePlaceholder ? null : null,
      },
      recentOperations: [...recentOperations],
    };
  },

  reset(): void {
    counters.requestCount = 0;
    counters.actionCount = 0;
    counters.databaseQueryCount = 0;
    counters.slowOperationCount = 0;
    counters.errorCount = 0;
    recentOperations.length = 0;
  },
};
