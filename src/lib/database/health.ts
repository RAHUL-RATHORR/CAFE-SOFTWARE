import mongoose from "mongoose";
import { databaseConfig } from "@/config/database";
import { connectToDatabase } from "@/lib/database/connection";
import { handleDatabaseError } from "@/lib/database/errors";
import { getConnectionState } from "@/lib/database/helpers";
import type { DatabaseHealthResult } from "@/types/database";

/**
 * Lightweight MongoDB health probe for ops readiness checks.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const checkedAt = new Date().toISOString();
  const started = Date.now();

  try {
    if (!databaseConfig.uri) {
      return {
        status: "unknown",
        ok: false,
        latencyMs: null,
        message: "MONGODB_URI is not configured",
        checkedAt,
      };
    }

    await connectToDatabase();

    const db = mongoose.connection.db;
    if (!db) {
      return {
        status: "unhealthy",
        ok: false,
        latencyMs: Date.now() - started,
        message: `Connection state: ${getConnectionState()}`,
        checkedAt,
      };
    }

    await Promise.race([
      db.admin().ping(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Health check timed out")),
          databaseConfig.healthTimeoutMs
        )
      ),
    ]);

    return {
      status: "healthy",
      ok: true,
      latencyMs: Date.now() - started,
      message: "MongoDB ping succeeded",
      checkedAt,
    };
  } catch (error) {
    const normalized = handleDatabaseError(error, "MongoDB health check failed");
    return {
      status: "unhealthy",
      ok: false,
      latencyMs: Date.now() - started,
      message: normalized.message,
      checkedAt,
    };
  }
}
