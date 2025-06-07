/**
 * Logging system types for centralized logging capabilities, 
 * log management, and development debugging support.
 * Supports structured logging with context, performance metrics, and monitoring integration.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  /** User ID if authenticated */
  userId?: string;
  /** Current session ID */
  sessionId?: string;
  /** Component or module name where log originated */
  component?: string;
  /** Request ID for correlation */
  requestId?: string;
  /** Current route or page */
  route?: string;
  /** User action that triggered the log */
  action?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface PerformanceContext {
  /** Performance metric name */
  metric: string;
  /** Duration in milliseconds */
  duration: number;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Performance marks */
  marks?: Record<string, number>;
  /** Memory usage info */
  memory?: {
    used: number;
    total: number;
  };
}

export interface LogEntry {
  /** Unique log entry ID */
  id: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** ISO timestamp */
  timestamp: string;
  /** Log context information */
  context?: LogContext;
  /** Performance context for performance logs */
  performance?: PerformanceContext;
  /** Error object for error logs */
  error?: {
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  };
  /** Log category for filtering */
  category?: string;
  /** Environment where log was created */
  environment: 'development' | 'production' | 'test';
  /** Browser/client information */
  client?: {
    userAgent: string;
    url: string;
    timestamp: number;
  };
}

export interface LogFilter {
  /** Filter by log level */
  level?: LogLevel | LogLevel[];
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Filter by component */
  component?: string;
  /** Filter by category */
  category?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by message content */
  messageContains?: string;
  /** Filter by context metadata */
  contextFilter?: Record<string, unknown>;
}

export interface LoggerConfig {
  /** Minimum log level to process */
  level: LogLevel;
  /** Enable console output */
  console: boolean;
  /** Enable localStorage persistence */
  persistence: boolean;
  /** Maximum number of logs to keep in memory */
  maxLogs: number;
  /** Maximum age of logs in milliseconds */
  maxAge: number;
  /** Enable log rotation */
  rotation: boolean;
  /** Enable performance logging */
  performance: boolean;
  /** External monitoring service configuration */
  monitoring?: {
    enabled: boolean;
    endpoint?: string;
    apiKey?: string;
    batchSize?: number;
    flushInterval?: number;
  };
  /** Development-specific configuration */
  development?: {
    enableStackTrace: boolean;
    enableSourceMap: boolean;
    verboseErrors: boolean;
  };
}

export interface LogStorage {
  /** Store log entry */
  store: (entry: LogEntry) => Promise<void>;
  /** Retrieve logs with filtering */
  retrieve: (filter?: LogFilter) => Promise<LogEntry[]>;
  /** Clear logs */
  clear: () => Promise<void>;
  /** Get storage stats */
  getStats: () => Promise<{
    count: number;
    size: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  }>;
  /** Rotate old logs */
  rotate: () => Promise<void>;
}

export interface LoggerHookReturn {
  /** Log a debug message */
  debug: (message: string, context?: LogContext) => void;
  /** Log an info message */
  info: (message: string, context?: LogContext) => void;
  /** Log a warning message */
  warn: (message: string, context?: LogContext) => void;
  /** Log an error message */
  error: (message: string, error?: Error, context?: LogContext) => void;
  /** Log a fatal error message */
  fatal: (message: string, error?: Error, context?: LogContext) => void;
  /** Log performance metrics */
  performance: (metric: string, duration: number, context?: PerformanceContext) => void;
  /** Get current logs with optional filtering */
  getLogs: (filter?: LogFilter) => LogEntry[];
  /** Search logs */
  search: (query: string, filter?: LogFilter) => LogEntry[];
  /** Clear all logs */
  clearLogs: () => void;
  /** Export logs for debugging */
  exportLogs: (format?: 'json' | 'csv') => string;
  /** Current logger configuration */
  config: LoggerConfig;
  /** Update logger configuration */
  updateConfig: (newConfig: Partial<LoggerConfig>) => void;
  /** Current log count */
  logCount: number;
  /** Storage stats */
  storageStats: {
    count: number;
    size: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  } | null;
}

export interface LoggerContextValue {
  /** Global logger instance */
  logger: LoggerHookReturn;
  /** Set global log context */
  setGlobalContext: (context: Partial<LogContext>) => void;
  /** Get global log context */
  getGlobalContext: () => LogContext;
}

// Log level priorities for filtering
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
} as const;

// Default logger configuration
export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: 'info',
  console: true,
  persistence: true,
  maxLogs: 1000,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  rotation: true,
  performance: false,
  monitoring: {
    enabled: false,
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
  },
  development: {
    enableStackTrace: true,
    enableSourceMap: true,
    verboseErrors: true,
  },
} as const;

// Log categories for organization
export const LOG_CATEGORIES = {
  AUTH: 'auth',
  API: 'api',
  DATABASE: 'database',
  SCHEMA: 'schema',
  PERFORMANCE: 'performance',
  UI: 'ui',
  NAVIGATION: 'navigation',
  ERROR: 'error',
  SECURITY: 'security',
  SYSTEM: 'system',
} as const;

export type LogCategory = typeof LOG_CATEGORIES[keyof typeof LOG_CATEGORIES];