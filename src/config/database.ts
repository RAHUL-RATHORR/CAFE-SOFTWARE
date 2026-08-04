import { getMongoUri } from "@/config/env";

export const databaseConfig = {
  /** Primary connection string (may be empty until configured) */
  get uri() {
    return getMongoUri() ?? "";
  },
  /** Optional explicit database name override */
  dbName: process.env.MONGODB_DB_NAME?.trim() || undefined,
  /** Mongoose connect options shared by the connection helper */
  options: {
    bufferCommands: false as const,
  },
  /** Soft timeout hint for health checks (ms) */
  healthTimeoutMs: 5_000,
} as const;

export type DatabaseConfig = typeof databaseConfig;
