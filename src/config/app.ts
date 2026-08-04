export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "DineFlow",
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0-rc.1",
  buildId:
    process.env.NEXT_PUBLIC_BUILD_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    "local",
  companyName: "DineFlow Technologies",
  supportEmail: "support@dineflow.app",
  defaultCurrency: "USD",
  defaultTimezone: "UTC",
} as const;

export type AppConfig = typeof appConfig;
