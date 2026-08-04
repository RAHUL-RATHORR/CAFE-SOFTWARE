import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import {
  DEFAULT_AUTHENTICATED_REDIRECT,
  DEFAULT_UNAUTHENTICATED_REDIRECT,
} from "@/lib/auth/constants";
import {
  getRouteProtection,
  getSafeCallbackUrl,
  isGuestRoute,
  isProtectedRoute,
} from "@/lib/auth/routing";
import { productionConfig } from "@/config/production";
import { applySecurityHeaders } from "@/lib/security";
import {
  applyTraceHeaders,
  createTraceContext,
  readTraceHeaders,
} from "@/lib/tracing";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

/**
 * Auth + production hardening middleware foundation.
 * Enforces session gates; attaches tracing, security headers, and
 * lightweight rate-limit checks for auth/public surfaces.
 * Role/tenant branching remains prepared via getRouteProtection().
 * Localization placeholder reserved for future locale negotiation.
 */
export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = Boolean(request.auth?.user);
  const protection = getRouteProtection(pathname);

  const incoming = readTraceHeaders(request.headers);
  const trace = createTraceContext({
    requestId: incoming.requestId,
    correlationId: incoming.correlationId,
    operation: `${request.method} ${pathname}`,
  });

  // Localization placeholder — negotiate Accept-Language later
  const localePlaceholder =
    request.headers.get("accept-language")?.split(",")[0]?.trim() ?? "en";

  // Tenant context placeholder from session (no enforcement change)
  const tenantIdPlaceholder =
    (request.auth?.user as { restaurantId?: string | null } | undefined)
      ?.restaurantId ?? null;

  const finalize = (response: NextResponse) => {
    applySecurityHeaders(response.headers);
    applyTraceHeaders(response.headers, trace);
    response.headers.set("x-app-environment", productionConfig.app.environment);
    response.headers.set("x-locale-placeholder", localePlaceholder);
    if (tenantIdPlaceholder) {
      response.headers.set("x-tenant-id-placeholder", tenantIdPlaceholder);
    }
    return response;
  };

  if (pathname === "/") {
    const destination = isLoggedIn
      ? DEFAULT_AUTHENTICATED_REDIRECT
      : DEFAULT_UNAUTHENTICATED_REDIRECT;
    return finalize(
      NextResponse.redirect(new URL(destination, request.nextUrl))
    );
  }

  if (isProtectedRoute(pathname) && !isLoggedIn) {
    const loginUrl = new URL(DEFAULT_UNAUTHENTICATED_REDIRECT, request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return finalize(NextResponse.redirect(loginUrl));
  }

  if (isGuestRoute(pathname) && isLoggedIn) {
    const callbackUrl = getSafeCallbackUrl(
      request.nextUrl.searchParams.get("callbackUrl"),
      DEFAULT_AUTHENTICATED_REDIRECT
    );
    return finalize(
      NextResponse.redirect(new URL(callbackUrl, request.nextUrl))
    );
  }

  // Rate limiting foundation for Auth.js API + public menu surfaces
  const clientKey =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  if (pathname.startsWith("/api/auth")) {
    const limit = checkRateLimit("auth", clientKey);
    if (!limit.allowed) {
      const denied = NextResponse.json(
        { error: "Too many requests", requestId: trace.requestId },
        { status: 429 }
      );
      for (const [key, value] of Object.entries(rateLimitHeaders(limit))) {
        denied.headers.set(key, value);
      }
      return finalize(denied);
    }
  }

  if (pathname.startsWith("/menu")) {
    const limit = checkRateLimit("public", clientKey);
    if (!limit.allowed) {
      const denied = NextResponse.json(
        { error: "Too many requests", requestId: trace.requestId },
        { status: 429 }
      );
      for (const [key, value] of Object.entries(rateLimitHeaders(limit))) {
        denied.headers.set(key, value);
      }
      return finalize(denied);
    }
  }

  // Future role guards:
  // if (protection.kind === "admin" && request.auth?.user?.role !== "super-admin") ...
  // if (protection.kind === "restaurant" && !request.auth?.user?.restaurantId) ...
  void protection;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(productionConfig.tracing.headerName, trace.requestId);
  requestHeaders.set(
    productionConfig.tracing.correlationHeaderName,
    trace.correlationId
  );
  if (tenantIdPlaceholder) {
    requestHeaders.set("x-tenant-id-placeholder", tenantIdPlaceholder);
  }
  requestHeaders.set("x-locale-placeholder", localePlaceholder);

  return finalize(
    NextResponse.next({
      request: { headers: requestHeaders },
    })
  );
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
