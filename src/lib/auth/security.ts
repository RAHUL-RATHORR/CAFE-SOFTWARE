import { productionConfig } from "@/config/production";

/**
 * Auth security architecture placeholders.
 * CSRF is handled by Auth.js; rate limiting foundation is wired via
 * middleware + `@/lib/rate-limit` (no external provider).
 */

export const SESSION_MAX_AGE_DEFAULT = 60 * 60 * 24; // 1 day
export const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30 days

export const authSecurityConfig = {
  sessionStrategy: "jwt" as const,
  cookies: {
    httpOnly: true,
    sameSite: "lax" as const,
    /** Secure flag enabled automatically on HTTPS by Auth.js */
    path: "/",
  },
  csrf: {
    enabled: true,
    /** Auth.js built-in CSRF on callback routes */
    provider: "authjs" as const,
  },
  rateLimiting: {
    enabled: productionConfig.rateLimiting.enabled,
    loginAttemptsPerMinute: productionConfig.rateLimiting.auth.maxRequests,
  },
  auditLog: {
    enabled: true,
    /** Persist via `@/lib/audit` + admin audit repository */
    events: ["login", "logout", "login_failed", "password_reset"] as const,
  },
  twoFactor: {
    enabled: false,
    /** Placeholder — TOTP/WebAuthn later */
    methods: ["totp", "webauthn"] as const,
  },
  refresh: {
    enabled: false,
    /** Placeholder — sliding / refresh-token strategy later */
    strategy: "jwt-sliding" as const,
  },
  oauth: {
    /** Placeholder providers for future enablement */
    providers: ["google", "microsoft"] as const,
    enabled: false,
  },
} as const;

export type AuthSecurityConfig = typeof authSecurityConfig;
