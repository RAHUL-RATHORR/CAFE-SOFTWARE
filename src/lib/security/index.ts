import { productionConfig } from "@/config/production";
import type { SecurityHeaderMap } from "@/types/production";

/**
 * Security headers + CSP foundation (no external WAF).
 * Tuned for Next.js App Router + Auth.js cookies.
 */
export function buildSecurityHeaders(options?: {
  nonce?: string;
}): SecurityHeaderMap {
  const headers: SecurityHeaderMap = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-DNS-Prefetch-Control": "on",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };

  if (productionConfig.app.isProduction) {
    headers["Strict-Transport-Security"] =
      "max-age=63072000; includeSubDomains; preload";
  }

  if (productionConfig.security.cspEnabled) {
    const nonce = options?.nonce;
    const scriptSrc = nonce
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    if (productionConfig.security.cspReportOnly) {
      headers["Content-Security-Policy-Report-Only"] = csp;
    } else {
      headers["Content-Security-Policy"] = csp;
    }
  }

  return headers;
}

export function applySecurityHeaders(
  headers: Headers,
  options?: { nonce?: string }
): void {
  if (!productionConfig.security.headersEnabled) return;
  const map = buildSecurityHeaders(options);
  for (const [key, value] of Object.entries(map)) {
    headers.set(key, value);
  }
}

export function getSecureCookieOptions(overrides?: {
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
}) {
  return {
    httpOnly: true,
    secure:
      productionConfig.security.secureCookiesInProduction &&
      productionConfig.app.isProduction,
    sameSite: overrides?.sameSite ?? "lax",
    path: overrides?.path ?? "/",
    maxAge: overrides?.maxAge,
  } as const;
}

/** Output sanitization foundation — strips HTML tags from free text. */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

export function sanitizeObjectStrings<T extends Record<string, unknown>>(
  input: T
): T {
  const next: Record<string, unknown> = { ...input };
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === "string") {
      next[key] = sanitizeText(value);
    }
  }
  return next as T;
}

const SENSITIVE_KEY_PATTERN =
  /(password|secret|token|authorization|cookie|api[_-]?key|mongodb_uri)/i;

/** Sensitive data masking for logs and audit payloads. */
export function maskSensitiveData<T>(value: T, depth = 0): T {
  if (!productionConfig.security.maskSensitiveData) return value;
  if (depth > 6) return value;

  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveData(item, depth + 1)) as T;
  }

  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>
    )) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        next[key] = nested == null || nested === "" ? nested : "[REDACTED]";
      } else {
        next[key] = maskSensitiveData(nested, depth + 1);
      }
    }
    return next as T;
  }

  return value;
}
