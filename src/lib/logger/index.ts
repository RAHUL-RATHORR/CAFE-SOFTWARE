import { productionConfig } from "@/config/production";
import type {
  LogContext,
  LogLevel,
  StructuredLogEntry,
} from "@/types/production";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warning: 30,
  error: 40,
  critical: 50,
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[productionConfig.logging.level];
}

function maskValue(key: string, value: unknown): unknown {
  const lower = key.toLowerCase();
  const shouldRedact = productionConfig.logging.redactKeys.some((token) =>
    lower.includes(token.toLowerCase())
  );
  if (!shouldRedact) return value;
  if (value == null || value === "") return value;
  return "[REDACTED]";
}

function sanitizeContext(
  context?: LogContext
): LogContext | undefined {
  if (!context) return undefined;
  const next: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      next[key] = sanitizeContext(value as LogContext);
    } else {
      next[key] = maskValue(key, value);
    }
  }
  return next;
}

function serializeError(error: unknown): StructuredLogEntry["error"] {
  if (!error) return undefined;
  if (error instanceof Error) {
    const code =
      "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : undefined;
    return {
      name: error.name,
      message: error.message,
      code,
      stack: productionConfig.logging.includeStack ? error.stack : undefined,
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
  };
}

function emit(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
) {
  if (!shouldLog(level)) return;

  const entry: StructuredLogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: productionConfig.app.name,
    environment: productionConfig.app.environment,
    context: sanitizeContext(context),
    error: serializeError(error),
  };

  const line = productionConfig.logging.structured
    ? JSON.stringify(entry)
    : `[${entry.level.toUpperCase()}] ${entry.message}`;

  if (level === "error" || level === "critical") {
    console.error(line);
  } else if (level === "warning") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    emit("debug", message, context);
  },
  info(message: string, context?: LogContext) {
    emit("info", message, context);
  },
  warning(message: string, context?: LogContext) {
    emit("warning", message, context);
  },
  error(message: string, context?: LogContext, error?: unknown) {
    emit("error", message, context, error);
  },
  critical(message: string, context?: LogContext, error?: unknown) {
    emit("critical", message, context, error);
  },
  child(baseContext: LogContext) {
    return {
      debug(message: string, context?: LogContext) {
        emit("debug", message, { ...baseContext, ...context });
      },
      info(message: string, context?: LogContext) {
        emit("info", message, { ...baseContext, ...context });
      },
      warning(message: string, context?: LogContext) {
        emit("warning", message, { ...baseContext, ...context });
      },
      error(message: string, context?: LogContext, error?: unknown) {
        emit("error", message, { ...baseContext, ...context }, error);
      },
      critical(message: string, context?: LogContext, error?: unknown) {
        emit("critical", message, { ...baseContext, ...context }, error);
      },
    };
  },
};

export type Logger = typeof logger;
