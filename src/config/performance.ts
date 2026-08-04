/**
 * Centralized performance configuration for DineFlow.
 * Complements productionConfig — no external APM/cache providers.
 */

export const performanceConfig = {
  webVitals: {
    enabled: process.env.NEXT_PUBLIC_WEB_VITALS !== "false",
    /** Sample rate 0–1 for high-traffic environments */
    sampleRate: Number(process.env.WEB_VITALS_SAMPLE_RATE ?? 1),
    /** Soft budgets (ms / score) for monitoring warnings */
    budgets: {
      LCP: 2500,
      INP: 200,
      CLS: 0.1,
      FCP: 1800,
      TTFB: 800,
    },
  },
  caching: {
    /** Next.js Data Cache tags used by unstable_cache wrappers */
    tags: {
      dashboard: "cache:dashboard",
      reports: "cache:reports",
      menu: "cache:menu",
      settings: "cache:settings",
      lookup: "cache:lookup",
      reference: "cache:reference",
    },
    ttlSeconds: {
      dashboard: 30,
      reports: 120,
      menu: 60,
      settings: 90,
      lookup: 300,
      reference: 600,
    },
  },
  images: {
    enabled: true,
    sizes: {
      avatar: "(max-width: 768px) 40px, 48px",
      card: "(max-width: 768px) 100vw, 33vw",
      hero: "100vw",
      thumb: "96px",
    },
    quality: 75,
  },
  fonts: {
    display: "swap" as const,
    adjustFontFallback: true,
    preload: true,
  },
  bundle: {
    analyze: process.env.ANALYZE === "true",
    optimizePackages: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "recharts",
      "@base-ui/react",
    ] as const,
  },
  tables: {
    defaultPageSize: 20,
    maxPageSize: 100,
    /** Soft threshold where virtualization should be considered */
    virtualizationThreshold: 100,
    overscan: 8,
  },
  routes: {
    prefetch: true,
    defaultRevalidate: 60,
  },
} as const;

export type PerformanceConfig = typeof performanceConfig;
export type WebVitalName = keyof typeof performanceConfig.webVitals.budgets;
export type CacheTagKey = keyof typeof performanceConfig.caching.tags;
