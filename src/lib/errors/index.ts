import { isDatabaseError, type DatabaseError } from "@/lib/database/errors";
import type { AppErrorCode, AppErrorKind } from "@/types/production";

export type AppErrorOptions = {
  code?: AppErrorCode;
  kind?: AppErrorKind;
  status?: number;
  cause?: unknown;
  fieldErrors?: Record<string, string[]>;
  details?: Record<string, unknown>;
  expose?: boolean;
};

/**
 * Unified application error hierarchy for server actions and API routes.
 * Domain Result helpers remain the primary action contract; use AppError
 * for typed throws and centralized mapping.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly kind: AppErrorKind;
  readonly status: number;
  readonly cause?: unknown;
  readonly fieldErrors?: Record<string, string[]>;
  readonly details?: Record<string, unknown>;
  readonly expose: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? "UNEXPECTED_ERROR";
    this.kind = options.kind ?? "unexpected";
    this.status = options.status ?? 500;
    this.cause = options.cause;
    this.fieldErrors = options.fieldErrors;
    this.details = options.details;
    this.expose = options.expose ?? this.status < 500;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      kind: this.kind,
      message: this.expose ? this.message : "An unexpected error occurred",
      status: this.status,
      fieldErrors: this.fieldErrors,
      details: this.expose ? this.details : undefined,
    };
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function validationError(
  message: string,
  fieldErrors?: Record<string, string[]>
) {
  return new AppError(message, {
    code: "VALIDATION_ERROR",
    kind: "validation",
    status: 400,
    fieldErrors,
    expose: true,
  });
}

export function authenticationError(message = "Authentication required") {
  return new AppError(message, {
    code: "AUTHENTICATION_ERROR",
    kind: "authentication",
    status: 401,
    expose: true,
  });
}

export function authorizationError(message = "Insufficient permissions") {
  return new AppError(message, {
    code: "AUTHORIZATION_ERROR",
    kind: "authorization",
    status: 403,
    expose: true,
  });
}

export function businessError(message: string, details?: Record<string, unknown>) {
  return new AppError(message, {
    code: "BUSINESS_ERROR",
    kind: "business",
    status: 422,
    details,
    expose: true,
  });
}

export function clientError(message: string, status = 400) {
  return new AppError(message, {
    code: "CLIENT_ERROR",
    kind: "client",
    status,
    expose: true,
  });
}

export function notFoundError(message = "Resource not found") {
  return new AppError(message, {
    code: "NOT_FOUND",
    kind: "not_found",
    status: 404,
    expose: true,
  });
}

export function rateLimitError(message = "Too many requests") {
  return new AppError(message, {
    code: "RATE_LIMITED",
    kind: "rate_limit",
    status: 429,
    expose: true,
  });
}

export function serverError(message = "Internal server error", cause?: unknown) {
  return new AppError(message, {
    code: "SERVER_ERROR",
    kind: "server",
    status: 500,
    cause,
    expose: false,
  });
}

export function fromDatabaseError(error: DatabaseError) {
  return new AppError(error.message, {
    code: "DATABASE_ERROR",
    kind: "database",
    status: 503,
    cause: error,
    expose: false,
  });
}

export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (isDatabaseError(error)) return fromDatabaseError(error);
  if (error instanceof Error) {
    return new AppError(error.message || "Unexpected error", {
      code: "UNEXPECTED_ERROR",
      kind: "unexpected",
      status: 500,
      cause: error,
      expose: false,
    });
  }
  return serverError("Unexpected error", error);
}
