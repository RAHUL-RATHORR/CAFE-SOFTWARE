import { z } from "zod";

/**
 * Environment configuration for DineFlow infrastructure.
 * Supports development, staging, and production via APP_ENV / NODE_ENV.
 */

export const appEnvironmentSchema = z.enum([
  "development",
  "staging",
  "production",
]);

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_ENV: appEnvironmentSchema.optional(),
    NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default("DineFlow"),
    NEXT_PUBLIC_APP_VERSION: z.string().trim().min(1).optional(),
    NEXT_PUBLIC_BUILD_ID: z.string().trim().min(1).optional(),
    MONGODB_URI: z
      .string()
      .trim()
      .min(1, "MONGODB_URI is required")
      .optional()
      .or(z.literal("")),
    MONGODB_DB_NAME: z.string().trim().min(1).optional().or(z.literal("")),
    AUTH_SECRET: z.string().trim().min(1).optional().or(z.literal("")),
    AUTH_URL: z.string().trim().url().optional().or(z.literal("")),
    LOG_LEVEL: z
      .enum(["debug", "info", "warning", "error", "critical"])
      .optional(),
    RATE_LIMIT_ENABLED: z
      .enum(["true", "false"])
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    /** Enforce secrets only when APP_ENV is explicitly staging/production
     * so local `next build` (NODE_ENV=production) remains usable. */
    const appEnv = data.APP_ENV;
    if (appEnv !== "production" && appEnv !== "staging") return;

    if (!data.MONGODB_URI) {
      ctx.addIssue({
        code: "custom",
        path: ["MONGODB_URI"],
        message: "MONGODB_URI is required in staging/production",
      });
    }
    if (!data.AUTH_SECRET || data.AUTH_SECRET.length < 32) {
      ctx.addIssue({
        code: "custom",
        path: ["AUTH_SECRET"],
        message:
          "AUTH_SECRET must be at least 32 characters in staging/production",
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    APP_ENV: process.env.APP_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    LOG_LEVEL: process.env.LOG_LEVEL,
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
        .join("; ")}`
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/** Soft validation for boot diagnostics — never throws. */
export function validateEnvSoft(): {
  ok: boolean;
  environment: string;
  issues: string[];
} {
  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    APP_ENV: process.env.APP_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    LOG_LEVEL: process.env.LOG_LEVEL,
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED,
  });

  if (parsed.success) {
    return {
      ok: true,
      environment:
        parsed.data.APP_ENV ??
        (parsed.data.NODE_ENV === "production"
          ? "production"
          : "development"),
      issues: [],
    };
  }

  return {
    ok: false,
    environment: process.env.APP_ENV ?? process.env.NODE_ENV ?? "unknown",
    issues: parsed.error.issues.map(
      (issue) => `${issue.path.join(".") || "env"}: ${issue.message}`
    ),
  };
}

export function getMongoUri(): string | undefined {
  const uri = process.env.MONGODB_URI?.trim();
  return uri ? uri : undefined;
}

export function requireMongoUri(): string {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI. Add it to your environment variables."
    );
  }
  return uri;
}

export function getAppEnvironment():
  | "development"
  | "staging"
  | "production" {
  const env = getEnv();
  if (env.APP_ENV) return env.APP_ENV;
  return env.NODE_ENV === "production" ? "production" : "development";
}
