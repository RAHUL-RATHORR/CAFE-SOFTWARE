/**
 * Promote a user to super-admin (local/dev helper).
 *
 * Usage:
 *   node --env-file=.env.local scripts/promote-super-admin.mjs
 *   node --env-file=.env.production scripts/promote-super-admin.mjs admin@dineflow.local
 *
 * After running: log out and log back in so the JWT picks up the new role.
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const emailArg = process.argv[2];
const email = (
  emailArg ||
  process.env.AUTH_DEMO_EMAIL ||
  "admin@dineflow.local"
)
  .trim()
  .toLowerCase();

const uri = process.env.MONGODB_URI?.trim();
const dbName = process.env.MONGODB_DB_NAME?.trim() || undefined;

if (!uri) {
  console.error("MONGODB_URI is missing. Pass --env-file with a valid URI.");
  process.exit(1);
}

await mongoose.connect(uri, dbName ? { dbName } : undefined);

const users = mongoose.connection.collection("users");
const existing = await users.findOne({ email });

if (!existing) {
  const password =
    process.env.AUTH_DEMO_PASSWORD?.trim() || "Demo@12345";
  const hash = await bcrypt.hash(password, 10);
  const now = new Date();
  const inserted = await users.insertOne({
    name: "Super Admin",
    email,
    password: hash,
    role: "super-admin",
    status: "active",
    mustChangePassword: false,
    emailVerified: true,
    phone: "",
    avatar: "",
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`Created super-admin user ${email} (${inserted.insertedId})`);
  console.log(`Password: ${password}`);
} else {
  await users.updateOne(
    { email },
    {
      $set: {
        role: "super-admin",
        status: "active",
        isDeleted: false,
        updatedAt: new Date(),
      },
    }
  );
  console.log(`Updated ${email} → role=super-admin (was: ${existing.role})`);
}

console.log("Next: log out of the app, then log in again.");
await mongoose.disconnect();
