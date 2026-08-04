import { productionConfig } from "@/config/production";
import { validateEnvSoft } from "@/config/env";
import { checkDatabaseHealth } from "@/lib/database/health";
import { monitoring } from "@/lib/monitoring";
import type {
  ApplicationHealthResult,
  ComponentHealth,
  HealthStatus,
} from "@/types/production";

const startedAt = Date.now();

function worstStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes("unhealthy")) return "unhealthy";
  if (statuses.includes("degraded")) return "degraded";
  return "healthy";
}

/**
 * Aggregated application health for load balancers and ops.
 */
export async function getApplicationHealth(): Promise<ApplicationHealthResult> {
  const checkedAt = new Date().toISOString();
  const components: ComponentHealth[] = [];

  const envCheck = validateEnvSoft();
  components.push({
    name: "environment",
    status: envCheck.ok ? "healthy" : "degraded",
    ok: envCheck.ok,
    latencyMs: null,
    message: envCheck.ok
      ? `Environment OK (${envCheck.environment})`
      : envCheck.issues.join("; "),
  });

  components.push({
    name: "application",
    status: "healthy",
    ok: true,
    latencyMs: null,
    message: `${productionConfig.app.name} ${productionConfig.app.version}`,
  });

  if (productionConfig.health.includeDatabase) {
    const db = await checkDatabaseHealth();
    components.push({
      name: "database",
      status:
        db.status === "healthy"
          ? "healthy"
          : db.status === "unknown"
            ? "degraded"
            : "unhealthy",
      ok: db.ok,
      latencyMs: db.latencyMs,
      message: db.message,
    });
  }

  const snapshot = monitoring.snapshot();
  components.push({
    name: "monitoring",
    status: "healthy",
    ok: true,
    latencyMs: null,
    message: `requests=${snapshot.requestCount}; slow=${snapshot.slowOperationCount}; errors=${snapshot.errorCount}`,
  });

  const status = worstStatus(components.map((c) => c.status));

  return {
    status,
    ok: status !== "unhealthy",
    version: productionConfig.app.version,
    buildId: productionConfig.app.buildId,
    environment: productionConfig.app.environment,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    checkedAt,
    components,
  };
}

export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - startedAt) / 1000);
}
