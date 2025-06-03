/**
 * Global error state management hook that centralizes error handling, 
 * error reporting, and error recovery workflows.
 * 
 * Replaces Angular DfErrorService with React state management for consistent 
 * error handling and user feedback across the entire application.
 * 
 * Features:
 * - Global error state management with centralized error collection and reporting
 * - Error categorization and typing for different error scenarios and recovery strategies
 * - Error persistence with automatic clearing and timeout-based error management
 * - Integration with error boundaries for component-level error handling
 * - Error logging and monitoring integration for application observability
 * - User-friendly error presentation with actionable error messages and recovery options
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  AppError,
  ErrorCategory,
  ErrorSeverity,
  ErrorFilter,
  ErrorStats,
  ErrorConfig,
  UseErrorReturn,
  ErrorPersistenceLevel,
  ErrorRecoveryAction,
  createApiError,
  createValidationError,
  createNetworkError,
  isRetryableError,
  getUserFriendlyMessage,
  DEFAULT_ERROR_CONFIG,
  ERROR_SEVERITY_TO_LOG_LEVEL,
} from '../types/error';
import { useLogger } from './use-logger';
import { LogContext } from '../types/logging';

/**
 * Generate unique error ID
 */
function generateErrorId(category: ErrorCategory): string {
  return `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Local storage utilities for error persistence
 */
class ErrorStorage {
  private readonly storageKey = 'df-admin-errors';
  private readonly maxStorageSize = 2 * 1024 * 1024; // 2MB limit

  store(errors: AppError[]): void {
    try {
      // Only store errors marked for persistence
      const persistentErrors = errors.filter(error => 
        error.persistence === 'permanent' || error.persistence === 'session'
      );

      const data = JSON.stringify(persistentErrors);
      
      // Check size limit
      if (new Blob([data]).size > this.maxStorageSize) {
        // Keep only the most recent errors
        const sortedErrors = persistentErrors
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, Math.floor(persistentErrors.length / 2));
        
        localStorage.setItem(this.storageKey, JSON.stringify(sortedErrors));
      } else {
        localStorage.setItem(this.storageKey, data);
      }
    } catch (error) {
      console.warn('Failed to persist errors to localStorage:', error);
    }
  }

  retrieve(): AppError[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const errors: AppError[] = JSON.parse(stored);
      
      // Filter out expired errors
      const now = Date.now();
      return errors.filter(error => {
        if (error.persistence === 'temporary') return false;
        
        const errorTime = new Date(error.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        return (now - errorTime) < maxAge;
      });
    } catch (error) {
      console.warn('Failed to retrieve errors from localStorage:', error);
      return [];
    }
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}

/**
 * Error reporting service
 */
class ErrorReporter {
  private config: ErrorConfig['reporting'];
  private queue: AppError[] = [];
  private reportCount = 0;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: ErrorConfig['reporting']) {
    this.config = config;
    this.startFlushTimer();
  }

  async report(error: AppError): Promise<void> {
    if (!this.config.enabled || !this.config.endpoint) return;
    
    // Check session limit
    if (this.config.maxReportsPerSession && 
        this.reportCount >= this.config.maxReportsPerSession) {
      return;
    }

    // Add to queue
    this.queue.push({
      ...error,
      reported: true,
    });

    this.reportCount++;

    // Flush immediately if not batching or queue is full
    if (!this.config.batching?.enabled || 
        this.queue.length >= (this.config.batching?.batchSize || 5)) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0 || !this.config.endpoint) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      const payload = {
        errors: batch.map(error => ({
          id: error.id,
          message: error.message,
          category: error.category,
          severity: error.severity,
          statusCode: error.statusCode,
          source: error.source,
          stack: this.config.includeStackTrace ? error.stack : undefined,
          timestamp: error.timestamp,
          context: this.config.includeUserContext ? error.context : undefined,
          metadata: error.metadata,
        })),
        timestamp: new Date().toISOString(),
        sessionId: this.generateSessionId(),
      };

      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 
            'Authorization': `Bearer ${this.config.apiKey}` 
          }),
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Failed to report errors:', error);
      // Re-queue failed reports
      this.queue.unshift(...batch);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    if (this.config.batching?.enabled) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.batching.flushInterval || 30000);
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  updateConfig(config: ErrorConfig['reporting']): void {
    this.config = config;
    this.startFlushTimer();
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

/**
 * Main error management hook
 */
export function useError(initialConfig?: Partial<ErrorConfig>): UseErrorReturn {
  // Configuration state
  const [config, setConfig] = useState<ErrorConfig>(() => ({
    ...DEFAULT_ERROR_CONFIG,
    ...initialConfig,
  }));

  // Error state
  const [errors, setErrors] = useState<AppError[]>([]);
  
  // Dependencies
  const logger = useLogger();
  const storage = useRef<ErrorStorage>(new ErrorStorage());
  const reporter = useRef<ErrorReporter>(new ErrorReporter(config.reporting));
  const errorChangeCallbacks = useRef<Set<(errors: AppError[]) => void>>(new Set());

  // Load persisted errors on mount
  useEffect(() => {
    if (config.persistErrors) {
      const persistedErrors = storage.current.retrieve();
      if (persistedErrors.length > 0) {
        setErrors(persistedErrors);
      }
    }
  }, [config.persistErrors]);

  // Persist errors when they change
  useEffect(() => {
    if (config.persistErrors) {
      storage.current.store(errors);
    }
  }, [errors, config.persistErrors]);

  // Update reporter config when config changes
  useEffect(() => {
    reporter.current.updateConfig(config.reporting);
  }, [config.reporting]);

  // Auto-clear timer for dismissed errors
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setErrors(prev => prev.filter(error => {
        if (!error.dismissed) return true;
        
        const errorTime = new Date(error.timestamp).getTime();
        return (now - errorTime) < config.autoClearTimeout;
      }));
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [config.autoClearTimeout]);

  // Auto-hide timer for errors with timeouts
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    errors.forEach(error => {
      if (error.timeout && error.timeout > 0 && !error.dismissed) {
        const timer = setTimeout(() => {
          dismissError(error.id);
        }, error.timeout);
        
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [errors]);

  // Notify error change callbacks
  useEffect(() => {
    errorChangeCallbacks.current.forEach(callback => {
      try {
        callback(errors);
      } catch (error) {
        console.warn('Error in error change callback:', error);
      }
    });
  }, [errors]);

  // Add a new error
  const addError = useCallback((
    errorInput: Partial<AppError> & Pick<AppError, 'message' | 'category'>
  ): string => {
    const now = new Date().toISOString();
    const errorId = errorInput.id || generateErrorId(errorInput.category);
    
    // Determine severity if not provided
    const severity: ErrorSeverity = errorInput.severity || 'medium';
    
    // Create complete error object
    const error: AppError = {
      id: errorId,
      message: errorInput.message,
      category: errorInput.category,
      severity,
      timestamp: now,
      persistence: errorInput.persistence || 'session',
      recoveryActions: errorInput.recoveryActions || 
        config.defaultRecoveryActions[errorInput.category] || ['dismiss'],
      retryable: errorInput.retryable ?? false,
      retryCount: 0,
      maxRetries: errorInput.maxRetries || config.maxRetries,
      timeout: errorInput.timeout || config.autoHideBySeverity[severity] || config.defaultTimeout,
      dismissed: false,
      reported: false,
      ...errorInput,
    };

    // Log the error
    const logLevel = ERROR_SEVERITY_TO_LOG_LEVEL[severity];
    const logContext: LogContext = {
      component: error.source,
      action: 'error_occurred',
      metadata: {
        errorId: error.id,
        category: error.category,
        severity: error.severity,
        retryable: error.retryable,
        ...error.metadata,
      },
      ...error.context,
    };

    logger.error(
      error.message,
      error.originalError,
      logContext
    );

    // Add to state
    setErrors(prev => {
      const filtered = prev.filter(e => e.id !== errorId);
      const updated = [...filtered, error];
      
      // Maintain max errors limit
      if (updated.length > config.maxErrors) {
        return updated
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, config.maxErrors);
      }
      
      return updated;
    });

    // Auto-report if configured
    if (config.reporting.autoReportSeverity) {
      const severityLevels: ErrorSeverity[] = ['low', 'medium', 'high', 'critical'];
      const autoReportIndex = severityLevels.indexOf(config.reporting.autoReportSeverity);
      const errorSeverityIndex = severityLevels.indexOf(severity);
      
      if (errorSeverityIndex >= autoReportIndex) {
        reporter.current.report(error);
      }
    }

    return errorId;
  }, [config, logger]);

  // Remove error by ID
  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
    
    logger.debug('Error removed', {
      action: 'error_removed',
      metadata: { errorId: id },
    });
  }, [logger]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
    
    if (config.persistErrors) {
      storage.current.clear();
    }
    
    logger.info('All errors cleared', {
      action: 'errors_cleared',
    });
  }, [config.persistErrors, logger]);

  // Clear errors by category
  const clearErrorsByCategory = useCallback((category: ErrorCategory) => {
    setErrors(prev => prev.filter(error => error.category !== category));
    
    logger.debug('Errors cleared by category', {
      action: 'errors_cleared_by_category',
      metadata: { category },
    });
  }, [logger]);

  // Clear dismissed errors
  const clearDismissedErrors = useCallback(() => {
    setErrors(prev => prev.filter(error => !error.dismissed));
    
    logger.debug('Dismissed errors cleared', {
      action: 'dismissed_errors_cleared',
    });
  }, [logger]);

  // Dismiss error
  const dismissError = useCallback((id: string) => {
    setErrors(prev => prev.map(error => 
      error.id === id ? { ...error, dismissed: true } : error
    ));
    
    logger.debug('Error dismissed', {
      action: 'error_dismissed',
      metadata: { errorId: id },
    });
  }, [logger]);

  // Retry error
  const retryError = useCallback(async (id: string) => {
    const error = errors.find(e => e.id === id);
    if (!error || !isRetryableError(error)) {
      logger.warn('Attempted to retry non-retryable error', {
        action: 'retry_failed',
        metadata: { errorId: id, retryable: error?.retryable },
      });
      return;
    }

    // Increment retry count
    setErrors(prev => prev.map(e => 
      e.id === id ? { 
        ...e, 
        retryCount: (e.retryCount || 0) + 1,
        dismissed: false,
      } : e
    ));

    logger.info('Error retry attempted', {
      action: 'error_retry',
      metadata: { 
        errorId: id, 
        retryCount: (error.retryCount || 0) + 1,
        maxRetries: error.maxRetries,
      },
    });

    // If max retries reached, mark as non-retryable
    if ((error.retryCount || 0) + 1 >= (error.maxRetries || config.maxRetries)) {
      setErrors(prev => prev.map(e => 
        e.id === id ? { ...e, retryable: false } : e
      ));
    }
  }, [errors, config.maxRetries, logger]);

  // Report error
  const reportError = useCallback(async (id: string) => {
    const error = errors.find(e => e.id === id);
    if (!error) return;

    try {
      await reporter.current.report(error);
      
      setErrors(prev => prev.map(e => 
        e.id === id ? { ...e, reported: true } : e
      ));
      
      logger.info('Error reported', {
        action: 'error_reported',
        metadata: { errorId: id },
      });
    } catch (reportError) {
      logger.error('Failed to report error', reportError as Error, {
        action: 'error_report_failed',
        metadata: { errorId: id },
      });
    }
  }, [errors, logger]);

  // Get filtered errors
  const getErrors = useCallback((filter?: ErrorFilter): AppError[] => {
    if (!filter) return errors;

    return errors.filter(error => {
      // Category filter
      if (filter.categories && !filter.categories.includes(error.category)) {
        return false;
      }

      // Severity filter
      if (filter.severities && !filter.severities.includes(error.severity)) {
        return false;
      }

      // Source filter
      if (filter.sources && error.source && !filter.sources.includes(error.source)) {
        return false;
      }

      // Date range filter
      if (filter.dateRange) {
        const errorTime = new Date(error.timestamp);
        if (errorTime < filter.dateRange.start || errorTime > filter.dateRange.end) {
          return false;
        }
      }

      // Dismissed filter
      if (filter.includeDismissed === false && error.dismissed) {
        return false;
      }

      // Reported filter
      if (filter.includeReported === false && error.reported) {
        return false;
      }

      // Text search
      if (filter.searchText && 
          !error.message.toLowerCase().includes(filter.searchText.toLowerCase()) &&
          !error.details?.toLowerCase().includes(filter.searchText.toLowerCase())) {
        return false;
      }

      // Persistence level filter
      if (filter.persistenceLevel && !filter.persistenceLevel.includes(error.persistence)) {
        return false;
      }

      return true;
    });
  }, [errors]);

  // Get error statistics
  const getErrorStats = useCallback((): ErrorStats => {
    const total = errors.length;
    
    // Count by category
    const byCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    // Count by severity
    const bySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    // Top errors
    const errorCounts = errors.reduce((acc, error) => {
      const key = error.message;
      if (!acc[key]) {
        acc[key] = { count: 0, lastOccurrence: error.timestamp };
      }
      acc[key].count++;
      if (error.timestamp > acc[key].lastOccurrence) {
        acc[key].lastOccurrence = error.timestamp;
      }
      return acc;
    }, {} as Record<string, { count: number; lastOccurrence: string }>);

    const topErrors = Object.entries(errorCounts)
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Trend data (last 7 days)
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = errors.filter(error => 
        error.timestamp.startsWith(dateStr)
      ).length;
      
      trend.push({ date: dateStr, count });
    }

    // Resolution statistics
    const resolution = {
      dismissed: errors.filter(e => e.dismissed).length,
      retried: errors.filter(e => (e.retryCount || 0) > 0).length,
      reported: errors.filter(e => e.reported).length,
      unresolved: errors.filter(e => !e.dismissed && !e.reported).length,
    };

    return {
      total,
      byCategory,
      bySeverity,
      topErrors,
      trend,
      resolution,
    };
  }, [errors]);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<ErrorConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    
    logger.debug('Error configuration updated', {
      action: 'error_config_updated',
      metadata: { updatedKeys: Object.keys(newConfig) },
    });
  }, [logger]);

  // Subscribe to error changes
  const onErrorChange = useCallback((callback: (errors: AppError[]) => void) => {
    errorChangeCallbacks.current.add(callback);
    
    return () => {
      errorChangeCallbacks.current.delete(callback);
    };
  }, []);

  // Computed values
  const hasCriticalErrors = useMemo(() => 
    errors.some(error => error.severity === 'critical' && !error.dismissed),
    [errors]
  );

  const hasUnresolvedErrors = useMemo(() => 
    errors.some(error => !error.dismissed && !error.reported),
    [errors]
  );

  const errorCountBySeverity = useMemo(() => 
    errors.reduce((acc, error) => {
      if (!error.dismissed) {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
      }
      return acc;
    }, {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    } as Record<ErrorSeverity, number>),
    [errors]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reporter.current.destroy();
    };
  }, []);

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    clearErrorsByCategory,
    clearDismissedErrors,
    dismissError,
    retryError,
    reportError,
    getErrors,
    getErrorStats,
    updateConfig,
    config,
    hasCriticalErrors,
    hasUnresolvedErrors,
    errorCountBySeverity,
    onErrorChange,
  };
}

/**
 * Higher-order component for automatic error boundary integration
 */
export function withErrorHandling<T extends object>(
  Component: React.ComponentType<T>,
  componentName?: string
): React.ComponentType<T> {
  return function ErrorHandlingWrapper(props: T) {
    const { addError } = useError();
    
    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        addError({
          message: event.message || 'Uncaught error',
          category: 'system',
          severity: 'high',
          source: componentName || Component.name,
          originalError: event.error,
          stack: event.error?.stack,
          context: {
            component: componentName || Component.name,
            action: 'error_boundary',
            route: window.location.pathname,
          },
        });
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        addError({
          message: 'Unhandled promise rejection',
          category: 'system',
          severity: 'high',
          source: componentName || Component.name,
          originalError: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          context: {
            component: componentName || Component.name,
            action: 'promise_rejection',
            route: window.location.pathname,
          },
        });
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, [addError]);

    return <Component {...props} />;
  };
}

/**
 * Utility functions for common error scenarios
 */
export const errorUtils = {
  /**
   * Create and add an API error
   */
  apiError: (message: string, statusCode: number, details?: any) => {
    return createApiError(message, statusCode, details);
  },

  /**
   * Create and add a validation error
   */
  validationError: (message: string, field?: string, details?: any) => {
    return createValidationError(message, field, details);
  },

  /**
   * Create and add a network error
   */
  networkError: (message: string, type: 'timeout' | 'offline' | 'dns' | 'connection_refused' | 'ssl' | 'unknown', details?: any) => {
    return createNetworkError(message, type, details);
  },

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage,

  /**
   * Check if error is retryable
   */
  isRetryableError,
};

export default useError;