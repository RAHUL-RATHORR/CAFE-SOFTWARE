import { appConfig } from "@/config/app";

export const siteConfig = {
  name: appConfig.name,
  description: "Restaurant Management SaaS",
  shortName: appConfig.name,
  url:
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000",
} as const;
