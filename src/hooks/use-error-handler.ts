/**
 * Comprehensive error handling utility hook for DreamFactory Admin Interface
 * 
 * This hook provides enterprise-grade error handling capabilities including:
 * - Error type classification and specific handling for different application scenarios
 * - Error boundary integration with proper error recovery and fallback UI components
 * - Retry mechanisms with exponential backoff for transient network and API errors
 * - Error context collection including user actions, application state, and environment data
 * - User-friendly error message generation with internationalization and accessibility
 * - Error recovery workflows with both automatic recovery and user-initiated retry options
 * - Circuit breaker patterns to prevent cascade failures
 * - Integration with logging, monitoring, and state management systems
 * 
 * Replaces Angular error handling patterns with React 19/Next.js 15.1 implementations
 * using React Query, SWR, Zustand, and comprehensive error boundary strategies.
 * 
 * @fileoverview Comprehensive error handling utilities for React application
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLogger } from '@/hooks/use-logger';
import {
  ErrorType,
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
  ErrorRecoveryOptions,
  ErrorHandlerConfig,
  RetryConfig,
  CircuitBreakerState,
  ErrorBoundaryInfo,
  UserFriendlyErrorMessage,
  ErrorReportingOptions,
  RecoveryAction,
  ErrorMetrics,
  UseErrorHandlerReturn,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  ClientError,
  SystemError,
  AppError,
  ErrorHandlerEvent,
  ErrorHandlerEventListener,
  ErrorContextCollector,
  ErrorMessageGenerator,
  RetryAttempt,
  CircuitBreakerConfig,
} from '@/types/error';
import {
  ApiErrorResponse,
  HttpStatusCode,
} from '@/types/api';
import {
  LogLevel,
  LogCategory,
} from '@/types/logging';

/**
 * Default configuration for error handling behavior
 */
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  // Retry configuration with exponential backoff
  retry: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffFactor: 2,
    jitter: true,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableNetworkErrors: ['NETWORK_ERROR', 'TIMEOUT', 'CONNECTION_REFUSED'],
  },
  
  // Circuit breaker configuration
  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 60000, // 1 minute
    halfOpenMaxAttempts: 3,
  },
  
  // Error reporting and monitoring
  reporting: {
    enabled: true,
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    includeStackTrace: process.env.NODE_ENV === 'development',
    includeUserContext: true,
    includeAppContext: true,
    excludeFields: ['password', 'token', 'secret', 'key'],
  },
  
  // User experience configuration
  userExperience: {
    showRetryButton: true,
    autoRetryTransientErrors: true,
    showErrorDetails: process.env.NODE_ENV === 'development',
    notificationDuration: 5000, // 5 seconds
    enableAccessibility: true,
    supportI18n: true,
  },
  
  // Performance and monitoring
  performance: {
    trackErrorMetrics: true,
    correlationIdEnabled: true,
    responseTimeThresholds: {
      warn: 5000, // 5 seconds
      error: 15000, // 15 seconds
    },
  },
};

/**
 * Circuit breaker implementation for preventing cascade failures
 */
class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private nextAttemptTime = 0;
  private halfOpenAttempts = 0;
  
  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitBreakerState.HALF_OPEN;
      this.halfOpenAttempts = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.CLOSED;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.openCircuit();
      }
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.openCircuit();
    }
  }

  /**
   * Open the circuit breaker
   */
  private openCircuit(): void {
    this.state = CircuitBreakerState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.nextAttemptTime = 0;
    this.halfOpenAttempts = 0;
  }
}

/**
 * Retry mechanism with exponential backoff and jitter
 */
class RetryManager {
  constructor(private config: RetryConfig) {}

  /**
   * Execute operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    errorHandler: (error: any, attempt: number) => boolean
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error) || !errorHandler(error, attempt)) {
          throw error;
        }
        
        // If this was the last attempt, throw the error
        if (attempt === this.config.maxAttempts) {
          throw error;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error is retryable based on configuration
   */
  private isRetryableError(error: any): boolean {
    // Check HTTP status codes
    if (error?.status && this.config.retryableStatusCodes.includes(error.status)) {
      return true;
    }
    
    // Check network error types
    if (error?.code && this.config.retryableNetworkErrors.includes(error.code)) {
      return true;
    }
    
    // Check for timeout errors
    if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.initialDelay * Math.pow(this.config.backoffFactor, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);
    
    if (this.config.jitter) {
      // Add random jitter of ±25%
      const jitterRange = cappedDelay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      return Math.max(0, cappedDelay + jitter);
    }
    
    return cappedDelay;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Error classifier that categorizes errors by type and severity
 */
class ErrorClassifier {
  /**
   * Classify error and return detailed error information
   */
  classify(error: any): AppError {
    // Network errors
    if (this.isNetworkError(error)) {
      return this.createNetworkError(error);
    }
    
    // API validation errors
    if (this.isValidationError(error)) {
      return this.createValidationError(error);
    }
    
    // Authentication errors
    if (this.isAuthenticationError(error)) {
      return this.createAuthenticationError(error);
    }
    
    // Authorization errors
    if (this.isAuthorizationError(error)) {
      return this.createAuthorizationError(error);
    }
    
    // Server errors
    if (this.isServerError(error)) {
      return this.createServerError(error);
    }
    
    // Client errors
    if (this.isClientError(error)) {
      return this.createClientError(error);
    }
    
    // System errors (catchall)
    return this.createSystemError(error);
  }

  private isNetworkError(error: any): boolean {
    return (
      error?.name === 'NetworkError' ||
      error?.code === 'NETWORK_ERROR' ||
      error?.message?.includes('fetch') ||
      !navigator.onLine
    );
  }

  private isValidationError(error: any): boolean {
    return (
      error?.status === 400 ||
      error?.status === 422 ||
      error?.name === 'ValidationError' ||
      error?.error?.code === 'VALIDATION_ERROR'
    );
  }

  private isAuthenticationError(error: any): boolean {
    return (
      error?.status === 401 ||
      error?.error?.code === 'AUTHENTICATION_ERROR' ||
      error?.message?.includes('unauthorized')
    );
  }

  private isAuthorizationError(error: any): boolean {
    return (
      error?.status === 403 ||
      error?.error?.code === 'AUTHORIZATION_ERROR' ||
      error?.message?.includes('forbidden')
    );
  }

  private isServerError(error: any): boolean {
    return error?.status >= 500 && error?.status < 600;
  }

  private isClientError(error: any): boolean {
    return error?.status >= 400 && error?.status < 500;
  }

  private createNetworkError(error: any): NetworkError {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.INFRASTRUCTURE,
      code: error?.code || 'NETWORK_ERROR',
      message: error?.message || 'Network connection failed',
      originalError: error,
      isRetryable: true,
      timestamp: new Date().toISOString(),
      userFacing: true,
    };
  }

  private createValidationError(error: any): ValidationError {
    return {
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.USER_INPUT,
      code: error?.error?.code || 'VALIDATION_ERROR',
      message: error?.error?.message || 'Input validation failed',
      originalError: error,
      fieldErrors: error?.error?.context?.errors || {},
      isRetryable: false,
      timestamp: new Date().toISOString(),
      userFacing: true,
    };
  }

  private createAuthenticationError(error: any): AuthenticationError {
    return {
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SECURITY,
      code: error?.error?.code || 'AUTHENTICATION_ERROR',
      message: error?.error?.message || 'Authentication failed',
      originalError: error,
      isRetryable: false,
      requiresLogin: true,
      timestamp: new Date().toISOString(),
      userFacing: true,
    };
  }

  private createAuthorizationError(error: any): AuthorizationError {
    return {
      type: ErrorType.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.SECURITY,
      code: error?.error?.code || 'AUTHORIZATION_ERROR',
      message: error?.error?.message || 'Access denied',
      originalError: error,
      isRetryable: false,
      requiredPermissions: error?.error?.context?.permissions || [],
      timestamp: new Date().toISOString(),
      userFacing: true,
    };
  }

  private createServerError(error: any): ServerError {
    return {
      type: ErrorType.SERVER,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.INFRASTRUCTURE,
      code: error?.error?.code || 'SERVER_ERROR',
      message: error?.error?.message || 'Server error occurred',
      originalError: error,
      statusCode: error?.status || 500,
      isRetryable: error?.status !== 501, // Not implemented is not retryable
      timestamp: new Date().toISOString(),
      userFacing: true,
    };
  }

  private createClientError(error: any): ClientError {
    return {
      type: ErrorType.CLIENT,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.APPLICATION,
      code: error?.error?.code || 'CLIENT_ERROR',
      message: error?.error?.message || 'Client error occurred',
      originalError: error,
      statusCode: error?.status || 400,
      isRetryable: false,
      timestamp: new Date().toISOString(),
      userFacing: true,
    };
  }

  private createSystemError(error: any): SystemError {
    return {
      type: ErrorType.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.APPLICATION,
      code: error?.code || 'SYSTEM_ERROR',
      message: error?.message || 'An unexpected error occurred',
      originalError: error,
      stackTrace: error?.stack,
      isRetryable: false,
      timestamp: new Date().toISOString(),
      userFacing: true,
    };
  }
}

/**
 * Context collector that gathers relevant application and user context
 */
class ContextCollector {
  /**
   * Collect comprehensive error context
   */
  collect(config: ErrorHandlerConfig): ErrorContext {
    return {
      user: this.collectUserContext(config),
      application: this.collectApplicationContext(config),
      environment: this.collectEnvironmentContext(),
      session: this.collectSessionContext(),
      performance: this.collectPerformanceContext(),
    };
  }

  private collectUserContext(config: ErrorHandlerConfig): ErrorContext['user'] {
    if (!config.reporting.includeUserContext) {
      return undefined;
    }

    try {
      // Get user context from localStorage or session
      const userStr = localStorage.getItem('df-user-context');
      const user = userStr ? JSON.parse(userStr) : null;
      
      return user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        lastAction: user.lastAction,
        sessionStart: user.sessionStart,
      } : undefined;
    } catch {
      return undefined;
    }
  }

  private collectApplicationContext(config: ErrorHandlerConfig): ErrorContext['application'] {
    if (!config.reporting.includeAppContext) {
      return undefined;
    }

    return {
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      component: this.getCurrentComponent(),
      feature: this.getCurrentFeature(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
      timestamp: new Date().toISOString(),
    };
  }

  private collectEnvironmentContext(): ErrorContext['environment'] {
    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight,
      } : undefined,
      online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
      language: typeof navigator !== 'undefined' ? navigator.language : undefined,
    };
  }

  private collectSessionContext(): ErrorContext['session'] {
    try {
      const sessionStr = localStorage.getItem('df-session-context');
      return sessionStr ? JSON.parse(sessionStr) : undefined;
    } catch {
      return undefined;
    }
  }

  private collectPerformanceContext(): ErrorContext['performance'] {
    if (typeof performance === 'undefined') {
      return undefined;
    }

    return {
      navigationStart: performance.timeOrigin,
      loadTime: performance.now(),
      memory: (performance as any).memory ? {
        usedJSMemorySize: (performance as any).memory.usedJSMemorySize,
        totalJSMemorySize: (performance as any).memory.totalJSMemorySize,
      } : undefined,
    };
  }

  private getCurrentComponent(): string {
    // Extract component name from current route or stack trace
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const segments = pathname.split('/').filter(Boolean);
      return segments.length > 0 ? segments[segments.length - 1] : 'unknown';
    }
    return 'unknown';
  }

  private getCurrentFeature(): string {
    // Extract feature name from current route
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.includes('/api-connections')) return 'database-services';
      if (pathname.includes('/adf-schema')) return 'schema-discovery';
      if (pathname.includes('/adf-services')) return 'service-management';
      if (pathname.includes('/adf-users')) return 'user-management';
      if (pathname.includes('/adf-apps')) return 'app-management';
      if (pathname.includes('/adf-config')) return 'system-config';
    }
    return 'unknown';
  }
}

/**
 * Message generator for user-friendly error messages with i18n support
 */
class MessageGenerator {
  /**
   * Generate user-friendly error message
   */
  generate(error: AppError, config: ErrorHandlerConfig): UserFriendlyErrorMessage {
    const baseMessage = this.getBaseMessage(error);
    const actionableMessage = this.getActionableMessage(error);
    const recoveryOptions = this.getRecoveryOptions(error, config);

    return {
      title: this.getErrorTitle(error),
      message: baseMessage,
      actionableMessage,
      recoveryOptions,
      technicalDetails: config.userExperience.showErrorDetails ? {
        code: error.code,
        timestamp: error.timestamp,
        correlationId: error.correlationId,
      } : undefined,
      accessibility: config.userExperience.enableAccessibility ? {
        ariaLabel: `Error: ${baseMessage}`,
        role: 'alert',
        screenReaderText: `${this.getErrorTitle(error)}: ${baseMessage}. ${actionableMessage}`,
      } : undefined,
    };
  }

  private getErrorTitle(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Connection Problem';
      case ErrorType.VALIDATION:
        return 'Input Error';
      case ErrorType.AUTHENTICATION:
        return 'Authentication Required';
      case ErrorType.AUTHORIZATION:
        return 'Access Denied';
      case ErrorType.SERVER:
        return 'Server Error';
      case ErrorType.CLIENT:
        return 'Request Error';
      case ErrorType.SYSTEM:
        return 'System Error';
      default:
        return 'Error';
    }
  }

  private getBaseMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Unable to connect to the server. Please check your internet connection.';
      case ErrorType.VALIDATION:
        return 'Please check your input and correct any errors highlighted below.';
      case ErrorType.AUTHENTICATION:
        return 'Your session has expired. Please log in again to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorType.SERVER:
        return 'The server encountered an error. Our team has been notified.';
      case ErrorType.CLIENT:
        return 'There was a problem with your request. Please try again.';
      case ErrorType.SYSTEM:
        return 'An unexpected error occurred. Please try again or contact support.';
      default:
        return error.message || 'An error occurred.';
    }
  }

  private getActionableMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Please check your internet connection and try again.';
      case ErrorType.VALIDATION:
        return 'Please correct the highlighted fields and submit again.';
      case ErrorType.AUTHENTICATION:
        return 'Click "Login" to sign in with your credentials.';
      case ErrorType.AUTHORIZATION:
        return 'Contact your administrator if you believe you should have access.';
      case ErrorType.SERVER:
        return 'Please try again in a few moments. If the problem persists, contact support.';
      case ErrorType.CLIENT:
        return 'Please review your request and try again.';
      case ErrorType.SYSTEM:
        return 'Please refresh the page or try again later.';
      default:
        return 'Please try again or contact support if the problem continues.';
    }
  }

  private getRecoveryOptions(error: AppError, config: ErrorHandlerConfig): RecoveryAction[] {
    const options: RecoveryAction[] = [];

    // Add retry option for retryable errors
    if (error.isRetryable && config.userExperience.showRetryButton) {
      options.push({
        type: 'retry',
        label: 'Try Again',
        primary: true,
        accessibility: {
          ariaLabel: 'Retry the failed operation',
          keyboardShortcut: 'Enter',
        },
      });
    }

    // Add refresh option for system errors
    if (error.type === ErrorType.SYSTEM) {
      options.push({
        type: 'refresh',
        label: 'Refresh Page',
        primary: false,
        accessibility: {
          ariaLabel: 'Refresh the current page',
          keyboardShortcut: 'F5',
        },
      });
    }

    // Add login option for authentication errors
    if (error.type === ErrorType.AUTHENTICATION) {
      options.push({
        type: 'login',
        label: 'Login',
        primary: true,
        accessibility: {
          ariaLabel: 'Go to login page',
        },
      });
    }

    // Add contact support option for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      options.push({
        type: 'contact',
        label: 'Contact Support',
        primary: false,
        accessibility: {
          ariaLabel: 'Contact technical support',
        },
      });
    }

    // Add dismiss option
    options.push({
      type: 'dismiss',
      label: 'Dismiss',
      primary: false,
      accessibility: {
        ariaLabel: 'Dismiss this error message',
        keyboardShortcut: 'Escape',
      },
    });

    return options;
  }
}

/**
 * Main error handler hook implementation
 */
export function useErrorHandler(userConfig?: Partial<ErrorHandlerConfig>): UseErrorHandlerReturn {
  // Merge user configuration with defaults
  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...userConfig,
  }), [userConfig]);

  // Internal state
  const [activeErrors, setActiveErrors] = useState<Map<string, AppError>>(new Map());
  const [metrics, setMetrics] = useState<ErrorMetrics>({
    totalErrors: 0,
    errorsByType: {},
    errorsByCategory: {},
    retryAttempts: 0,
    recoveredErrors: 0,
  });

  // Services and utilities
  const router = useRouter();
  const logger = useLogger();
  const classifierRef = useRef(new ErrorClassifier());
  const contextCollectorRef = useRef(new ContextCollector());
  const messageGeneratorRef = useRef(new MessageGenerator());
  const retryManagerRef = useRef(new RetryManager(config.retry));
  const circuitBreakerRef = useRef(new CircuitBreaker(config.circuitBreaker));
  
  // Event listeners
  const listenersRef = useRef<Set<ErrorHandlerEventListener>>(new Set());

  /**
   * Handle any error with comprehensive processing
   */
  const handleError = useCallback(async (
    error: any,
    options?: Partial<ErrorRecoveryOptions>
  ): Promise<UserFriendlyErrorMessage> => {
    // Classify the error
    const classifiedError = classifierRef.current.classify(error);
    
    // Collect context
    const context = contextCollectorRef.current.collect(config);
    
    // Generate correlation ID if enabled
    if (config.performance.correlationIdEnabled) {
      classifiedError.correlationId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Add context to error
    classifiedError.context = context;
    
    // Generate user-friendly message
    const userMessage = messageGeneratorRef.current.generate(classifiedError, config);
    
    // Log the error
    await logError(classifiedError, context);
    
    // Update metrics
    updateMetrics(classifiedError);
    
    // Add to active errors if user-facing
    if (classifiedError.userFacing) {
      setActiveErrors(prev => new Map(prev.set(classifiedError.correlationId || `error-${Date.now()}`, classifiedError)));
    }
    
    // Notify listeners
    notifyListeners({
      type: 'error',
      error: classifiedError,
      userMessage,
      timestamp: new Date().toISOString(),
    });
    
    // Handle special error types
    await handleSpecialErrorTypes(classifiedError, options);
    
    return userMessage;
  }, [config, logger, router]);

  /**
   * Retry an operation with circuit breaker and exponential backoff
   */
  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: Partial<RetryConfig>
  ): Promise<T> => {
    const retryConfig = { ...config.retry, ...options };
    const retryManager = new RetryManager(retryConfig);
    
    return retryManagerRef.current.execute(
      async () => {
        return await circuitBreakerRef.current.execute(operation);
      },
      (error, attempt) => {
        // Update retry metrics
        setMetrics(prev => ({
          ...prev,
          retryAttempts: prev.retryAttempts + 1,
        }));
        
        // Log retry attempt
        logger.info(`Retry attempt ${attempt} for operation`, {
          error: error.message,
          attempt,
          maxAttempts: retryConfig.maxAttempts,
        });
        
        return true; // Continue retrying
      }
    );
  }, [config, logger]);

  /**
   * Create error boundary handler
   */
  const createErrorBoundary = useCallback((
    fallbackComponent?: React.ComponentType<ErrorBoundaryInfo>
  ) => {
    return class ErrorBoundary extends React.Component<
      React.PropsWithChildren<{}>,
      { hasError: boolean; error?: AppError; errorInfo?: React.ErrorInfo }
    > {
      constructor(props: React.PropsWithChildren<{}>) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error: Error): { hasError: boolean; error: AppError } {
        const classifiedError = classifierRef.current.classify(error);
        return { hasError: true, error: classifiedError };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo });
        handleError(error, { component: 'ErrorBoundary' });
      }

      render() {
        if (this.state.hasError && this.state.error) {
          const boundaryInfo: ErrorBoundaryInfo = {
            error: this.state.error,
            errorInfo: this.state.errorInfo,
            retry: () => this.setState({ hasError: false, error: undefined, errorInfo: undefined }),
          };

          if (fallbackComponent) {
            return React.createElement(fallbackComponent, boundaryInfo);
          }

          // Default fallback UI
          return React.createElement('div', {
            className: 'error-boundary p-6 border border-red-300 bg-red-50 rounded-lg',
            role: 'alert',
          }, [
            React.createElement('h2', {
              key: 'title',
              className: 'text-lg font-semibold text-red-800 mb-2',
            }, 'Something went wrong'),
            React.createElement('p', {
              key: 'message',
              className: 'text-red-700 mb-4',
            }, this.state.error.message),
            React.createElement('button', {
              key: 'retry',
              className: 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700',
              onClick: boundaryInfo.retry,
            }, 'Try Again'),
          ]);
        }

        return this.props.children;
      }
    };
  }, [handleError]);

  /**
   * Recover from a specific error
   */
  const recoverFromError = useCallback(async (
    errorId: string,
    action: RecoveryAction
  ): Promise<boolean> => {
    const error = activeErrors.get(errorId);
    if (!error) {
      return false;
    }

    try {
      switch (action.type) {
        case 'retry':
          // Remove error from active list and trigger retry
          setActiveErrors(prev => {
            const newMap = new Map(prev);
            newMap.delete(errorId);
            return newMap;
          });
          return true;

        case 'refresh':
          window.location.reload();
          return true;

        case 'login':
          router.push('/login');
          return true;

        case 'dismiss':
          setActiveErrors(prev => {
            const newMap = new Map(prev);
            newMap.delete(errorId);
            return newMap;
          });
          return true;

        case 'contact':
          // Open support contact
          window.open('mailto:support@dreamfactory.com', '_blank');
          return true;

        default:
          return false;
      }
    } catch (error) {
      logger.error('Error during recovery action', error);
      return false;
    }
  }, [activeErrors, router, logger]);

  /**
   * Clear all active errors
   */
  const clearErrors = useCallback((): void => {
    setActiveErrors(new Map());
  }, []);

  /**
   * Get error metrics
   */
  const getMetrics = useCallback((): ErrorMetrics => {
    return metrics;
  }, [metrics]);

  /**
   * Add event listener
   */
  const addEventListener = useCallback((listener: ErrorHandlerEventListener): () => void => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  /**
   * Reset circuit breaker
   */
  const resetCircuitBreaker = useCallback((): void => {
    circuitBreakerRef.current.reset();
  }, []);

  /**
   * Get circuit breaker state
   */
  const getCircuitBreakerState = useCallback((): CircuitBreakerState => {
    return circuitBreakerRef.current.getState();
  }, []);

  // Helper functions

  /**
   * Log error with comprehensive context
   */
  const logError = useCallback(async (error: AppError, context: ErrorContext): Promise<void> => {
    const logLevel = error.severity === ErrorSeverity.CRITICAL ? LogLevel.FATAL :
                    error.severity === ErrorSeverity.HIGH ? LogLevel.ERROR :
                    LogLevel.WARN;

    logger.error(
      `${error.type} Error: ${error.message}`,
      error.originalError,
      {
        error: {
          type: error.type,
          severity: error.severity,
          category: error.category,
          code: error.code,
          correlationId: error.correlationId,
          isRetryable: error.isRetryable,
        },
        context,
      },
      {
        category: LogCategory.ERROR,
        tags: [error.type, error.category],
        correlation: error.correlationId ? {
          correlationId: error.correlationId,
        } : undefined,
      }
    );
  }, [logger]);

  /**
   * Update error metrics
   */
  const updateMetrics = useCallback((error: AppError): void => {
    setMetrics(prev => ({
      totalErrors: prev.totalErrors + 1,
      errorsByType: {
        ...prev.errorsByType,
        [error.type]: (prev.errorsByType[error.type] || 0) + 1,
      },
      errorsByCategory: {
        ...prev.errorsByCategory,
        [error.category]: (prev.errorsByCategory[error.category] || 0) + 1,
      },
      retryAttempts: prev.retryAttempts,
      recoveredErrors: prev.recoveredErrors,
    }));
  }, []);

  /**
   * Notify event listeners
   */
  const notifyListeners = useCallback((event: ErrorHandlerEvent): void => {
    listenersRef.current.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('Error handler event listener failed:', error);
      }
    });
  }, []);

  /**
   * Handle special error types with specific workflows
   */
  const handleSpecialErrorTypes = useCallback(async (
    error: AppError,
    options?: Partial<ErrorRecoveryOptions>
  ): Promise<void> => {
    switch (error.type) {
      case ErrorType.AUTHENTICATION:
        // Clear user session and redirect to login
        localStorage.removeItem('df-session-token');
        localStorage.removeItem('df-user-context');
        if (!options?.preventRedirect) {
          router.push('/login');
        }
        break;

      case ErrorType.AUTHORIZATION:
        // Log authorization attempt for security monitoring
        logger.warn('Authorization denied', {
          user: error.context?.user?.id,
          route: error.context?.application?.route,
          requiredPermissions: (error as AuthorizationError).requiredPermissions,
        });
        break;

      case ErrorType.NETWORK:
        // Check if offline and update UI accordingly
        if (!navigator.onLine) {
          // Handle offline mode
          console.warn('Application is offline');
        }
        break;

      case ErrorType.SERVER:
        // Report critical server errors to monitoring
        if (error.severity === ErrorSeverity.CRITICAL) {
          // Would integrate with external monitoring service
          console.error('Critical server error reported', error);
        }
        break;
    }
  }, [router, logger]);

  // Return hook interface
  return {
    // Core error handling
    handleError,
    retryWithBackoff,
    createErrorBoundary,
    
    // Error recovery
    recoverFromError,
    clearErrors,
    
    // State and metrics
    activeErrors: Array.from(activeErrors.values()),
    getMetrics,
    
    // Circuit breaker
    resetCircuitBreaker,
    getCircuitBreakerState,
    
    // Event handling
    addEventListener,
  };
}

export default useErrorHandler;