import mongoose from "mongoose";
import { databaseConfig } from "@/config/database";
import { requireMongoUri } from "@/config/env";
import { handleDatabaseError } from "@/lib/database/errors";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

/**
 * Cached MongoDB connection for Next.js.
 * Reuses a single connection across hot reloads in development.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  try {
    const uri = requireMongoUri();

    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      cached.promise = mongoose.connect(uri, {
        ...databaseConfig.options,
        ...(databaseConfig.dbName ? { dbName: databaseConfig.dbName } : {}),
      });
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw handleDatabaseError(error, "Failed to connect to MongoDB");
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (!cached.conn) return;

  await mongoose.disconnect();
  cached.conn = null;
  cached.promise = null;
}
