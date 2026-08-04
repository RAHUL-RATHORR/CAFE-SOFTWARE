import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/metadata";

/**
 * Robots foundation — indexing enabled only in production APP_ENV.
 */
export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.APP_ENV === "production";
  const base = getSiteUrl();

  return {
    rules: isProd
      ? {
          userAgent: "*",
          allow: ["/", "/menu/"],
          disallow: [
            "/api/",
            "/admin/",
            "/dashboard/",
            "/settings/",
            "/login",
          ],
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
