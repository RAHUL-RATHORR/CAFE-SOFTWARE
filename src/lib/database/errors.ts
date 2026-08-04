export class DatabaseError extends Error {
  readonly code: string;
  readonly cause?: unknown;

  constructor(message: string, options?: { code?: string; cause?: unknown }) {
    super(message);
    this.name = "DatabaseError";
    this.code = options?.code ?? "DATABASE_ERROR";
    this.cause = options?.cause;
  }
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Normalizes unknown Mongo/Mongoose failures into DatabaseError.
 */
export function handleDatabaseError(
  error: unknown,
  fallbackMessage = "A database error occurred"
): DatabaseError {
  if (isDatabaseError(error)) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message || fallbackMessage;

    if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(message)) {
      return new DatabaseError("Unable to reach MongoDB", {
        code: "DATABASE_UNAVAILABLE",
        cause: error,
      });
    }

    if (/authentication failed|bad auth/i.test(message)) {
      return new DatabaseError("MongoDB authentication failed", {
        code: "DATABASE_AUTH_FAILED",
        cause: error,
      });
    }

    if (/duplicate key|E11000/i.test(message)) {
      return new DatabaseError("Duplicate key violation", {
        code: "DATABASE_DUPLICATE_KEY",
        cause: error,
      });
    }

    return new DatabaseError(message, {
      code: "DATABASE_ERROR",
      cause: error,
    });
  }

  return new DatabaseError(fallbackMessage, {
    code: "DATABASE_UNKNOWN",
    cause: error,
  });
}
