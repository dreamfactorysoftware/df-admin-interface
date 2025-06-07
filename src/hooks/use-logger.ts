/**
 * Centralized logging utility hook for DreamFactory Admin Interface
 * 
 * This hook provides comprehensive logging capabilities including:
 * - Configurable log levels for development and production environments
 * - Structured logging with context, timestamps, and categorization
 * - Log persistence with automatic rotation and storage management
 * - Integration with external monitoring services
 * - Development debugging support with filtering and search
 * - Performance tracking and correlation ID management
 * 
 * Replaces Angular LoggingService with React patterns for the migration
 * from Angular 16 to React 19/Next.js 15.1.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LogLevel,
  LogCategory,
  LogEntry,
  LogFilter,
  LogSearchResult,
  LogExportOptions,
  LoggerConfig,
  LogUserContext,
  LogApplicationContext,
  LogPerformanceMetrics,
  LogErrorContext,
  LogCorrelationContext,
  UseLoggerReturn,
  LogEventListener,
  LogBatchCallback,
  LogRotationCallback,
} from '@/types/logging';

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  console: true,
  storage: {
    enabled: true,
    maxEntries: 1000,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    storageKey: 'df-admin-logs',
    autoRotate: true,
    rotationInterval: 60 * 60 * 1000, // 1 hour
  },
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    batchSize: 50,
    transmissionInterval: 30 * 1000, // 30 seconds
    samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enableCorrelation: true,
  },
  enablePerformanceTracking: true,
  enableUserContext: true,
  enableAppContext: true,
  development: {
    verbose: true,
    stackTrace: true,
    sourceMap: true,
  },
  production: {
    sanitize: true,
    filterPII: true,
    compression: false,
  },
};

/**
 * In-memory log storage for fast access and search
 */
class LogStorage {
  private entries: LogEntry[] = [];
  private config: LoggerConfig['storage'];
  private rotationTimer?: NodeJS.Timeout;
  private rotationCallback?: LogRotationCallback;

  constructor(config: LoggerConfig['storage'], rotationCallback?: LogRotationCallback) {
    this.config = config;
    this.rotationCallback = rotationCallback;
    
    if (config.enabled) {
      this.loadFromStorage();
      this.startAutoRotation();
    }
  }

  /**
   * Add a log entry to storage
   */
  add(entry: LogEntry): void {
    if (!this.config.enabled) return;

    this.entries.push(entry);
    
    // Enforce max entries limit
    if (this.entries.length > this.config.maxEntries) {
      const removed = this.entries.splice(0, this.entries.length - this.config.maxEntries);
      this.rotationCallback?.(removed);
    }
    
    this.saveToStorage();
  }

  /**
   * Search log entries with filters
   */
  search(filter: LogFilter, page = 1, pageSize = 50): LogSearchResult {
    const startTime = performance.now();
    
    let filtered = this.entries.filter(entry => {
      // Level filter (minimum level)
      if (filter.level !== undefined && entry.level < filter.level) {
        return false;
      }
      
      // Category filter
      if (filter.categories && !filter.categories.includes(entry.category)) {
        return false;
      }
      
      // Time range filter
      if (filter.timeRange) {
        const entryTime = new Date(entry.timestamp);
        if (entryTime < filter.timeRange.start || entryTime > filter.timeRange.end) {
          return false;
        }
      }
      
      // User ID filter
      if (filter.userId && entry.userContext?.userId !== filter.userId) {
        return false;
      }
      
      // Correlation ID filter
      if (filter.correlationId && entry.correlation?.correlationId !== filter.correlationId) {
        return false;
      }
      
      // Component filter
      if (filter.component && entry.appContext?.component !== filter.component) {
        return false;
      }
      
      // Tags filter
      if (filter.tags && !filter.tags.every(tag => entry.tags?.includes(tag))) {
        return false;
      }
      
      // Text search
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        if (!entry.message.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const entries = filtered.slice(start, start + pageSize);
    
    const executionTime = performance.now() - startTime;
    
    return {
      entries,
      total,
      page,
      pageSize,
      totalPages,
      executionTime,
    };
  }

  /**
   * Export log entries
   */
  export(options: LogExportOptions): LogEntry[] {
    const filter = options.filter || {};
    const result = this.search(filter, 1, options.maxEntries || this.entries.length);
    return result.entries;
  }

  /**
   * Clear all log entries
   */
  clear(): void {
    this.entries = [];
    this.saveToStorage();
  }

  /**
   * Get all entries (for internal use)
   */
  getAll(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Rotate old entries
   */
  rotate(): void {
    if (!this.config.enabled) return;

    const cutoffTime = Date.now() - this.config.maxAge;
    const beforeCount = this.entries.length;
    
    this.entries = this.entries.filter(entry => {
      return new Date(entry.timestamp).getTime() > cutoffTime;
    });
    
    const removedCount = beforeCount - this.entries.length;
    if (removedCount > 0) {
      console.debug(`[Logger] Rotated ${removedCount} old log entries`);
      this.saveToStorage();
    }
  }

  /**
   * Load entries from browser storage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        this.entries = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[Logger] Failed to load from storage:', error);
    }
  }

  /**
   * Save entries to browser storage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.entries));
    } catch (error) {
      console.warn('[Logger] Failed to save to storage:', error);
    }
  }

  /**
   * Start automatic rotation timer
   */
  private startAutoRotation(): void {
    if (!this.config.autoRotate) return;

    this.rotationTimer = setInterval(() => {
      this.rotate();
    }, this.config.rotationInterval);
  }

  /**
   * Stop automatic rotation
   */
  destroy(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
    }
  }
}

/**
 * External monitoring service integration
 */
class MonitoringService {
  private config: LoggerConfig['monitoring'];
  private batchQueue: LogEntry[] = [];
  private transmissionTimer?: NodeJS.Timeout;
  private callback?: LogBatchCallback;

  constructor(config: LoggerConfig['monitoring'], callback?: LogBatchCallback) {
    this.config = config;
    this.callback = callback;
    
    if (config.enabled) {
      this.startBatchTransmission();
    }
  }

  /**
   * Add entry to monitoring queue
   */
  add(entry: LogEntry): void {
    if (!this.config.enabled || !this.shouldSample()) return;

    this.batchQueue.push(entry);
    
    if (this.batchQueue.length >= this.config.batchSize) {
      this.transmitBatch();
    }
  }

  /**
   * Force transmission of current batch
   */
  flush(): void {
    if (this.batchQueue.length > 0) {
      this.transmitBatch();
    }
  }

  /**
   * Determine if entry should be sampled
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.samplingRate;
  }

  /**
   * Transmit batch to monitoring service
   */
  private async transmitBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    try {
      if (this.callback) {
        await this.callback(batch);
      } else {
        await this.defaultTransmission(batch);
      }
    } catch (error) {
      console.warn('[Logger] Failed to transmit log batch:', error);
      // Re-queue on failure (with limit to prevent memory issues)
      if (this.batchQueue.length < this.config.batchSize * 2) {
        this.batchQueue.unshift(...batch.slice(0, this.config.batchSize));
      }
    }
  }

  /**
   * Default transmission implementation
   */
  private async defaultTransmission(batch: LogEntry[]): Promise<void> {
    if (!this.config.endpoint || !this.config.apiKey) return;

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        logs: batch,
        timestamp: new Date().toISOString(),
        source: 'df-admin-interface',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Start batch transmission timer
   */
  private startBatchTransmission(): void {
    this.transmissionTimer = setInterval(() => {
      this.transmitBatch();
    }, this.config.transmissionInterval);
  }

  /**
   * Stop monitoring service
   */
  destroy(): void {
    if (this.transmissionTimer) {
      clearInterval(this.transmissionTimer);
      this.transmissionTimer = undefined;
    }
    this.flush();
  }
}

/**
 * Generate unique correlation ID
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique log entry ID
 */
function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize data for production logging
 */
function sanitizeData(data: any, config: LoggerConfig): any {
  if (!config.production.sanitize || process.env.NODE_ENV !== 'production') {
    return data;
  }

  // PII filtering patterns
  const piiPatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /auth/i,
    /credential/i,
    /ssn/i,
    /social/i,
    /credit/i,
    /card/i,
  ];

  function sanitizeObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (piiPatterns.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  return sanitizeObject(data);
}

/**
 * Main logging hook implementation
 */
export function useLogger(): UseLoggerReturn {
  // Configuration state
  const [config, setConfig] = useState<LoggerConfig>(DEFAULT_CONFIG);
  
  // Context state
  const [userContext, setUserContextState] = useState<LogUserContext | undefined>();
  const [appContext, setAppContextState] = useState<LogApplicationContext | undefined>();
  
  // Storage and monitoring services
  const storageRef = useRef<LogStorage>();
  const monitoringRef = useRef<MonitoringService>();
  
  // Performance tracking
  const performanceTimersRef = useRef<Map<string, { start: number; operation: string }>>(new Map());
  
  // Event listeners
  const listenersRef = useRef<Set<LogEventListener>>(new Set());

  // Initialize services
  useEffect(() => {
    storageRef.current = new LogStorage(config.storage, (removedEntries) => {
      console.debug(`[Logger] Rotated ${removedEntries.length} entries`);
    });

    monitoringRef.current = new MonitoringService(config.monitoring);

    return () => {
      storageRef.current?.destroy();
      monitoringRef.current?.destroy();
    };
  }, [config]);

  // Auto-detect application context
  useEffect(() => {
    if (typeof window !== 'undefined' && config.enableAppContext) {
      setAppContextState({
        route: window.location.pathname,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
      });
    }
  }, [config.enableAppContext]);

  /**
   * Create a log entry
   */
  const createLogEntry = useCallback((
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, any>,
    options?: Partial<LogEntry>
  ): LogEntry => {
    const timestamp = new Date().toISOString();
    const id = generateLogId();

    const entry: LogEntry = {
      id,
      timestamp,
      level,
      category,
      message,
      ...options,
    };

    // Add user context if available and enabled
    if (config.enableUserContext && userContext) {
      entry.userContext = userContext;
    }

    // Add application context if available and enabled
    if (config.enableAppContext && appContext) {
      entry.appContext = appContext;
    }

    // Add data if provided
    if (data) {
      entry.data = sanitizeData(data, config);
    }

    // Add correlation context if enabled
    if (config.monitoring.enableCorrelation && !entry.correlation) {
      entry.correlation = {
        correlationId: generateCorrelationId(),
      };
    }

    return entry;
  }, [config, userContext, appContext]);

  /**
   * Process and emit log entry
   */
  const processLogEntry = useCallback((entry: LogEntry): void => {
    // Check if log level meets threshold
    if (entry.level < config.level) {
      return;
    }

    // Console output
    if (config.console) {
      const levelNames = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
      const levelName = levelNames[entry.level];
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      
      const logFn = entry.level >= LogLevel.ERROR ? console.error :
                   entry.level >= LogLevel.WARN ? console.warn :
                   console.log;

      if (config.development.verbose && process.env.NODE_ENV === 'development') {
        logFn(`[${timestamp}] [${levelName}] [${entry.category}] ${entry.message}`, entry.data || '');
      } else {
        logFn(`[${levelName}] ${entry.message}`);
      }
    }

    // Store entry
    storageRef.current?.add(entry);

    // Send to monitoring
    monitoringRef.current?.add(entry);

    // Notify listeners
    listenersRef.current.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.warn('[Logger] Event listener error:', error);
      }
    });
  }, [config]);

  /**
   * Generic log function
   */
  const log = useCallback((
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, any>,
    options?: Partial<LogEntry>
  ): void => {
    const entry = createLogEntry(level, category, message, data, options);
    processLogEntry(entry);
  }, [createLogEntry, processLogEntry]);

  // Log level methods
  const trace = useCallback((message: string, data?: Record<string, any>, options?: Partial<LogEntry>) => {
    log(LogLevel.TRACE, options?.category || LogCategory.DEV, message, data, options);
  }, [log]);

  const debug = useCallback((message: string, data?: Record<string, any>, options?: Partial<LogEntry>) => {
    log(LogLevel.DEBUG, options?.category || LogCategory.DEV, message, data, options);
  }, [log]);

  const info = useCallback((message: string, data?: Record<string, any>, options?: Partial<LogEntry>) => {
    log(LogLevel.INFO, options?.category || LogCategory.SYSTEM, message, data, options);
  }, [log]);

  const warn = useCallback((message: string, data?: Record<string, any>, options?: Partial<LogEntry>) => {
    log(LogLevel.WARN, options?.category || LogCategory.SYSTEM, message, data, options);
  }, [log]);

  const error = useCallback((
    message: string,
    error?: Error | LogErrorContext,
    data?: Record<string, any>,
    options?: Partial<LogEntry>
  ) => {
    let errorContext: LogErrorContext | undefined;

    if (error) {
      if (error instanceof Error) {
        errorContext = {
          name: error.name,
          message: error.message,
          stack: config.development.stackTrace ? error.stack : undefined,
        };
      } else {
        errorContext = error;
      }
    }

    const entry = createLogEntry(
      LogLevel.ERROR,
      options?.category || LogCategory.SYSTEM,
      message,
      data,
      { ...options, error: errorContext }
    );
    processLogEntry(entry);
  }, [createLogEntry, processLogEntry, config]);

  const fatal = useCallback((
    message: string,
    error?: Error | LogErrorContext,
    data?: Record<string, any>,
    options?: Partial<LogEntry>
  ) => {
    let errorContext: LogErrorContext | undefined;

    if (error) {
      if (error instanceof Error) {
        errorContext = {
          name: error.name,
          message: error.message,
          stack: config.development.stackTrace ? error.stack : undefined,
        };
      } else {
        errorContext = error;
      }
    }

    const entry = createLogEntry(
      LogLevel.FATAL,
      options?.category || LogCategory.SYSTEM,
      message,
      data,
      { ...options, error: errorContext }
    );
    processLogEntry(entry);
  }, [createLogEntry, processLogEntry, config]);

  // Performance tracking methods
  const startTimer = useCallback((operation: string): string => {
    if (!config.enablePerformanceTracking) {
      return '';
    }

    const timerId = generateLogId();
    performanceTimersRef.current.set(timerId, {
      start: performance.now(),
      operation,
    });
    
    return timerId;
  }, [config]);

  const endTimer = useCallback((timerId: string, data?: Record<string, any>): void => {
    if (!config.enablePerformanceTracking || !timerId) {
      return;
    }

    const timer = performanceTimersRef.current.get(timerId);
    if (!timer) {
      return;
    }

    const duration = performance.now() - timer.start;
    performanceTimersRef.current.delete(timerId);

    const performanceMetrics: LogPerformanceMetrics = {
      startTime: timer.start,
      endTime: performance.now(),
      duration,
    };

    log(
      LogLevel.INFO,
      LogCategory.PERFORMANCE,
      `Operation '${timer.operation}' completed in ${duration.toFixed(2)}ms`,
      data,
      { performance: performanceMetrics }
    );
  }, [config, log]);

  // Correlation methods
  const createCorrelation = useCallback((parentId?: string): LogCorrelationContext => {
    return {
      correlationId: generateCorrelationId(),
      parentCorrelationId: parentId,
      traceId: generateCorrelationId(),
      spanId: generateCorrelationId(),
    };
  }, []);

  // Context methods
  const setUserContext = useCallback((context: LogUserContext): void => {
    setUserContextState(context);
  }, []);

  const setAppContext = useCallback((context: LogApplicationContext): void => {
    setAppContextState(context);
  }, []);

  // Search and export methods
  const search = useCallback(async (
    filter: LogFilter,
    page = 1,
    pageSize = 50
  ): Promise<LogSearchResult> => {
    return storageRef.current?.search(filter, page, pageSize) || {
      entries: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      executionTime: 0,
    };
  }, []);

  const exportLogs = useCallback(async (options: LogExportOptions): Promise<Blob> => {
    const entries = storageRef.current?.export(options) || [];
    
    let content: string;
    let mimeType: string;

    switch (options.format) {
      case 'json':
        content = JSON.stringify(entries, null, 2);
        mimeType = 'application/json';
        break;
      case 'csv':
        const headers = ['timestamp', 'level', 'category', 'message'];
        const csvLines = [
          headers.join(','),
          ...entries.map(entry => [
            entry.timestamp,
            entry.level,
            entry.category,
            `"${entry.message.replace(/"/g, '""')}"`,
          ].join(','))
        ];
        content = csvLines.join('\n');
        mimeType = 'text/csv';
        break;
      case 'txt':
      default:
        content = entries.map(entry => 
          `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}`
        ).join('\n');
        mimeType = 'text/plain';
        break;
    }

    return new Blob([content], { type: mimeType });
  }, []);

  // Utility methods
  const clearLogs = useCallback((): void => {
    storageRef.current?.clear();
  }, []);

  const getConfig = useCallback((): LoggerConfig => {
    return config;
  }, [config]);

  const updateConfig = useCallback((newConfig: Partial<LoggerConfig>): void => {
    setConfig(prevConfig => ({ ...prevConfig, ...newConfig }));
  }, []);

  // Memoized return object
  const loggerReturn = useMemo((): UseLoggerReturn => ({
    trace,
    debug,
    info,
    warn,
    error,
    fatal,
    startTimer,
    endTimer,
    createCorrelation,
    setUserContext,
    setAppContext,
    search,
    exportLogs,
    clearLogs,
    getConfig,
    updateConfig,
  }), [
    trace,
    debug,
    info,
    warn,
    error,
    fatal,
    startTimer,
    endTimer,
    createCorrelation,
    setUserContext,
    setAppContext,
    search,
    exportLogs,
    clearLogs,
    getConfig,
    updateConfig,
  ]);

  return loggerReturn;
}