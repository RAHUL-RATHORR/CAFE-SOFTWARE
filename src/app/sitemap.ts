import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/metadata";

/**
 * Sitemap foundation — public surfaces only.
 * Authenticated app routes are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return [
    {
      url: `${base}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/menu`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
