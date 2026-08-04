import type { AuthErrorCode } from "@/types/auth";
import { AUTH_ERROR_MESSAGES } from "@/lib/auth/constants";

export function resolveAuthErrorMessage(
  code?: string | null
): { code: AuthErrorCode; message: string } {
  if (code == null || code === "") {
    return { code: "unknown", message: AUTH_ERROR_MESSAGES.Default };
  }

  const normalized = String(code).toLowerCase();

  if (
    normalized === "credentialssignin" ||
    normalized === "invalid_credentials"
  ) {
    return {
      code: "invalid_credentials",
      message: AUTH_ERROR_MESSAGES.invalid_credentials,
    };
  }

  if (
    normalized === "sessionrequired" ||
    normalized === "session_expired"
  ) {
    return {
      code: "session_expired",
      message: AUTH_ERROR_MESSAGES.session_expired,
    };
  }

  if (normalized === "forbidden") {
    return {
      code: "forbidden",
      message: AUTH_ERROR_MESSAGES.forbidden,
    };
  }

  if (
    normalized === "accessdenied" ||
    normalized === "unauthorized"
  ) {
    return {
      code: "unauthorized",
      message: AUTH_ERROR_MESSAGES.unauthorized,
    };
  }

  if (normalized === "network_error") {
    return {
      code: "network_error",
      message: AUTH_ERROR_MESSAGES.network_error,
    };
  }

  return {
    code: "unknown",
    message: AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.Default,
  };
}
