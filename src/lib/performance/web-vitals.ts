import type { WebVitalName } from "@/config/performance";
import { performanceConfig } from "@/config/performance";
import { logger } from "@/lib/logger";
import { monitoring } from "@/lib/monitoring";

export type WebVitalMetric = {
  name: WebVitalName | string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  id: string;
  navigationType?: string;
};

export function rateWebVital(
  name: string,
  value: number
): WebVitalMetric["rating"] {
  const budget =
    performanceConfig.webVitals.budgets[
      name as keyof typeof performanceConfig.webVitals.budgets
    ];
  if (budget == null) return "good";
  if (name === "CLS") {
    if (value <= 0.1) return "good";
    if (value <= 0.25) return "needs-improvement";
    return "poor";
  }
  if (value <= budget) return "good";
  if (value <= budget * 1.5) return "needs-improvement";
  return "poor";
}

function ratingFor(name: string, value: number): WebVitalMetric["rating"] {
  return rateWebVital(name, value);
}

export function reportWebVital(metric: WebVitalMetric): void {
  if (!performanceConfig.webVitals.enabled) return;
  if (Math.random() > performanceConfig.webVitals.sampleRate) return;

  const rating = metric.rating || ratingFor(metric.name, metric.value);
  monitoring.trackRequest({
    name: `web-vital.${metric.name}`,
    durationMs: metric.name === "CLS" ? metric.value * 1000 : metric.value,
    success: rating !== "poor",
  });

  const level = rating === "poor" ? "warning" : "info";
  logger[level](`Web Vital ${metric.name}`, {
    operation: "web-vitals",
    name: metric.name,
    value: metric.value,
    rating,
    id: metric.id,
  });
}

/**
 * Observe Core Web Vitals via native PerformanceObserver (no extra dependency).
 * Covers LCP, CLS, INP (Event Timing), FCP, TTFB where available.
 */
export function observeWebVitals(
  onReport: (metric: WebVitalMetric) => void = reportWebVital
): () => void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
    return () => undefined;
  }

  const cleanups: Array<() => void> = [];

  const observe = (type: string, handler: (entry: PerformanceEntry) => void) => {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) handler(entry);
      });
      observer.observe({ type, buffered: true } as PerformanceObserverInit);
      cleanups.push(() => observer.disconnect());
    } catch {
      /* unsupported entry type */
    }
  };

  observe("largest-contentful-paint", (entry) => {
    onReport({
      name: "LCP",
      value: entry.startTime,
      rating: ratingFor("LCP", entry.startTime),
      id: `lcp-${Math.round(entry.startTime)}`,
    });
  });

  observe("paint", (entry) => {
    if (entry.name !== "first-contentful-paint") return;
    onReport({
      name: "FCP",
      value: entry.startTime,
      rating: ratingFor("FCP", entry.startTime),
      id: `fcp-${Math.round(entry.startTime)}`,
    });
  });

  observe("layout-shift", (entry) => {
    const shift = entry as PerformanceEntry & {
      value?: number;
      hadRecentInput?: boolean;
    };
    if (shift.hadRecentInput) return;
    const value = shift.value ?? 0;
    onReport({
      name: "CLS",
      value,
      rating: ratingFor("CLS", value),
      id: `cls-${value.toFixed(4)}`,
    });
  });

  observe("event", (entry) => {
    const event = entry as PerformanceEntry & {
      duration?: number;
      interactionId?: number;
    };
    if (!event.interactionId) return;
    const value = event.duration ?? entry.duration;
    onReport({
      name: "INP",
      value,
      rating: ratingFor("INP", value),
      id: `inp-${event.interactionId}`,
    });
  });

  observe("navigation", (entry) => {
    const nav = entry as PerformanceNavigationTiming;
    const ttfb = nav.responseStart;
    onReport({
      name: "TTFB",
      value: ttfb,
      rating: ratingFor("TTFB", ttfb),
      id: `ttfb-${Math.round(ttfb)}`,
      navigationType: nav.type,
    });
  });

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
