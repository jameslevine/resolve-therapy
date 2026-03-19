import type { APIGatewayProxyEvent } from "aws-lambda";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LOG_LEVELS: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const MIN_LEVEL = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || "INFO"] || LOG_LEVELS.INFO;

interface LogContext {
  service?: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

export function createLogger(context: LogContext = {}): Logger {
  function log(level: LogLevel, message: string, data: Record<string, unknown> = {}): void {
    if (LOG_LEVELS[level] < MIN_LEVEL) return;

    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      ...data,
    };

    Object.keys(entry).forEach((key) => {
      if (entry[key] === undefined) delete entry[key];
    });

    const output = JSON.stringify(entry);

    if (level === "ERROR") {
      console.error(output);
    } else if (level === "WARN") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  return {
    debug: (message, data) => log("DEBUG", message, data),
    info: (message, data) => log("INFO", message, data),
    warn: (message, data) => log("WARN", message, data),
    error: (message, data) => log("ERROR", message, data),
  };
}

export function loggerFromEvent(event: APIGatewayProxyEvent, service: string): Logger {
  return createLogger({
    service,
    requestId: event.requestContext?.requestId,
    path: event.path,
    method: event.httpMethod,
  });
}
