import type { Metadata } from "next";
import { appConfig, siteConfig } from "@/config";

const siteUrl =
  process.env.AUTH_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: appConfig.name,
  keywords: [
    "restaurant POS",
    "kitchen display",
    "QR ordering",
    "DineFlow",
    "SaaS",
  ],
  authors: [{ name: appConfig.companyName }],
  creator: appConfig.companyName,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: appConfig.name,
    title: appConfig.name,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: appConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: process.env.APP_ENV === "production",
    follow: process.env.APP_ENV === "production",
  },
  alternates: {
    canonical: "/",
  },
};

export function getSiteUrl() {
  return siteUrl;
}
