"use client";

import { useEffect } from "react";
import {
  observeWebVitals,
  reportWebVital,
  type WebVitalMetric,
} from "@/lib/performance/web-vitals";
import { performanceConfig } from "@/config/performance";

/**
 * Reports Core Web Vitals (LCP, INP, CLS, FCP, TTFB) to the monitoring foundation.
 */
export function useWebVitals(
  onReport?: (metric: WebVitalMetric) => void
): void {
  useEffect(() => {
    if (!performanceConfig.webVitals.enabled) return;
    return observeWebVitals(onReport ?? reportWebVital);
  }, [onReport]);
}
