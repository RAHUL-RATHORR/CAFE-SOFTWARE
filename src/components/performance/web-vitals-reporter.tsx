"use client";

import { useWebVitals } from "@/hooks/performance/use-web-vitals";

/** Client island that mounts CWV observers once at the app shell. */
export function WebVitalsReporter() {
  useWebVitals();
  return null;
}
