/**
 * Error handling utility hook that provides error processing, error boundary integration,
 * and error recovery mechanisms. Enhances global error management with specific error
 * handling patterns for different error types and application scenarios.
 * 
 * Features:
 * - Error type classification and handling for different application scenarios
 * - Error boundary integration with proper error recovery and fallback UI
 * - Retry mechanisms with exponential backoff for transient network and API errors
 * - Error context collection including user actions, application state, and environment data
 * - User-friendly error message generation with internationalization and accessibility
 * - Error recovery workflows with both automatic recovery and user-initiated retry options
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useLogger from './use-logger';

// ============================================================================
// Error Type Definitions
// ============================================================================

export enum ErrorType {
  // Network & API Errors
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  TIMEOUT_ERROR = 'timeout_error',
  CONNECTION_ERROR = 'connection_error',
  
  // Authentication & Authorization Errors
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  SESSION_EXPIRED = 'session_expired',
  PERMISSION_DENIED = 'permission_denied',
  
  // Validation & Input Errors
  VALIDATION_ERROR = 'validation_error',
  FORM_ERROR = 'form_error',
  SCHEMA_ERROR = 'schema_error',
  
  // Application & System Errors
  APPLICATION_ERROR = 'application_error',
  COMPONENT_ERROR = 'component_error',
  RUNTIME_ERROR = 'runtime_error',
  CONFIGURATION_ERROR = 'configuration_error',
  
  // Database & Service Errors
  DATABASE_ERROR = 'database_error',
  SERVICE_ERROR = 'service_error',
  TRANSACTION_ERROR = 'transaction_error',
  
  // File & Upload Errors
  FILE_ERROR = 'file_error',
  UPLOAD_ERROR = 'upload_error',
  
  // Unknown & Generic Errors
  UNKNOWN_ERROR = 'unknown_error',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RecoveryStrategy {
  RETRY = 'retry',
  REDIRECT = 'redirect',
  REFRESH = 'refresh',
  LOGOUT = 'logout',
  MANUAL = 'manual',
  IGNORE = 'ignore',
}

export interface ErrorContext {
  // User Context
  userId?: string;
  userRole?: string;
  sessionId?: string;
  
  // Application Context
  component?: string;
  route?: string;
  action?: string;
  feature?: string;
  
  // Technical Context
  userAgent?: string;
  url?: string;
  timestamp?: string;
  
  // Request Context
  requestId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  
  // Application State
  appState?: Record<string, any>;
  formData?: Record<string, any>;
  queryParams?: Record<string, any>;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrorCodes: number[];
  retryableErrorTypes: ErrorType[];
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
  threshold: number;
  timeout: number;
}

export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;
  context?: ErrorContext;
  originalError?: Error;
  statusCode?: number;
  retryable?: boolean;
  userMessage?: string;
  technicalMessage?: string;
  errorId?: string;
  timestamp?: string;
}

export interface ErrorBoundaryInfo {
  componentStack: string;
  errorBoundary?: string;
  errorInfo?: any;
}

export interface RecoveryOptions {
  retry?: () => Promise<void>;
  redirect?: string;
  refresh?: boolean;
  logout?: boolean;
  customAction?: () => Promise<void>;
  userGuidance?: string;
}

export interface ErrorHandlerConfig {
  // Retry Configuration
  defaultRetryConfig: RetryConfig;
  circuitBreakerConfig: {
    threshold: number;
    timeout: number;
    monitoringWindow: number;
  };
  
  // User Experience
  showNotifications: boolean;
  autoRecovery: boolean;
  userFriendlyMessages: boolean;
  
  // Development Settings
  enableDevelopmentMode: boolean;
  verboseLogging: boolean;
  enableStackTrace: boolean;
  
  // Internationalization
  locale: string;
  fallbackLocale: string;
}

export interface ErrorHandlerHookReturn {
  // Error Handling Methods
  handleError: (error: Error | AppError, context?: Partial<ErrorContext>) => Promise<void>;
  createError: (
    type: ErrorType,
    message: string,
    options?: Partial<AppError>
  ) => AppError;
  
  // Recovery Methods
  retry: (operation: () => Promise<any>, config?: Partial<RetryConfig>) => Promise<any>;
  clearError: (errorId?: string) => void;
  clearAllErrors: () => void;
  
  // Error Boundary Integration
  captureErrorBoundary: (error: Error, errorInfo: ErrorBoundaryInfo) => void;
  getErrorBoundaryFallback: (error: AppError) => React.ComponentType<any> | null;
  
  // Error State
  errors: AppError[];
  activeErrors: AppError[];
  lastError: AppError | null;
  
  // Configuration
  updateConfig: (config: Partial<ErrorHandlerConfig>) => void;
  config: ErrorHandlerConfig;
  
  // Recovery Options
  getRecoveryOptions: (error: AppError) => RecoveryOptions;
  executeRecovery: (error: AppError, strategy?: RecoveryStrategy) => Promise<void>;
  
  // Circuit Breaker
  circuitBreakerState: Record<string, CircuitBreakerState>;
  resetCircuitBreaker: (key: string) => void;
  
  // Utilities
  isRetryableError: (error: Error | AppError) => boolean;
  getErrorSeverity: (error: Error | AppError) => ErrorSeverity;
  formatUserMessage: (error: AppError) => string;
}

// ============================================================================
// Constants and Configuration
// ============================================================================

const DEFAULT_CONFIG: ErrorHandlerConfig = {
  defaultRetryConfig: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrorCodes: [408, 429, 500, 502, 503, 504],
    retryableErrorTypes: [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.CONNECTION_ERROR,
      ErrorType.API_ERROR,
    ],
  },
  circuitBreakerConfig: {
    threshold: 5,
    timeout: 60000, // 1 minute
    monitoringWindow: 300000, // 5 minutes
  },
  showNotifications: true,
  autoRecovery: true,
  userFriendlyMessages: true,
  enableDevelopmentMode: typeof process !== 'undefined' && process.env.NODE_ENV === 'development',
  verboseLogging: typeof process !== 'undefined' && process.env.NODE_ENV === 'development',
  enableStackTrace: typeof process !== 'undefined' && process.env.NODE_ENV === 'development',
  locale: 'en',
  fallbackLocale: 'en',
};

const ERROR_TYPE_MAPPING: Record<number, ErrorType> = {
  400: ErrorType.VALIDATION_ERROR,
  401: ErrorType.AUTHENTICATION_ERROR,
  403: ErrorType.AUTHORIZATION_ERROR,
  404: ErrorType.API_ERROR,
  408: ErrorType.TIMEOUT_ERROR,
  422: ErrorType.VALIDATION_ERROR,
  429: ErrorType.API_ERROR,
  500: ErrorType.SERVICE_ERROR,
  502: ErrorType.SERVICE_ERROR,
  503: ErrorType.SERVICE_ERROR,
  504: ErrorType.TIMEOUT_ERROR,
};

const SEVERITY_MAPPING: Record<ErrorType, ErrorSeverity> = {
  [ErrorType.NETWORK_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.API_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.TIMEOUT_ERROR]: ErrorSeverity.LOW,
  [ErrorType.CONNECTION_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.AUTHENTICATION_ERROR]: ErrorSeverity.HIGH,
  [ErrorType.AUTHORIZATION_ERROR]: ErrorSeverity.HIGH,
  [ErrorType.SESSION_EXPIRED]: ErrorSeverity.HIGH,
  [ErrorType.PERMISSION_DENIED]: ErrorSeverity.HIGH,
  [ErrorType.VALIDATION_ERROR]: ErrorSeverity.LOW,
  [ErrorType.FORM_ERROR]: ErrorSeverity.LOW,
  [ErrorType.SCHEMA_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.APPLICATION_ERROR]: ErrorSeverity.HIGH,
  [ErrorType.COMPONENT_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.RUNTIME_ERROR]: ErrorSeverity.HIGH,
  [ErrorType.CONFIGURATION_ERROR]: ErrorSeverity.CRITICAL,
  [ErrorType.DATABASE_ERROR]: ErrorSeverity.HIGH,
  [ErrorType.SERVICE_ERROR]: ErrorSeverity.HIGH,
  [ErrorType.TRANSACTION_ERROR]: ErrorSeverity.HIGH,
  [ErrorType.FILE_ERROR]: ErrorSeverity.LOW,
  [ErrorType.UPLOAD_ERROR]: ErrorSeverity.MEDIUM,
  [ErrorType.UNKNOWN_ERROR]: ErrorSeverity.MEDIUM,
};

const RECOVERY_STRATEGY_MAPPING: Record<ErrorType, RecoveryStrategy> = {
  [ErrorType.NETWORK_ERROR]: RecoveryStrategy.RETRY,
  [ErrorType.API_ERROR]: RecoveryStrategy.RETRY,
  [ErrorType.TIMEOUT_ERROR]: RecoveryStrategy.RETRY,
  [ErrorType.CONNECTION_ERROR]: RecoveryStrategy.RETRY,
  [ErrorType.AUTHENTICATION_ERROR]: RecoveryStrategy.REDIRECT,
  [ErrorType.AUTHORIZATION_ERROR]: RecoveryStrategy.REDIRECT,
  [ErrorType.SESSION_EXPIRED]: RecoveryStrategy.LOGOUT,
  [ErrorType.PERMISSION_DENIED]: RecoveryStrategy.MANUAL,
  [ErrorType.VALIDATION_ERROR]: RecoveryStrategy.MANUAL,
  [ErrorType.FORM_ERROR]: RecoveryStrategy.MANUAL,
  [ErrorType.SCHEMA_ERROR]: RecoveryStrategy.MANUAL,
  [ErrorType.APPLICATION_ERROR]: RecoveryStrategy.REFRESH,
  [ErrorType.COMPONENT_ERROR]: RecoveryStrategy.REFRESH,
  [ErrorType.RUNTIME_ERROR]: RecoveryStrategy.REFRESH,
  [ErrorType.CONFIGURATION_ERROR]: RecoveryStrategy.MANUAL,
  [ErrorType.DATABASE_ERROR]: RecoveryStrategy.RETRY,
  [ErrorType.SERVICE_ERROR]: RecoveryStrategy.RETRY,
  [ErrorType.TRANSACTION_ERROR]: RecoveryStrategy.RETRY,
  [ErrorType.FILE_ERROR]: RecoveryStrategy.MANUAL,
  [ErrorType.UPLOAD_ERROR]: RecoveryStrategy.RETRY,
  [ErrorType.UNKNOWN_ERROR]: RecoveryStrategy.MANUAL,
};

// User-friendly error messages
const USER_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection and try again.',
  [ErrorType.API_ERROR]: 'There was a problem processing your request. Please try again.',
  [ErrorType.TIMEOUT_ERROR]: 'The request took too long to complete. Please try again.',
  [ErrorType.CONNECTION_ERROR]: 'Connection to the server was lost. Please check your connection and try again.',
  [ErrorType.AUTHENTICATION_ERROR]: 'Authentication failed. Please check your credentials and try again.',
  [ErrorType.AUTHORIZATION_ERROR]: 'You do not have permission to access this resource.',
  [ErrorType.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorType.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
  [ErrorType.VALIDATION_ERROR]: 'Please check your input and correct any errors.',
  [ErrorType.FORM_ERROR]: 'There are errors in the form. Please review and correct them.',
  [ErrorType.SCHEMA_ERROR]: 'The data format is invalid. Please contact support if this persists.',
  [ErrorType.APPLICATION_ERROR]: 'An application error occurred. Please refresh the page and try again.',
  [ErrorType.COMPONENT_ERROR]: 'A component error occurred. Please refresh the page.',
  [ErrorType.RUNTIME_ERROR]: 'A runtime error occurred. Please refresh the page and try again.',
  [ErrorType.CONFIGURATION_ERROR]: 'A configuration error occurred. Please contact support.',
  [ErrorType.DATABASE_ERROR]: 'Database error occurred. Please try again or contact support.',
  [ErrorType.SERVICE_ERROR]: 'Service is temporarily unavailable. Please try again later.',
  [ErrorType.TRANSACTION_ERROR]: 'Transaction failed. Please try again.',
  [ErrorType.FILE_ERROR]: 'File operation failed. Please check the file and try again.',
  [ErrorType.UPLOAD_ERROR]: 'File upload failed. Please check the file size and format.',
  [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again or contact support.',
};

// ============================================================================
// Utility Functions
// ============================================================================

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getEnvironment(): 'development' | 'production' | 'test' {
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV as 'development' | 'production' | 'test' || 'development';
  }
  return 'development';
}

function classifyErrorFromResponse(statusCode: number, responseText?: string): ErrorType {
  // Check for specific error patterns in response
  if (responseText) {
    const lowerResponse = responseText.toLowerCase();
    if (lowerResponse.includes('timeout') || lowerResponse.includes('timed out')) {
      return ErrorType.TIMEOUT_ERROR;
    }
    if (lowerResponse.includes('network') || lowerResponse.includes('connection')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (lowerResponse.includes('authentication') || lowerResponse.includes('login')) {
      return ErrorType.AUTHENTICATION_ERROR;
    }
    if (lowerResponse.includes('permission') || lowerResponse.includes('forbidden')) {
      return ErrorType.AUTHORIZATION_ERROR;
    }
    if (lowerResponse.includes('validation') || lowerResponse.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR;
    }
  }

  // Fall back to status code mapping
  return ERROR_TYPE_MAPPING[statusCode] || ErrorType.API_ERROR;
}

function classifyErrorFromError(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('fetch') || name.includes('network')) {
    return ErrorType.NETWORK_ERROR;
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out') || name.includes('timeout')) {
    return ErrorType.TIMEOUT_ERROR;
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || name.includes('validation')) {
    return ErrorType.VALIDATION_ERROR;
  }

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('authentication') || message.includes('login')) {
    return ErrorType.AUTHENTICATION_ERROR;
  }

  // Authorization errors
  if (message.includes('forbidden') || message.includes('permission') || message.includes('access denied')) {
    return ErrorType.AUTHORIZATION_ERROR;
  }

  // Component errors
  if (name.includes('component') || message.includes('component')) {
    return ErrorType.COMPONENT_ERROR;
  }

  return ErrorType.UNKNOWN_ERROR;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Main Hook Implementation
// ============================================================================

export function useErrorHandler(initialConfig?: Partial<ErrorHandlerConfig>): ErrorHandlerHookReturn {
  // Configuration state
  const [config, setConfig] = useState<ErrorHandlerConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  }));

  // Error state
  const [errors, setErrors] = useState<AppError[]>([]);
  const [circuitBreakerState, setCircuitBreakerState] = useState<Record<string, CircuitBreakerState>>({});

  // Dependencies
  const logger = useLogger();
  const router = useRouter();

  // Refs for stable references
  const retryAttemptsRef = useRef<Record<string, number>>({});
  const pendingRetriesRef = useRef<Set<string>>(new Set());

  // Collect error context
  const collectErrorContext = useCallback((additionalContext?: Partial<ErrorContext>): ErrorContext => {
    const baseContext: ErrorContext = {
      userId: 'anonymous', // This would be populated from auth context
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...additionalContext,
    };

    return baseContext;
  }, []);

  // Create standardized error
  const createError = useCallback((
    type: ErrorType,
    message: string,
    options?: Partial<AppError>
  ): AppError => {
    const errorId = generateErrorId();
    const severity = SEVERITY_MAPPING[type] || ErrorSeverity.MEDIUM;
    const recoveryStrategy = RECOVERY_STRATEGY_MAPPING[type] || RecoveryStrategy.MANUAL;
    const userMessage = USER_MESSAGES[type] || message;

    const error: AppError = {
      name: 'AppError',
      message,
      type,
      severity,
      recoveryStrategy,
      errorId,
      timestamp: new Date().toISOString(),
      userMessage,
      technicalMessage: message,
      retryable: [
        ErrorType.NETWORK_ERROR,
        ErrorType.API_ERROR,
        ErrorType.TIMEOUT_ERROR,
        ErrorType.CONNECTION_ERROR,
        ErrorType.SERVICE_ERROR,
        ErrorType.DATABASE_ERROR,
        ErrorType.TRANSACTION_ERROR,
        ErrorType.UPLOAD_ERROR,
      ].includes(type),
      ...options,
    };

    // Attach stack trace in development
    if (config.enableStackTrace) {
      Error.captureStackTrace?.(error, createError);
    }

    return error;
  }, [config.enableStackTrace]);

  // Circuit breaker logic
  const checkCircuitBreaker = useCallback((key: string): boolean => {
    const state = circuitBreakerState[key];
    if (!state) return true; // Circuit is closed by default

    const now = Date.now();

    if (state.state === 'open') {
      if (now - state.lastFailureTime > config.circuitBreakerConfig.timeout) {
        // Transition to half-open
        setCircuitBreakerState(prev => ({
          ...prev,
          [key]: { ...state, state: 'half-open' },
        }));
        return true;
      }
      return false; // Circuit is still open
    }

    return true; // Circuit is closed or half-open
  }, [circuitBreakerState, config.circuitBreakerConfig.timeout]);

  const updateCircuitBreaker = useCallback((key: string, success: boolean) => {
    setCircuitBreakerState(prev => {
      const current = prev[key] || {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed' as const,
        threshold: config.circuitBreakerConfig.threshold,
        timeout: config.circuitBreakerConfig.timeout,
      };

      if (success) {
        // Reset on success
        return {
          ...prev,
          [key]: { ...current, failures: 0, state: 'closed' },
        };
      } else {
        // Increment failures
        const newFailures = current.failures + 1;
        const newState = newFailures >= current.threshold ? 'open' : current.state;
        
        return {
          ...prev,
          [key]: {
            ...current,
            failures: newFailures,
            lastFailureTime: Date.now(),
            state: newState,
          },
        };
      }
    });
  }, [config.circuitBreakerConfig.threshold, config.circuitBreakerConfig.timeout]);

  // Retry mechanism with exponential backoff
  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> => {
    const finalConfig = { ...config.defaultRetryConfig, ...retryConfig };
    const operationKey = operation.toString();
    
    // Check circuit breaker
    if (!checkCircuitBreaker(operationKey)) {
      throw createError(
        ErrorType.SERVICE_ERROR,
        'Service is temporarily unavailable due to repeated failures',
        { recoveryStrategy: RecoveryStrategy.MANUAL }
      );
    }

    let lastError: Error;
    let attempts = 0;

    while (attempts < finalConfig.maxAttempts) {
      try {
        const result = await operation();
        updateCircuitBreaker(operationKey, true);
        
        // Reset retry count on success
        delete retryAttemptsRef.current[operationKey];
        
        return result;
      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        // Check if error is retryable
        const appError = error as AppError;
        const isRetryable = appError.retryable !== false && (
          finalConfig.retryableErrorTypes.includes(appError.type) ||
          (appError.statusCode && finalConfig.retryableErrorCodes.includes(appError.statusCode))
        );

        if (!isRetryable || attempts >= finalConfig.maxAttempts) {
          updateCircuitBreaker(operationKey, false);
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempts - 1),
          finalConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        await sleep(jitteredDelay);
      }
    }

    updateCircuitBreaker(operationKey, false);
    retryAttemptsRef.current[operationKey] = attempts;
    
    throw lastError!;
  }, [config.defaultRetryConfig, checkCircuitBreaker, updateCircuitBreaker, createError]);

  // Main error handling function
  const handleError = useCallback(async (
    error: Error | AppError,
    context?: Partial<ErrorContext>
  ): Promise<void> => {
    try {
      // Convert to AppError if needed
      let appError: AppError;
      
      if ('type' in error && error.type) {
        appError = error as AppError;
      } else {
        // Classify the error
        const errorType = classifyErrorFromError(error);
        appError = createError(errorType, error.message, {
          originalError: error,
          context: collectErrorContext(context),
        });
      }

      // Enhance context
      appError.context = { ...appError.context, ...collectErrorContext(context) };

      // Log the error
      logger.error(
        `[${appError.type}] ${appError.message}`,
        appError.originalError || appError,
        {
          component: appError.context?.component,
          category: 'error_handler',
          action: 'handle_error',
          ...appError.context,
        }
      );

      // Store error in state
      setErrors(prev => [...prev, appError]);

      // Auto-recovery if enabled
      if (config.autoRecovery && appError.recoveryStrategy !== RecoveryStrategy.MANUAL) {
        await executeRecovery(appError, appError.recoveryStrategy);
      }

    } catch (handlingError) {
      // Prevent infinite error loops
      console.error('Error in error handler:', handlingError);
      logger.error('Error handler failed', handlingError as Error, {
        category: 'error_handler',
        action: 'handle_error_failure',
      });
    }
  }, [createError, collectErrorContext, logger, config.autoRecovery]);

  // Error boundary integration
  const captureErrorBoundary = useCallback((error: Error, errorInfo: ErrorBoundaryInfo) => {
    const appError = createError(
      ErrorType.COMPONENT_ERROR,
      error.message,
      {
        originalError: error,
        context: {
          ...collectErrorContext(),
          component: errorInfo.errorBoundary,
          metadata: {
            componentStack: errorInfo.componentStack,
            errorInfo,
          },
        },
      }
    );

    handleError(appError);
  }, [createError, collectErrorContext, handleError]);

  // Recovery option generation
  const getRecoveryOptions = useCallback((error: AppError): RecoveryOptions => {
    const options: RecoveryOptions = {};

    switch (error.recoveryStrategy) {
      case RecoveryStrategy.RETRY:
        if (error.retryable) {
          options.retry = async () => {
            // This would be implemented by the calling component
            throw new Error('Retry function must be provided by the caller');
          };
          options.userGuidance = 'Click "Retry" to attempt the operation again.';
        }
        break;

      case RecoveryStrategy.REDIRECT:
        if (error.type === ErrorType.AUTHENTICATION_ERROR) {
          options.redirect = '/login';
          options.userGuidance = 'You will be redirected to the login page.';
        } else if (error.type === ErrorType.AUTHORIZATION_ERROR) {
          options.redirect = '/';
          options.userGuidance = 'You will be redirected to the home page.';
        }
        break;

      case RecoveryStrategy.REFRESH:
        options.refresh = true;
        options.userGuidance = 'The page will be refreshed to resolve the issue.';
        break;

      case RecoveryStrategy.LOGOUT:
        options.logout = true;
        options.userGuidance = 'You will be logged out and redirected to the login page.';
        break;

      case RecoveryStrategy.MANUAL:
        options.userGuidance = 'Please review the error and take appropriate action.';
        break;
    }

    return options;
  }, []);

  // Execute recovery strategy
  const executeRecovery = useCallback(async (
    error: AppError,
    strategy?: RecoveryStrategy
  ): Promise<void> => {
    const recoveryStrategy = strategy || error.recoveryStrategy;
    const options = getRecoveryOptions(error);

    try {
      switch (recoveryStrategy) {
        case RecoveryStrategy.REDIRECT:
          if (options.redirect) {
            router.push(options.redirect);
          }
          break;

        case RecoveryStrategy.REFRESH:
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
          break;

        case RecoveryStrategy.LOGOUT:
          // This would integrate with your auth system
          router.push('/login');
          break;

        case RecoveryStrategy.RETRY:
          if (options.retry) {
            await options.retry();
          }
          break;

        default:
          // Manual recovery - no automatic action
          break;
      }
    } catch (recoveryError) {
      logger.error('Recovery failed', recoveryError as Error, {
        category: 'error_handler',
        action: 'execute_recovery',
        originalError: error.errorId,
      });
    }
  }, [getRecoveryOptions, router, logger]);

  // Error classification utilities
  const isRetryableError = useCallback((error: Error | AppError): boolean => {
    if ('retryable' in error) {
      return error.retryable !== false;
    }

    const errorType = classifyErrorFromError(error);
    return config.defaultRetryConfig.retryableErrorTypes.includes(errorType);
  }, [config.defaultRetryConfig.retryableErrorTypes]);

  const getErrorSeverity = useCallback((error: Error | AppError): ErrorSeverity => {
    if ('severity' in error && error.severity) {
      return error.severity;
    }

    const errorType = classifyErrorFromError(error);
    return SEVERITY_MAPPING[errorType] || ErrorSeverity.MEDIUM;
  }, []);

  const formatUserMessage = useCallback((error: AppError): string => {
    if (config.userFriendlyMessages && error.userMessage) {
      return error.userMessage;
    }
    return error.message;
  }, [config.userFriendlyMessages]);

  // Error state management
  const clearError = useCallback((errorId?: string) => {
    setErrors(prev => errorId ? prev.filter(err => err.errorId !== errorId) : []);
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Circuit breaker management
  const resetCircuitBreaker = useCallback((key: string) => {
    setCircuitBreakerState(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  // Configuration updates
  const updateConfig = useCallback((newConfig: Partial<ErrorHandlerConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Error boundary fallback component
  const getErrorBoundaryFallback = useCallback((error: AppError) => {
    // This would return a React component for error boundary fallback
    // Implementation would depend on your UI component library
    return null;
  }, []);

  // Computed values
  const activeErrors = useMemo(() => {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    return errors.filter(error => {
      const errorTime = new Date(error.timestamp || 0).getTime();
      return now - errorTime < maxAge;
    });
  }, [errors]);

  const lastError = useMemo(() => {
    return errors.length > 0 ? errors[errors.length - 1] : null;
  }, [errors]);

  // Cleanup old errors periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutes
      
      setErrors(prev => prev.filter(error => {
        const errorTime = new Date(error.timestamp || 0).getTime();
        return now - errorTime < maxAge;
      }));
    }, 60 * 1000); // Every minute

    return () => clearInterval(cleanup);
  }, []);

  return useMemo(() => ({
    // Error Handling Methods
    handleError,
    createError,
    
    // Recovery Methods
    retry,
    clearError,
    clearAllErrors,
    
    // Error Boundary Integration
    captureErrorBoundary,
    getErrorBoundaryFallback,
    
    // Error State
    errors,
    activeErrors,
    lastError,
    
    // Configuration
    updateConfig,
    config,
    
    // Recovery Options
    getRecoveryOptions,
    executeRecovery,
    
    // Circuit Breaker
    circuitBreakerState,
    resetCircuitBreaker,
    
    // Utilities
    isRetryableError,
    getErrorSeverity,
    formatUserMessage,
  }), [
    handleError, createError, retry, clearError, clearAllErrors,
    captureErrorBoundary, getErrorBoundaryFallback,
    errors, activeErrors, lastError,
    updateConfig, config,
    getRecoveryOptions, executeRecovery,
    circuitBreakerState, resetCircuitBreaker,
    isRetryableError, getErrorSeverity, formatUserMessage,
  ]);
}

/**
 * Higher-order component for automatic error boundary integration
 */
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  componentName?: string
): React.ComponentType<T> {
  return function ErrorBoundaryWrapper(props: T) {
    const errorHandler = useErrorHandler();
    
    useEffect(() => {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        const error = errorHandler.createError(
          ErrorType.RUNTIME_ERROR,
          `Unhandled promise rejection: ${event.reason}`,
          {
            context: {
              component: componentName || Component.name,
              action: 'promise_rejection',
            },
          }
        );
        errorHandler.handleError(error);
      };

      const handleError = (event: ErrorEvent) => {
        const error = errorHandler.createError(
          ErrorType.RUNTIME_ERROR,
          event.message,
          {
            originalError: event.error,
            context: {
              component: componentName || Component.name,
              action: 'uncaught_error',
              metadata: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
              },
            },
          }
        );
        errorHandler.handleError(error);
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', handleError);

      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleError);
      };
    }, [errorHandler]);

    return <Component {...props} />;
  };
}

/**
 * React Error Boundary class component for catching React errors
 */
export class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError?: (error: AppError) => void;
    fallback?: React.ComponentType<{ error: AppError; retry: () => void }>;
    componentName?: string;
  },
  { hasError: boolean; error: AppError | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorHandler = new (class {
      createError(type: ErrorType, message: string, options?: Partial<AppError>): AppError {
        return {
          name: 'AppError',
          message,
          type,
          severity: SEVERITY_MAPPING[type] || ErrorSeverity.MEDIUM,
          recoveryStrategy: RECOVERY_STRATEGY_MAPPING[type] || RecoveryStrategy.MANUAL,
          errorId: generateErrorId(),
          timestamp: new Date().toISOString(),
          userMessage: USER_MESSAGES[type] || message,
          technicalMessage: message,
          retryable: false,
          ...options,
        };
      }
    })();

    const appError = errorHandler.createError(
      ErrorType.COMPONENT_ERROR,
      error.message,
      {
        originalError: error,
        context: {
          component: this.props.componentName || 'ErrorBoundary',
          metadata: {
            componentStack: errorInfo.componentStack,
            errorInfo,
          },
        },
      }
    );

    this.setState({ error: appError });
    this.props.onError?.(appError);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            retry={() => this.setState({ hasError: false, error: null })}
          />
        );
      }

      return (
        <div className="error-boundary p-4 border border-red-300 rounded-lg bg-red-50">
          <h2 className="text-red-800 font-semibold mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{this.state.error.userMessage}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default useErrorHandler;