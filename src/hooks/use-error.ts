/**
 * Global error state management hook for DreamFactory Admin Interface
 * 
 * This hook provides comprehensive error handling capabilities that replace the Angular
 * DfErrorService with React 19/Next.js 15.1 patterns. It offers:
 * 
 * - Centralized error collection and categorization with type-safe error management
 * - Automatic error recovery with circuit breaker and retry mechanisms  
 * - Error boundary integration for component-level error handling
 * - User-friendly error presentation with actionable recovery options
 * - Performance tracking and monitoring integration with comprehensive metrics
 * - Error persistence with intelligent timeout and cleanup mechanisms
 * - Accessibility-compliant error notifications with WCAG 2.1 AA support
 * 
 * Replaces Angular BehaviorSubject patterns with React state management using Zustand
 * for optimal performance and simplified state patterns as per the migration strategy.
 * 
 * @fileoverview Global error state management with comprehensive error handling
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  ErrorType,
  ErrorSeverity,
  ErrorCategory,
  CircuitBreakerState,
  AppError,
  BaseError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  ClientError,
  SystemError,
  ErrorContext,
  ErrorReportingOptions,
  RetryConfig,
  CircuitBreakerConfig,
  RetryAttempt,
  RecoveryAction,
  RecoveryActionType,
  UserFriendlyErrorMessage,
  ErrorRecoveryOptions,
  ErrorBoundaryInfo,
  ErrorMetrics,
  ErrorHandlerEvent,
  ErrorHandlerEventType,
  ErrorHandlerEventListener,
  ErrorHandlerConfig,
  UseErrorHandlerReturn,
  ErrorContextCollector,
  ErrorMessageGenerator,
  ApiErrorClassifier,
  NetworkErrorDetector,
  ErrorSanitizer,
  ErrorRecoveryStrategy,
  ErrorReportingService,
} from '@/types/error';
import { useLogger } from '@/hooks/use-logger';
import React from 'react';

// ============================================================================
// Default Configuration and Constants
// ============================================================================

/**
 * Default error handler configuration optimized for production use
 */
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableNetworkErrors: ['TIMEOUT', 'NETWORK_ERROR', 'CONNECTION_REFUSED'],
  },
  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 300000, // 5 minutes
    halfOpenMaxAttempts: 3,
  },
  reporting: {
    enabled: process.env.NODE_ENV === 'production',
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    includeStackTrace: process.env.NODE_ENV === 'development',
    includeUserContext: true,
    includeAppContext: true,
    excludeFields: ['password', 'token', 'secret', 'key'],
    endpoint: process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT,
    apiKey: process.env.NEXT_PUBLIC_ERROR_REPORTING_API_KEY,
  },
  userExperience: {
    showRetryButton: true,
    autoRetryTransientErrors: true,
    showErrorDetails: process.env.NODE_ENV === 'development',
    notificationDuration: 5000,
    enableAccessibility: true,
    supportI18n: true,
  },
  performance: {
    trackErrorMetrics: true,
    correlationIdEnabled: true,
    responseTimeThresholds: {
      warn: 1000,
      error: 5000,
    },
  },
};

/**
 * Error storage item interface for persistence
 */
interface ErrorStorageItem {
  error: AppError;
  timestamp: number;
  attempts: number;
  recoveryActions: RecoveryAction[];
  userMessage: UserFriendlyErrorMessage;
}

/**
 * Circuit breaker state interface
 */
interface CircuitBreakerInfo {
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime: number;
  halfOpenAttempts: number;
}

/**
 * Error store state interface
 */
interface ErrorStore {
  // Active errors and storage
  errors: Map<string, ErrorStorageItem>;
  metrics: ErrorMetrics;
  circuitBreaker: CircuitBreakerInfo;
  
  // Configuration
  config: ErrorHandlerConfig;
  
  // Actions
  addError: (error: AppError, options?: Partial<ErrorRecoveryOptions>) => string;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
  updateError: (errorId: string, updates: Partial<ErrorStorageItem>) => void;
  updateMetrics: (updates: Partial<ErrorMetrics>) => void;
  updateCircuitBreaker: (updates: Partial<CircuitBreakerInfo>) => void;
  updateConfig: (updates: Partial<ErrorHandlerConfig>) => void;
}

// ============================================================================
// Error Store Implementation
// ============================================================================

/**
 * Global error store using Zustand with subscriptions
 */
const useErrorStore = create<ErrorStore>()(
  subscribeWithSelector((set, get) => ({
    errors: new Map(),
    metrics: {
      totalErrors: 0,
      errorsByType: {} as Record<ErrorType, number>,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      retryAttempts: 0,
      recoveredErrors: 0,
      averageResolutionTime: 0,
      circuitBreakerStateChanges: 0,
    },
    circuitBreaker: {
      state: CircuitBreakerState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      halfOpenAttempts: 0,
    },
    config: DEFAULT_CONFIG,

    addError: (error: AppError, options?: Partial<ErrorRecoveryOptions>) => {
      const errorId = generateErrorId();
      const timestamp = Date.now();
      
      const recoveryActions = generateRecoveryActions(error, options);
      const userMessage = generateUserMessage(error, recoveryActions);
      
      const errorItem: ErrorStorageItem = {
        error,
        timestamp,
        attempts: 0,
        recoveryActions,
        userMessage,
      };

      set((state) => {
        const newErrors = new Map(state.errors);
        newErrors.set(errorId, errorItem);
        
        // Update metrics
        const newMetrics = {
          ...state.metrics,
          totalErrors: state.metrics.totalErrors + 1,
          errorsByType: {
            ...state.metrics.errorsByType,
            [error.type]: (state.metrics.errorsByType[error.type] || 0) + 1,
          },
          errorsByCategory: {
            ...state.metrics.errorsByCategory,
            [error.category]: (state.metrics.errorsByCategory[error.category] || 0) + 1,
          },
        };

        return {
          errors: newErrors,
          metrics: newMetrics,
        };
      });

      return errorId;
    },

    removeError: (errorId: string) => {
      set((state) => {
        const newErrors = new Map(state.errors);
        const error = newErrors.get(errorId);
        
        if (error) {
          newErrors.delete(errorId);
          
          // Update metrics for recovery
          const newMetrics = {
            ...state.metrics,
            recoveredErrors: state.metrics.recoveredErrors + 1,
          };

          return {
            errors: newErrors,
            metrics: newMetrics,
          };
        }
        
        return state;
      });
    },

    clearErrors: () => {
      set((state) => ({
        ...state,
        errors: new Map(),
      }));
    },

    updateError: (errorId: string, updates: Partial<ErrorStorageItem>) => {
      set((state) => {
        const newErrors = new Map(state.errors);
        const existingError = newErrors.get(errorId);
        
        if (existingError) {
          newErrors.set(errorId, { ...existingError, ...updates });
        }
        
        return { errors: newErrors };
      });
    },

    updateMetrics: (updates: Partial<ErrorMetrics>) => {
      set((state) => ({
        metrics: { ...state.metrics, ...updates },
      }));
    },

    updateCircuitBreaker: (updates: Partial<CircuitBreakerInfo>) => {
      set((state) => ({
        circuitBreaker: { ...state.circuitBreaker, ...updates },
      }));
    },

    updateConfig: (updates: Partial<ErrorHandlerConfig>) => {
      set((state) => ({
        config: { ...state.config, ...updates },
      }));
    },
  }))
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique error ID with timestamp and random component
 */
function generateErrorId(): string {
  return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate correlation ID for error tracking
 */
function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Classify unknown errors into typed AppError format
 */
function classifyError(error: any, context?: Partial<ErrorContext>): AppError {
  const baseError: Partial<BaseError> = {
    timestamp: new Date().toISOString(),
    isRetryable: false,
    userFacing: true,
    correlationId: generateCorrelationId(),
    context,
  };

  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      ...baseError,
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.INFRASTRUCTURE,
      code: 'NETWORK_FETCH_FAILED',
      message: 'Network connection failed',
      originalError: error,
      isRetryable: true,
      networkCode: 'FETCH_ERROR',
      isOffline: !navigator.onLine,
    } as NetworkError;
  }

  // Validation errors (common patterns)
  if (error.name === 'ValidationError' || error.message?.includes('validation')) {
    return {
      ...baseError,
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.USER_INPUT,
      code: 'VALIDATION_FAILED',
      message: error.message || 'Validation failed',
      originalError: error,
      isRetryable: false,
      fieldErrors: error.fieldErrors || {},
    } as ValidationError;
  }

  // Authentication errors
  if (error.status === 401 || error.message?.includes('unauthorized')) {
    return {
      ...baseError,
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SECURITY,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication required',
      originalError: error,
      isRetryable: false,
      requiresLogin: true,
    } as AuthenticationError;
  }

  // Authorization errors
  if (error.status === 403 || error.message?.includes('forbidden')) {
    return {
      ...baseError,
      type: ErrorType.AUTHORIZATION,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SECURITY,
      code: 'ACCESS_FORBIDDEN',
      message: 'Access forbidden',
      originalError: error,
      isRetryable: false,
      requiredPermissions: [],
    } as AuthorizationError;
  }

  // Server errors
  if (error.status >= 500) {
    return {
      ...baseError,
      type: ErrorType.SERVER,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.APPLICATION,
      code: 'SERVER_ERROR',
      message: 'Server error occurred',
      originalError: error,
      isRetryable: true,
      statusCode: error.status,
      serverMessage: error.message,
    } as ServerError;
  }

  // Client errors
  if (error.status >= 400) {
    return {
      ...baseError,
      type: ErrorType.CLIENT,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.USER_INPUT,
      code: 'CLIENT_ERROR',
      message: 'Client error occurred',
      originalError: error,
      isRetryable: false,
      statusCode: error.status,
    } as ClientError;
  }

  // System errors (fallback)
  return {
    ...baseError,
    type: ErrorType.SYSTEM,
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.APPLICATION,
    code: 'SYSTEM_ERROR',
    message: error.message || 'An unexpected error occurred',
    originalError: error,
    isRetryable: false,
    stackTrace: error.stack,
    component: context?.application?.component,
  } as SystemError;
}

/**
 * Generate recovery actions based on error type and context
 */
function generateRecoveryActions(
  error: AppError,
  options?: Partial<ErrorRecoveryOptions>
): RecoveryAction[] {
  const actions: RecoveryAction[] = [];

  // Always include dismiss action
  actions.push({
    type: 'dismiss',
    label: 'Dismiss',
    primary: false,
    accessibility: {
      ariaLabel: 'Dismiss this error message',
      description: 'Close this error notification',
    },
  });

  // Retry action for retryable errors
  if (error.isRetryable) {
    actions.unshift({
      type: 'retry',
      label: 'Retry',
      primary: true,
      accessibility: {
        ariaLabel: 'Retry the failed operation',
        keyboardShortcut: 'r',
        description: 'Attempt the operation again',
      },
    });
  }

  // Authentication-specific actions
  if (error.type === ErrorType.AUTHENTICATION) {
    actions.unshift({
      type: 'login',
      label: 'Sign In',
      primary: true,
      accessibility: {
        ariaLabel: 'Sign in to continue',
        description: 'Navigate to the login page',
      },
    });
  }

  // Refresh action for certain error types
  if ([ErrorType.NETWORK, ErrorType.SERVER].includes(error.type)) {
    actions.push({
      type: 'refresh',
      label: 'Refresh Page',
      primary: false,
      accessibility: {
        ariaLabel: 'Refresh the current page',
        keyboardShortcut: 'F5',
        description: 'Reload the page to try again',
      },
    });
  }

  // Custom actions from options
  if (options?.customActions) {
    actions.push(...options.customActions);
  }

  return actions;
}

/**
 * Generate user-friendly error message
 */
function generateUserMessage(
  error: AppError,
  recoveryActions: RecoveryAction[]
): UserFriendlyErrorMessage {
  let title: string;
  let message: string;
  let actionableMessage: string;

  switch (error.type) {
    case ErrorType.NETWORK:
      title = 'Connection Problem';
      message = 'Unable to connect to the server. Please check your internet connection.';
      actionableMessage = 'Try again in a moment or refresh the page.';
      break;

    case ErrorType.VALIDATION:
      title = 'Input Error';
      message = 'Some information needs to be corrected.';
      actionableMessage = 'Please review and fix the highlighted fields.';
      break;

    case ErrorType.AUTHENTICATION:
      title = 'Sign In Required';
      message = 'You need to sign in to continue.';
      actionableMessage = 'Please sign in with your credentials.';
      break;

    case ErrorType.AUTHORIZATION:
      title = 'Access Denied';
      message = 'You don\'t have permission to perform this action.';
      actionableMessage = 'Contact your administrator if you need access.';
      break;

    case ErrorType.SERVER:
      title = 'Server Error';
      message = 'The server encountered an error processing your request.';
      actionableMessage = 'Please try again. If the problem persists, contact support.';
      break;

    case ErrorType.CLIENT:
      title = 'Request Error';
      message = 'There was an issue with your request.';
      actionableMessage = 'Please check your input and try again.';
      break;

    default:
      title = 'Error';
      message = error.message || 'An unexpected error occurred.';
      actionableMessage = 'Please try again or contact support if the problem persists.';
  }

  return {
    title,
    message,
    actionableMessage,
    recoveryOptions: recoveryActions,
    technicalDetails: {
      code: error.code,
      timestamp: error.timestamp,
      correlationId: error.correlationId,
    },
    accessibility: {
      ariaLabel: `${title}: ${message}`,
      role: 'alert',
      screenReaderText: `Error notification: ${title}. ${message}. ${actionableMessage}`,
    },
  };
}

/**
 * Collect comprehensive error context
 */
function collectErrorContext(): ErrorContext {
  const context: ErrorContext = {
    application: {
      route: typeof window !== 'undefined' ? window.location.pathname : '',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
      timestamp: new Date().toISOString(),
    },
    environment: {
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof window !== 'undefined' ? document.referrer : '',
      online: typeof window !== 'undefined' ? navigator.onLine : true,
      language: typeof window !== 'undefined' ? navigator.language : 'en',
    },
  };

  if (typeof window !== 'undefined') {
    context.environment!.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Performance data if available
    if (performance.memory) {
      context.performance = {
        memory: {
          usedJSMemorySize: performance.memory.usedJSMemorySize,
          totalJSMemorySize: performance.memory.totalJSMemorySize,
        },
      };
    }
  }

  return context;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate retry delay with exponential backoff and jitter
 */
function calculateRetryDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = Math.min(
    config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
    config.maxDelay
  );

  if (config.jitter) {
    return exponentialDelay * (0.5 + Math.random() * 0.5);
  }

  return exponentialDelay;
}

// ============================================================================
// Error Boundary Component Factory
// ============================================================================

/**
 * Create error boundary component with integrated error handling
 */
function createErrorBoundary(
  fallbackComponent?: React.ComponentType<ErrorBoundaryInfo>
): React.ComponentType<React.PropsWithChildren<{}>> {
  class DreamFactoryErrorBoundary extends React.Component<
    React.PropsWithChildren<{}>,
    { hasError: boolean; error?: AppError; errorInfo?: React.ErrorInfo }
  > {
    constructor(props: React.PropsWithChildren<{}>) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): { hasError: boolean; error: AppError } {
      const classifiedError = classifyError(error, collectErrorContext());
      return {
        hasError: true,
        error: classifiedError,
      };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      this.setState({ errorInfo });
      
      // Report error to global error handler
      const { addError } = useErrorStore.getState();
      const classifiedError = classifyError(error, collectErrorContext());
      addError(classifiedError, {
        component: 'ErrorBoundary',
        showTechnicalDetails: true,
      });
    }

    retry = () => {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
      if (this.state.hasError && this.state.error) {
        const errorBoundaryInfo: ErrorBoundaryInfo = {
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          retry: this.retry,
          recoveryActions: generateRecoveryActions(this.state.error),
        };

        if (fallbackComponent) {
          return React.createElement(fallbackComponent, errorBoundaryInfo);
        }

        return (
          <div
            role="alert"
            className="error-boundary-fallback p-6 bg-red-50 border border-red-200 rounded-lg"
          >
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-red-700 mb-4">
              {this.state.error.message}
            </p>
            <button
              onClick={this.retry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              aria-label="Try again"
            >
              Try Again
            </button>
          </div>
        );
      }

      return this.props.children;
    }
  }

  return DreamFactoryErrorBoundary;
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Global error state management hook
 */
export function useError(): UseErrorHandlerReturn {
  const logger = useLogger();
  
  // Store subscriptions
  const errors = useErrorStore((state) => state.errors);
  const metrics = useErrorStore((state) => state.metrics);
  const circuitBreaker = useErrorStore((state) => state.circuitBreaker);
  const config = useErrorStore((state) => state.config);
  
  // Store actions
  const addError = useErrorStore((state) => state.addError);
  const removeError = useErrorStore((state) => state.removeError);
  const clearErrors = useErrorStore((state) => state.clearErrors);
  const updateError = useErrorStore((state) => state.updateError);
  const updateMetrics = useErrorStore((state) => state.updateMetrics);
  const updateCircuitBreaker = useErrorStore((state) => state.updateCircuitBreaker);
  const updateConfig = useErrorStore((state) => state.updateConfig);

  // Event listeners
  const listenersRef = useRef<Set<ErrorHandlerEventListener>>(new Set());

  // Error cleanup timer
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const expiredErrors: string[] = [];

      errors.forEach((errorItem, errorId) => {
        const age = now - errorItem.timestamp;
        if (age > config.userExperience.notificationDuration * 2) {
          expiredErrors.push(errorId);
        }
      });

      expiredErrors.forEach(removeError);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(cleanup);
  }, [errors, config, removeError]);

  // Circuit breaker monitoring
  useEffect(() => {
    const monitor = setInterval(() => {
      if (circuitBreaker.state === CircuitBreakerState.OPEN) {
        const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
        if (timeSinceLastFailure >= config.circuitBreaker.recoveryTimeout) {
          updateCircuitBreaker({
            state: CircuitBreakerState.HALF_OPEN,
            halfOpenAttempts: 0,
          });
          
          emitEvent({
            type: 'circuit_breaker_state_change',
            circuitBreakerState: CircuitBreakerState.HALF_OPEN,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(monitor);
  }, [circuitBreaker, config, updateCircuitBreaker]);

  /**
   * Emit event to all listeners
   */
  const emitEvent = useCallback((event: ErrorHandlerEvent) => {
    listenersRef.current.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('[useError] Event listener error:', error);
      }
    });
  }, []);

  /**
   * Handle any error with comprehensive processing
   */
  const handleError = useCallback(async (
    error: any,
    options?: Partial<ErrorRecoveryOptions>
  ): Promise<UserFriendlyErrorMessage> => {
    const context = collectErrorContext();
    const classifiedError = classifyError(error, context);
    
    // Log the error
    logger.error('Error handled by useError hook', classifiedError, {
      context,
      options,
      circuitBreakerState: circuitBreaker.state,
    });

    // Add to error store
    const errorId = addError(classifiedError, options);
    const errorItem = errors.get(errorId);

    // Emit error event
    emitEvent({
      type: 'error',
      error: classifiedError,
      userMessage: errorItem?.userMessage,
      timestamp: new Date().toISOString(),
    });

    // Update circuit breaker for retryable errors
    if (classifiedError.isRetryable) {
      const newFailureCount = circuitBreaker.failureCount + 1;
      
      if (newFailureCount >= config.circuitBreaker.failureThreshold) {
        updateCircuitBreaker({
          state: CircuitBreakerState.OPEN,
          failureCount: newFailureCount,
          lastFailureTime: Date.now(),
        });
        
        updateMetrics({
          circuitBreakerStateChanges: (metrics.circuitBreakerStateChanges || 0) + 1,
        });
      } else {
        updateCircuitBreaker({
          failureCount: newFailureCount,
          lastFailureTime: Date.now(),
        });
      }
    }

    return errorItem?.userMessage || generateUserMessage(classifiedError, []);
  }, [
    logger,
    addError,
    errors,
    circuitBreaker,
    config,
    updateCircuitBreaker,
    updateMetrics,
    metrics,
    emitEvent,
  ]);

  /**
   * Retry operation with circuit breaker and exponential backoff
   */
  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: Partial<RetryConfig>
  ): Promise<T> => {
    const retryConfig = { ...config.retry, ...options };
    
    // Check circuit breaker
    if (circuitBreaker.state === CircuitBreakerState.OPEN) {
      throw new Error('Circuit breaker is open - operation blocked');
    }

    let lastError: any;
    const attempts: RetryAttempt[] = [];

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Success - reset circuit breaker if needed
        if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN) {
          updateCircuitBreaker({
            state: CircuitBreakerState.CLOSED,
            failureCount: 0,
            halfOpenAttempts: 0,
          });
        } else if (circuitBreaker.failureCount > 0) {
          updateCircuitBreaker({ failureCount: 0 });
        }

        // Update metrics
        updateMetrics({
          retryAttempts: metrics.retryAttempts + attempt - 1,
        });

        return result;
      } catch (error) {
        lastError = error;
        
        const retryAttempt: RetryAttempt = {
          attempt,
          delay: attempt < retryConfig.maxAttempts ? calculateRetryDelay(attempt, retryConfig) : 0,
          error: classifyError(error),
          timestamp: new Date().toISOString(),
        };
        
        attempts.push(retryAttempt);

        // Emit retry event
        emitEvent({
          type: 'retry',
          retryAttempt,
          timestamp: new Date().toISOString(),
        });

        // Check if we should retry
        if (attempt === retryConfig.maxAttempts) {
          break;
        }

        // Check if error is retryable
        const classifiedError = classifyError(error);
        if (!classifiedError.isRetryable) {
          break;
        }

        // Wait before retry
        if (retryAttempt.delay > 0) {
          await sleep(retryAttempt.delay);
        }

        // Update circuit breaker for half-open state
        if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN) {
          const newHalfOpenAttempts = circuitBreaker.halfOpenAttempts + 1;
          if (newHalfOpenAttempts >= config.circuitBreaker.halfOpenMaxAttempts) {
            updateCircuitBreaker({
              state: CircuitBreakerState.OPEN,
              halfOpenAttempts: 0,
              lastFailureTime: Date.now(),
            });
          } else {
            updateCircuitBreaker({
              halfOpenAttempts: newHalfOpenAttempts,
            });
          }
        }
      }
    }

    // All retries failed
    updateMetrics({
      retryAttempts: metrics.retryAttempts + retryConfig.maxAttempts,
    });

    throw lastError;
  }, [
    config,
    circuitBreaker,
    updateCircuitBreaker,
    updateMetrics,
    metrics,
    emitEvent,
  ]);

  /**
   * Recover from a specific error
   */
  const recoverFromError = useCallback(async (
    errorId: string,
    action: RecoveryAction
  ): Promise<boolean> => {
    const errorItem = errors.get(errorId);
    if (!errorItem) {
      return false;
    }

    try {
      switch (action.type) {
        case 'retry':
          // Handled by retryWithBackoff
          break;
          
        case 'refresh':
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
          break;
          
        case 'login':
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          break;
          
        case 'navigate':
          if (action.url && typeof window !== 'undefined') {
            window.location.href = action.url;
          }
          break;
          
        case 'dismiss':
          removeError(errorId);
          break;
          
        case 'reset':
          clearErrors();
          break;
          
        default:
          // Custom recovery action - emit event for handling
          emitEvent({
            type: 'recovery',
            error: errorItem.error,
            recoveryAction: action,
            timestamp: new Date().toISOString(),
          });
      }

      // Log recovery action
      logger.info('Error recovery action taken', {
        errorId,
        action: action.type,
        errorType: errorItem.error.type,
      });

      return true;
    } catch (error) {
      logger.error('Error recovery failed', error, { errorId, action });
      return false;
    }
  }, [errors, removeError, clearErrors, logger, emitEvent]);

  /**
   * Add event listener
   */
  const addEventListener = useCallback((listener: ErrorHandlerEventListener) => {
    listenersRef.current.add(listener);
    
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  // Memoized active errors array
  const activeErrors = useMemo(() => {
    return Array.from(errors.values()).map(item => item.error);
  }, [errors]);

  // Memoized return object
  return useMemo((): UseErrorHandlerReturn => ({
    handleError,
    retryWithBackoff,
    createErrorBoundary,
    recoverFromError,
    clearErrors,
    activeErrors,
    getMetrics: () => metrics,
    resetCircuitBreaker: () => {
      updateCircuitBreaker({
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        halfOpenAttempts: 0,
      });
    },
    getCircuitBreakerState: () => circuitBreaker.state,
    addEventListener,
  }), [
    handleError,
    retryWithBackoff,
    recoverFromError,
    clearErrors,
    activeErrors,
    metrics,
    circuitBreaker.state,
    updateCircuitBreaker,
    addEventListener,
  ]);
}

export default useError;