import { getMongoUri } from "@/config/env";

export const databaseConfig = {
  /** Primary connection string (may be empty until configured) */
  get uri() {
    return getMongoUri() ?? "";
  },
  /** Optional explicit database name override */
  dbName: process.env.MONGODB_DB_NAME?.trim() || undefined,
  options: {
    bufferCommands: false as const,
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4 // IPv4, skip trying IPv6
  },
  /** Soft timeout hint for health checks (ms) */
  healthTimeoutMs: 5_000,
} as const;

export type DatabaseConfig = typeof databaseConfig;
