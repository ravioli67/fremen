/**
 * Structured logger for Fremen framework.
 * Provides leveled logging with timestamps and context.
 * Metadata values whose keys look sensitive (cookies, tokens, credentials)
 * are redacted before being written.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEY = /cookie|token|password|passwd|secret|authorization|credential|storagestate/i;

function isLogLevel(value: string | undefined): value is LogLevel {
  return value !== undefined && Object.hasOwn(LEVEL_ORDER, value);
}

class FremenLogger {
  private static instance: FremenLogger | undefined;
  private level: LogLevel;

  constructor(level?: LogLevel) {
    const fromEnv = process.env.FREMEN_LOG_LEVEL;
    this.level = level ?? (isLogLevel(fromEnv) ? fromEnv : "info");
  }

  public static getInstance(): FremenLogger {
    FremenLogger.instance ??= new FremenLogger();
    return FremenLogger.instance;
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public getLevel(): LogLevel {
    return this.level;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level.toUpperCase()}] ${this.format(message, metadata)}`;

    switch (level) {
      case "error":
        console.error(line);
        break;
      case "warn":
        console.warn(line);
        break;
      case "info":
        console.log(line);
        break;
      default:
        console.debug(line);
    }
  }

  private format(message: string, metadata?: Record<string, unknown>): string {
    if (!metadata) {
      return message;
    }
    const parts = Object.entries(metadata).map(
      ([key, value]) => `[${key}=${SENSITIVE_KEY.test(key) ? '"[REDACTED]"' : FremenLogger.stringify(value)}]`
    );
    return `${message} ${parts.join(" ")}`;
  }

  private static stringify(value: unknown): string {
    try {
      return JSON.stringify(value) ?? String(value);
    } catch {
      return String(value);
    }
  }

  public debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }

  public info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  public warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  public error(message: string, metadata?: Record<string, unknown>): void {
    this.log("error", message, metadata);
  }
}

export default FremenLogger;
