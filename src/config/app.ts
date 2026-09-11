import { APP_NAME, getAppVersion, getBuildId } from "@/config/version";

export const appConfig = {
  name: APP_NAME,
  version: getAppVersion(),
  buildId: getBuildId(),
  companyName: "DineFlow Technologies",
  supportEmail: "support@dineflow.app",
  defaultCurrency: "USD",
  defaultTimezone: "UTC",
} as const;

export type AppConfig = typeof appConfig;
