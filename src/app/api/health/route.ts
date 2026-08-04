import { NextResponse } from "next/server";
import { getApplicationHealth } from "@/lib/health";
import { logger } from "@/lib/logger";
import { monitoring } from "@/lib/monitoring";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import {
  applyTraceHeaders,
  createTraceContext,
  elapsedMs,
  readTraceHeaders,
} from "@/lib/tracing";
import { applySecurityHeaders } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public health endpoint for load balancers and ops checks.
 * No authentication required.
 */
export async function GET(request: Request) {
  const incoming = readTraceHeaders(request.headers);
  const trace = createTraceContext({
    requestId: incoming.requestId,
    correlationId: incoming.correlationId,
    operation: "GET /api/health",
  });

  const identity =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "health";
  const limit = checkRateLimit("api", `health:${identity}`);

  if (!limit.allowed) {
    const denied = NextResponse.json(
      {
        status: "unhealthy",
        ok: false,
        message: "Rate limit exceeded",
        requestId: trace.requestId,
      },
      { status: 429 }
    );
    applySecurityHeaders(denied.headers);
    applyTraceHeaders(denied.headers, trace);
    for (const [key, value] of Object.entries(rateLimitHeaders(limit))) {
      denied.headers.set(key, value);
    }
    return denied;
  }

  try {
    const health = await getApplicationHealth();
    monitoring.trackRequest({
      name: "GET /api/health",
      durationMs: elapsedMs(trace),
      success: health.ok,
      requestId: trace.requestId,
    });

    logger.info("Health check", {
      requestId: trace.requestId,
      correlationId: trace.correlationId,
      operation: "GET /api/health",
      durationMs: elapsedMs(trace),
      status: health.status,
    });

    const response = NextResponse.json(
      {
        ...health,
        requestId: trace.requestId,
        correlationId: trace.correlationId,
      },
      { status: health.ok ? 200 : 503 }
    );
    applySecurityHeaders(response.headers);
    applyTraceHeaders(response.headers, trace);
    for (const [key, value] of Object.entries(rateLimitHeaders(limit))) {
      response.headers.set(key, value);
    }
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    monitoring.trackRequest({
      name: "GET /api/health",
      durationMs: elapsedMs(trace),
      success: false,
      requestId: trace.requestId,
    });
    logger.error(
      "Health check failed",
      {
        requestId: trace.requestId,
        operation: "GET /api/health",
      },
      error
    );
    const response = NextResponse.json(
      {
        status: "unhealthy",
        ok: false,
        message: "Health check failed",
        requestId: trace.requestId,
      },
      { status: 503 }
    );
    applySecurityHeaders(response.headers);
    applyTraceHeaders(response.headers, trace);
    return response;
  }
}
