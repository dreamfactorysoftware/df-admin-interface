/**
 * Logging utility hook that provides centralized logging capabilities,
 * log management, and development debugging support.
 * 
 * Replaces Angular LoggingService with React patterns for comprehensive
 * application logging and monitoring integration.
 * 
 * Features:
 * - Configurable log levels for development and production
 * - Structured logging with context, timestamps, and categorization
 * - Log persistence with automatic rotation and storage management
 * - Integration with external monitoring services
 * - Development debugging support with filtering and search
 * - Performance metrics collection and logging
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  LogLevel,
  LogEntry,
  LogContext,
  LogFilter,
  LoggerConfig,
  LoggerHookReturn,
  LogStorage,
  PerformanceContext,
  LOG_LEVEL_PRIORITY,
  DEFAULT_LOGGER_CONFIG,
  LOG_CATEGORIES,
} from '../types/logging';

/**
 * Generate unique ID for log entries
 */
function generateLogId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current environment
 */
function getEnvironment(): 'development' | 'production' | 'test' {
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development';
  }
  return 'development';
}

/**
 * LocalStorage-based log storage implementation
 */
class LocalStorageLogStorage implements LogStorage {
  private readonly storageKey = 'df-admin-logs';
  private readonly maxSize = 5 * 1024 * 1024; // 5MB limit

  async store(entry: LogEntry): Promise<void> {
    try {
      const existing = await this.retrieve();
      const updated = [...existing, entry];
      
      // Apply rotation if needed
      const rotated = this.applyRotation(updated);
      
      localStorage.setItem(this.storageKey, JSON.stringify(rotated));
    } catch (error) {
      // If storage fails, log to console as fallback
      console.warn('Failed to store log entry:', error);
    }
  }

  async retrieve(filter?: LogFilter): Promise<LogEntry[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const logs: LogEntry[] = JSON.parse(stored);
      return filter ? this.applyFilter(logs, filter) : logs;
    } catch (error) {
      console.warn('Failed to retrieve logs:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  async getStats(): Promise<{
    count: number;
    size: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  }> {
    const logs = await this.retrieve();
    const stored = localStorage.getItem(this.storageKey);
    const size = stored ? new Blob([stored]).size : 0;
    
    const timestamps = logs.map(log => new Date(log.timestamp));
    const oldestEntry = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(d => d.getTime()))) : undefined;
    const newestEntry = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : undefined;
    
    return {
      count: logs.length,
      size,
      oldestEntry,
      newestEntry,
    };
  }

  async rotate(): Promise<void> {
    const logs = await this.retrieve();
    const rotated = this.applyRotation(logs);
    localStorage.setItem(this.storageKey, JSON.stringify(rotated));
  }

  private applyRotation(logs: LogEntry[]): LogEntry[] {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const maxLogs = 1000;
    const now = Date.now();
    
    // Filter by age
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return now - logTime < maxAge;
    });
    
    // Keep only the most recent logs if we exceed the limit
    if (recentLogs.length > maxLogs) {
      return recentLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxLogs);
    }
    
    return recentLogs;
  }

  private applyFilter(logs: LogEntry[], filter: LogFilter): LogEntry[] {
    return logs.filter(log => {
      // Level filter
      if (filter.level) {
        const levels = Array.isArray(filter.level) ? filter.level : [filter.level];
        if (!levels.includes(log.level)) return false;
      }
      
      // Date range filter
      if (filter.dateRange) {
        const logTime = new Date(log.timestamp);
        if (logTime < filter.dateRange.start || logTime > filter.dateRange.end) {
          return false;
        }
      }
      
      // Component filter
      if (filter.component && log.context?.component !== filter.component) {
        return false;
      }
      
      // Category filter
      if (filter.category && log.category !== filter.category) {
        return false;
      }
      
      // User ID filter
      if (filter.userId && log.context?.userId !== filter.userId) {
        return false;
      }
      
      // Message content filter
      if (filter.messageContains && !log.message.toLowerCase().includes(filter.messageContains.toLowerCase())) {
        return false;
      }
      
      // Context filter
      if (filter.contextFilter && log.context) {
        for (const [key, value] of Object.entries(filter.contextFilter)) {
          if (log.context.metadata?.[key] !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
}

/**
 * External monitoring service integration
 */
class MonitoringService {
  private config: NonNullable<LoggerConfig['monitoring']>;
  private queue: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: NonNullable<LoggerConfig['monitoring']>) {
    this.config = config;
    this.startFlushTimer();
  }

  async send(entry: LogEntry): Promise<void> {
    if (!this.config.enabled || !this.config.endpoint) return;

    this.queue.push(entry);
    
    if (this.queue.length >= (this.config.batchSize || 10)) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.config.endpoint) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ logs: batch }),
      });
    } catch (error) {
      console.warn('Failed to send logs to monitoring service:', error);
      // Re-queue failed logs
      this.queue.unshift(...batch);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval || 30000);
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

/**
 * Performance measurement utilities
 */
class PerformanceTracker {
  private marks = new Map<string, number>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string): PerformanceContext | null {
    const endTime = performance.now();
    const startTime = startMark ? this.marks.get(startMark) : this.marks.get(name);
    
    if (typeof startTime !== 'number') {
      console.warn(`Performance mark "${startMark || name}" not found`);
      return null;
    }

    const duration = endTime - startTime;
    
    // Clean up the mark
    this.marks.delete(startMark || name);
    
    return {
      metric: name,
      duration,
      startTime,
      endTime,
      marks: Object.fromEntries(this.marks),
      memory: this.getMemoryInfo(),
    };
  }

  private getMemoryInfo() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
      };
    }
    return undefined;
  }
}

/**
 * Main logging hook implementation
 */
export function useLogger(initialConfig?: Partial<LoggerConfig>): LoggerHookReturn {
  // Configuration state
  const [config, setConfig] = useState<LoggerConfig>(() => ({
    ...DEFAULT_LOGGER_CONFIG,
    level: getEnvironment() === 'development' ? 'debug' : 'info',
    performance: getEnvironment() === 'development',
    ...initialConfig,
  }));

  // In-memory logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [storageStats, setStorageStats] = useState<{
    count: number;
    size: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  } | null>(null);

  // Persistent storage and monitoring
  const storage = useRef<LogStorage>(new LocalStorageLogStorage());
  const monitoring = useRef<MonitoringService | null>(null);
  const performance = useRef<PerformanceTracker>(new PerformanceTracker());
  const globalContext = useRef<LogContext>({});

  // Initialize monitoring service
  useEffect(() => {
    if (config.monitoring?.enabled) {
      monitoring.current = new MonitoringService(config.monitoring);
    } else {
      monitoring.current?.destroy();
      monitoring.current = null;
    }

    return () => {
      monitoring.current?.destroy();
    };
  }, [config.monitoring]);

  // Load existing logs on mount
  useEffect(() => {
    const loadLogs = async () => {
      if (config.persistence) {
        const storedLogs = await storage.current.retrieve();
        setLogs(storedLogs);
        
        const stats = await storage.current.getStats();
        setStorageStats(stats);
      }
    };

    loadLogs();
  }, [config.persistence]);

  // Auto-rotation timer
  useEffect(() => {
    if (!config.rotation) return;

    const rotationTimer = setInterval(async () => {
      await storage.current.rotate();
      const stats = await storage.current.getStats();
      setStorageStats(stats);
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(rotationTimer);
  }, [config.rotation]);

  // Core logging function
  const createLog = useCallback(async (
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    performanceContext?: PerformanceContext
  ) => {
    // Check if log level meets threshold
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[config.level]) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      id: generateLogId(),
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...globalContext.current, ...context },
      performance: performanceContext,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: config.development?.enableStackTrace ? error.stack : undefined,
        cause: error.cause,
      } : undefined,
      environment: getEnvironment(),
      client: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now(),
      },
    };

    // Console output
    if (config.console) {
      const consoleMethod = level === 'debug' ? 'debug' :
                           level === 'info' ? 'info' :
                           level === 'warn' ? 'warn' :
                           'error';
      
      const contextStr = entry.context ? ` [${JSON.stringify(entry.context)}]` : '';
      console[consoleMethod](`[${level.toUpperCase()}] ${message}${contextStr}`, error || '');
    }

    // Store in memory
    setLogs(prev => {
      const updated = [...prev, entry];
      // Keep only maxLogs in memory
      if (updated.length > config.maxLogs) {
        return updated.slice(-config.maxLogs);
      }
      return updated;
    });

    // Persist to storage
    if (config.persistence) {
      await storage.current.store(entry);
      const stats = await storage.current.getStats();
      setStorageStats(stats);
    }

    // Send to monitoring service
    if (monitoring.current) {
      await monitoring.current.send(entry);
    }
  }, [config]);

  // Logging methods
  const debug = useCallback((message: string, context?: LogContext) => {
    createLog('debug', message, { ...context, category: context?.component || LOG_CATEGORIES.SYSTEM });
  }, [createLog]);

  const info = useCallback((message: string, context?: LogContext) => {
    createLog('info', message, { ...context, category: context?.component || LOG_CATEGORIES.SYSTEM });
  }, [createLog]);

  const warn = useCallback((message: string, context?: LogContext) => {
    createLog('warn', message, { ...context, category: context?.component || LOG_CATEGORIES.SYSTEM });
  }, [createLog]);

  const error = useCallback((message: string, errorObj?: Error, context?: LogContext) => {
    createLog('error', message, { ...context, category: LOG_CATEGORIES.ERROR }, errorObj);
  }, [createLog]);

  const fatal = useCallback((message: string, errorObj?: Error, context?: LogContext) => {
    createLog('fatal', message, { ...context, category: LOG_CATEGORIES.ERROR }, errorObj);
  }, [createLog]);

  const logPerformance = useCallback((metric: string, duration: number, context?: PerformanceContext) => {
    const perfContext: PerformanceContext = {
      metric,
      duration,
      startTime: context?.startTime || performance.now() - duration,
      endTime: context?.endTime || performance.now(),
      marks: context?.marks,
      memory: context?.memory,
    };
    
    createLog('info', `Performance: ${metric} completed in ${duration.toFixed(2)}ms`, 
      { category: LOG_CATEGORIES.PERFORMANCE }, undefined, perfContext);
  }, [createLog]);

  // Log retrieval and filtering
  const getLogs = useCallback((filter?: LogFilter): LogEntry[] => {
    if (!filter) return logs;
    
    return logs.filter(log => {
      // Apply the same filtering logic as storage
      if (filter.level) {
        const levels = Array.isArray(filter.level) ? filter.level : [filter.level];
        if (!levels.includes(log.level)) return false;
      }
      
      if (filter.component && log.context?.component !== filter.component) return false;
      if (filter.category && log.category !== filter.category) return false;
      if (filter.userId && log.context?.userId !== filter.userId) return false;
      if (filter.messageContains && !log.message.toLowerCase().includes(filter.messageContains.toLowerCase())) return false;
      
      if (filter.dateRange) {
        const logTime = new Date(log.timestamp);
        if (logTime < filter.dateRange.start || logTime > filter.dateRange.end) return false;
      }
      
      return true;
    });
  }, [logs]);

  // Search functionality
  const search = useCallback((query: string, filter?: LogFilter): LogEntry[] => {
    const searchFilter: LogFilter = {
      ...filter,
      messageContains: query,
    };
    return getLogs(searchFilter);
  }, [getLogs]);

  // Clear logs
  const clearLogs = useCallback(async () => {
    setLogs([]);
    if (config.persistence) {
      await storage.current.clear();
      setStorageStats({ count: 0, size: 0 });
    }
  }, [config.persistence]);

  // Export logs
  const exportLogs = useCallback((format: 'json' | 'csv' = 'json'): string => {
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }
    
    // CSV format
    const headers = ['Timestamp', 'Level', 'Message', 'Component', 'Category', 'User ID'];
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.timestamp,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`, // Escape quotes
        log.context?.component || '',
        log.category || '',
        log.context?.userId || '',
      ].join(','))
    ];
    
    return csvRows.join('\n');
  }, [logs]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<LoggerConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Performance measurement utilities
  const startPerformanceMeasure = useCallback((name: string) => {
    performance.current.mark(name);
  }, []);

  const endPerformanceMeasure = useCallback((name: string) => {
    const result = performance.current.measure(name);
    if (result) {
      logPerformance(name, result.duration, result);
    }
  }, [logPerformance]);

  // Global context management
  const setGlobalContext = useCallback((context: Partial<LogContext>) => {
    globalContext.current = { ...globalContext.current, ...context };
  }, []);

  const getGlobalContext = useCallback(() => globalContext.current, []);

  // Return the hook interface
  return useMemo(() => ({
    debug,
    info,
    warn,
    error,
    fatal,
    performance: logPerformance,
    getLogs,
    search,
    clearLogs,
    exportLogs,
    config,
    updateConfig,
    logCount: logs.length,
    storageStats,
    // Additional utilities
    startPerformanceMeasure,
    endPerformanceMeasure,
    setGlobalContext,
    getGlobalContext,
  }), [
    debug, info, warn, error, fatal, logPerformance,
    getLogs, search, clearLogs, exportLogs,
    config, updateConfig, logs.length, storageStats,
    startPerformanceMeasure, endPerformanceMeasure,
    setGlobalContext, getGlobalContext,
  ]);
}

/**
 * Higher-order component for automatic error logging
 */
export function withErrorLogging<T extends object>(
  Component: React.ComponentType<T>,
  componentName?: string
): React.ComponentType<T> {
  return function LoggingWrapper(props: T) {
    const logger = useLogger();
    
    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        logger.error('Uncaught error', event.error, {
          component: componentName || Component.name,
          category: LOG_CATEGORIES.ERROR,
          action: 'error_boundary',
        });
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        logger.error('Unhandled promise rejection', new Error(String(event.reason)), {
          component: componentName || Component.name,
          category: LOG_CATEGORIES.ERROR,
          action: 'promise_rejection',
        });
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, [logger]);

    return <Component {...props} />;
  };
}

/**
 * Performance measurement decorator
 */
export function measurePerformance(metricName: string) {
  return function <T extends (...args: any[]) => any>(
    target: T
  ): T {
    return ((...args: any[]) => {
      const start = performance.now();
      const result = target(...args);
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start;
          console.log(`Performance: ${metricName} completed in ${duration.toFixed(2)}ms`);
        });
      } else {
        const duration = performance.now() - start;
        console.log(`Performance: ${metricName} completed in ${duration.toFixed(2)}ms`);
        return result;
      }
    }) as T;
  };
}

export default useLogger;