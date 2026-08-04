import { productionConfig } from "@/config/production";
import type { TraceContext } from "@/types/production";

const REQUEST_HEADER = productionConfig.tracing.headerName;
const CORRELATION_HEADER = productionConfig.tracing.correlationHeaderName;

export function createId(prefix?: string): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}_${id}` : id;
}

export function createTraceContext(
  incoming?: {
    requestId?: string | null;
    correlationId?: string | null;
    operation?: string;
  }
): TraceContext {
  const requestId = incoming?.requestId?.trim() || createId("req");
  const correlationId =
    incoming?.correlationId?.trim() || createId("corr");
  return {
    requestId,
    correlationId,
    traceId: createId("trace"),
    operation: incoming?.operation,
    startedAt: Date.now(),
  };
}

export function readTraceHeaders(headers: Headers): {
  requestId: string | null;
  correlationId: string | null;
} {
  return {
    requestId: headers.get(REQUEST_HEADER),
    correlationId: headers.get(CORRELATION_HEADER),
  };
}

export function applyTraceHeaders(
  headers: Headers,
  trace: TraceContext
): void {
  headers.set(REQUEST_HEADER, trace.requestId);
  headers.set(CORRELATION_HEADER, trace.correlationId);
  headers.set("x-trace-id", trace.traceId);
}

export function elapsedMs(trace: TraceContext): number {
  return Date.now() - trace.startedAt;
}

export { REQUEST_HEADER, CORRELATION_HEADER };
