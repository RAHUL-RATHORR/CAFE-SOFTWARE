/**
 * MongoDB Auth.js adapter preparation.
 * Not wired into the active session strategy (JWT + Credentials).
 * Enable later when user persistence is introduced.
 */

import type { Adapter } from "@auth/core/adapters";

let cachedAdapter: Adapter | null | undefined;

export async function createMongoAuthAdapter(): Promise<Adapter | null> {
  if (cachedAdapter !== undefined) {
    return cachedAdapter;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    cachedAdapter = null;
    return null;
  }

  try {
    const { MongoClient } = await import("mongodb");
    const { MongoDBAdapter } = await import("@auth/mongodb-adapter");

    const client = new MongoClient(uri);
    const clientPromise = client.connect().then(() => client);
    cachedAdapter = MongoDBAdapter(clientPromise);
    return cachedAdapter;
  } catch {
    cachedAdapter = null;
    return null;
  }
}
