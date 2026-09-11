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
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    APP_ENV: appEnvironmentSchema.optional(),
    PORT: z.string().optional(),
    
    APP_URL: z.string().url().optional(),
    FRONTEND_URL: z.string().url().optional(),
    BACKEND_URL: z.string().url().optional(),
    API_URL: z.string().url().optional(),
    
    MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required").optional().or(z.literal("")),
    MONGODB_DB_NAME: z.string().trim().min(1).optional().or(z.literal("")),
    
    AUTH_SECRET: z.string().trim().min(1).optional().or(z.literal("")),
    SESSION_SECRET: z.string().trim().min(1).optional().or(z.literal("")),
    JWT_SECRET: z.string().trim().min(1).optional().or(z.literal("")),
    
    CORS_ORIGINS: z.string().optional(),
    
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SECURE: z.enum(["true", "false"]).optional(),
    COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).optional(),
    
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    
    WHATSAPP_PROVIDER: z.string().optional(),
    WHATSAPP_API_KEY: z.string().optional(),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    
    SMS_PROVIDER: z.string().optional(),
    SMS_API_KEY: z.string().optional(),
    
    BACKUP_STORAGE_URL: z.string().optional(),
    BACKUP_STORAGE_KEY: z.string().optional(),

    LOG_LEVEL: z.enum(["debug", "info", "warning", "error", "critical"]).optional(),
    RATE_LIMIT_ENABLED: z.enum(["true", "false"]).optional().or(z.literal("")),
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
    PORT: process.env.PORT,
    APP_URL: process.env.APP_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    API_URL: process.env.API_URL,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    AUTH_SECRET: process.env.AUTH_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
    COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER,
    WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    SMS_PROVIDER: process.env.SMS_PROVIDER,
    SMS_API_KEY: process.env.SMS_API_KEY,
    BACKUP_STORAGE_URL: process.env.BACKUP_STORAGE_URL,
    BACKUP_STORAGE_KEY: process.env.BACKUP_STORAGE_KEY,
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
    PORT: process.env.PORT,
    APP_URL: process.env.APP_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    API_URL: process.env.API_URL,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    AUTH_SECRET: process.env.AUTH_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
    COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER,
    WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    SMS_PROVIDER: process.env.SMS_PROVIDER,
    SMS_API_KEY: process.env.SMS_API_KEY,
    BACKUP_STORAGE_URL: process.env.BACKUP_STORAGE_URL,
    BACKUP_STORAGE_KEY: process.env.BACKUP_STORAGE_KEY,
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
