import { format } from 'date-fns';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

class HealthAxisLogger {
  private static instance: HealthAxisLogger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {}

  static getInstance(): HealthAxisLogger {
    if (!HealthAxisLogger.instance) {
      HealthAxisLogger.instance = new HealthAxisLogger();
    }
    return HealthAxisLogger.instance;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      level,
      message,
      context,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console with appropriate styling
    const styles = {
      info: 'color: #2563eb;',
      warn: 'color: #d97706;',
      error: 'color: #dc2626;',
      debug: 'color: #4b5563;',
    };

    console.log(
      `%c[HealthAxis] ${entry.timestamp} [${level.toUpperCase()}] ${message}`,
      styles[level]
    );
    if (context) {
      console.log('Context:', context);
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = HealthAxisLogger.getInstance();

export const logInfo = (message: string, metadata?: Record<string, unknown>) => {
  logger.info(message, metadata);
};

export const logWarn = (message: string, metadata?: Record<string, unknown>) => {
  logger.warn(message, metadata);
};

export const logError = (message: string, error: Error, metadata?: Record<string, unknown>) => {
  logger.error(message, { error: error.message, stack: error.stack, ...metadata });
};

export const logDebug = (message: string, metadata?: Record<string, unknown>) => {
  logger.debug(message, metadata);
}; 