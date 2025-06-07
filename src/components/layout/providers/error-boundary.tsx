/**
 * React Error Boundary Component for DreamFactory Admin Interface
 * 
 * Comprehensive error boundary implementation that replaces Angular DfErrorService
 * with React error handling patterns. Provides error catching, reporting, recovery
 * mechanisms, and accessible fallback UI rendering for component tree errors.
 * 
 * Key Features:
 * - React Error Boundary class component for catching component tree errors
 * - Error reporting integration with stack trace capture and user context
 * - Retry mechanisms with exponential backoff strategies for recoverable errors
 * - Accessible error UI with clear messaging and recovery action buttons
 * - Error state clearing on navigation matching Angular error service behavior
 * - Integration with Next.js middleware authentication flow
 * - Support for MSW mock error scenarios during development
 * 
 * @fileoverview Error boundary component with comprehensive error handling
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type {
  AppError,
  ErrorType,
  ErrorSeverity,
  ErrorCategory,
  ErrorBoundaryInfo,
  ErrorBoundaryProps,
  ErrorContext,
  RetryConfig,
  RecoveryAction,
  UserFriendlyErrorMessage,
  SystemError,
  BaseError,
} from '@/types/error';
import type {
  ErrorState,
  ErrorActions,
  ErrorContextValue,
  ErrorProviderProps,
} from './provider-types';

// ============================================================================
// ERROR BOUNDARY STATE AND INTERFACES
// ============================================================================

/**
 * Error boundary component state
 */
interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** Classified error information */
  error: AppError | null;
  /** React error info with component stack */
  errorInfo: ErrorInfo | null;
  /** Number of retry attempts */
  retryCount: number;
  /** Whether the error is recoverable */
  isRecoverable: boolean;
  /** Recovery actions available */
  recoveryActions: RecoveryAction[];
  /** User-friendly error message */
  userMessage: UserFriendlyErrorMessage | null;
  /** Error context information */
  context: ErrorContext | null;
  /** Whether retry is in progress */
  isRetrying: boolean;
  /** Last retry timestamp */
  lastRetryTime: number | null;
}

/**
 * Error boundary configuration
 */
interface ErrorBoundaryConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Maximum retry delay */
  maxRetryDelay: number;
  /** Whether to report errors automatically */
  autoReport: boolean;
  /** Development mode configuration */
  development: {
    /** Show error details in development */
    showErrorDetails: boolean;
    /** Enable MSW mock integration */
    enableMswMocks: boolean;
  };
}

/**
 * Default error boundary configuration
 */
const DEFAULT_CONFIG: ErrorBoundaryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxRetryDelay: 10000,
  autoReport: true,
  development: {
    showErrorDetails: process.env.NODE_ENV === 'development',
    enableMswMocks: process.env.NODE_ENV === 'development',
  },
};

// ============================================================================
// ERROR CLASSIFICATION AND UTILITIES
// ============================================================================

/**
 * Classify generic error into structured AppError
 */
function classifyError(error: any, errorInfo?: ErrorInfo): AppError {
  const timestamp = new Date().toISOString();
  const correlationId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Base error properties
  const baseError: Omit<BaseError, 'type' | 'category'> = {
    severity: ErrorSeverity.HIGH,
    code: 'UNHANDLED_ERROR',
    message: error?.message || 'An unexpected error occurred',
    originalError: error,
    isRetryable: false,
    timestamp,
    userFacing: true,
    correlationId,
  };

  // Network errors
  if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
    return {
      ...baseError,
      type: ErrorType.NETWORK,
      category: ErrorCategory.INFRASTRUCTURE,
      isRetryable: true,
      networkCode: error?.code || 'UNKNOWN_NETWORK_ERROR',
      isOffline: !navigator?.onLine,
      url: error?.url || window?.location?.href,
      method: error?.method || 'GET',
    };
  }

  // Authentication errors
  if (error?.status === 401 || error?.code === 'AUTHENTICATION_ERROR') {
    return {
      ...baseError,
      type: ErrorType.AUTHENTICATION,
      category: ErrorCategory.SECURITY,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
      requiresLogin: true,
      authMethod: error?.authMethod,
    };
  }

  // Authorization errors
  if (error?.status === 403 || error?.code === 'AUTHORIZATION_ERROR') {
    return {
      ...baseError,
      type: ErrorType.AUTHORIZATION,
      category: ErrorCategory.SECURITY,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
      requiredPermissions: error?.requiredPermissions || [],
      userPermissions: error?.userPermissions || [],
      resource: error?.resource,
      action: error?.action,
    };
  }

  // Server errors
  if (error?.status >= 500 && error?.status < 600) {
    return {
      ...baseError,
      type: ErrorType.SERVER,
      category: ErrorCategory.APPLICATION,
      isRetryable: true,
      statusCode: error.status,
      serverMessage: error?.message,
      traceId: error?.traceId,
      service: error?.service || 'dreamfactory-api',
    };
  }

  // Client errors
  if (error?.status >= 400 && error?.status < 500) {
    return {
      ...baseError,
      type: ErrorType.CLIENT,
      category: ErrorCategory.USER_INPUT,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
      statusCode: error.status,
      requestData: error?.requestData,
      invalidParams: error?.invalidParams || [],
    };
  }

  // System/component errors (default)
  return {
    ...baseError,
    type: ErrorType.SYSTEM,
    category: ErrorCategory.APPLICATION,
    severity: ErrorSeverity.CRITICAL,
    isRetryable: true,
    stackTrace: error?.stack || errorInfo?.componentStack,
    component: errorInfo?.componentStack?.split('\n')[1]?.trim(),
    runtime: navigator?.userAgent,
  } as SystemError;
}

/**
 * Collect comprehensive error context
 */
function collectErrorContext(): ErrorContext {
  return {
    user: {
      lastAction: document.activeElement?.tagName || 'unknown',
      sessionStart: sessionStorage.getItem('session_start') || undefined,
    },
    application: {
      route: window?.location?.pathname,
      component: 'ErrorBoundary',
      feature: 'error_handling',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
      timestamp: new Date().toISOString(),
    },
    environment: {
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
      referrer: document?.referrer || undefined,
      viewport: {
        width: window?.innerWidth || 0,
        height: window?.innerHeight || 0,
      },
      online: navigator?.onLine,
      language: navigator?.language,
    },
    session: {
      duration: Date.now() - (parseInt(sessionStorage.getItem('session_start') || '0') || Date.now()),
      lastActivity: localStorage.getItem('last_activity') || undefined,
    },
    performance: {
      navigationStart: performance?.timing?.navigationStart,
      loadTime: performance?.timing?.loadEventEnd - performance?.timing?.navigationStart,
      memory: {
        usedJSMemorySize: (performance as any)?.memory?.usedJSMemorySize,
        totalJSMemorySize: (performance as any)?.memory?.totalJSMemorySize,
      },
    },
  };
}

/**
 * Generate user-friendly error message
 */
function generateUserFriendlyMessage(error: AppError): UserFriendlyErrorMessage {
  const baseMessage = {
    technicalDetails: {
      code: error.code,
      timestamp: error.timestamp,
      correlationId: error.correlationId,
    },
    accessibility: {
      ariaLabel: 'Error message with recovery options',
      role: 'alert',
      screenReaderText: 'An error has occurred. Recovery options are available.',
    },
  };

  switch (error.type) {
    case ErrorType.NETWORK:
      return {
        ...baseMessage,
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection.',
        actionableMessage: 'Try refreshing the page or check your network connection.',
        recoveryOptions: [
          {
            type: 'retry',
            label: 'Try Again',
            primary: true,
            accessibility: {
              ariaLabel: 'Retry the failed operation',
              description: 'Attempt to reconnect and retry the last action',
            },
          },
          {
            type: 'refresh',
            label: 'Refresh Page',
            primary: false,
            accessibility: {
              ariaLabel: 'Refresh the current page',
              description: 'Reload the page to start fresh',
            },
          },
        ],
      };

    case ErrorType.AUTHENTICATION:
      return {
        ...baseMessage,
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again to continue.',
        actionableMessage: 'Click the login button to authenticate and continue working.',
        recoveryOptions: [
          {
            type: 'login',
            label: 'Log In',
            primary: true,
            url: '/login',
            accessibility: {
              ariaLabel: 'Navigate to login page',
              description: 'Go to the login page to re-authenticate',
            },
          },
        ],
      };

    case ErrorType.AUTHORIZATION:
      return {
        ...baseMessage,
        title: 'Access Denied',
        message: 'You do not have permission to perform this action.',
        actionableMessage: 'Contact your administrator if you believe this is an error.',
        recoveryOptions: [
          {
            type: 'contact',
            label: 'Contact Support',
            primary: true,
            accessibility: {
              ariaLabel: 'Contact support for assistance',
              description: 'Get help with permission issues',
            },
          },
          {
            type: 'navigate',
            label: 'Go Back',
            primary: false,
            url: '/',
            accessibility: {
              ariaLabel: 'Return to dashboard',
              description: 'Navigate back to the main dashboard',
            },
          },
        ],
      };

    case ErrorType.SERVER:
      return {
        ...baseMessage,
        title: 'Server Error',
        message: 'The server encountered an error while processing your request.',
        actionableMessage: 'This is usually temporary. Please try again in a few moments.',
        recoveryOptions: [
          {
            type: 'retry',
            label: 'Try Again',
            primary: true,
            accessibility: {
              ariaLabel: 'Retry the failed request',
              description: 'Attempt to resend the request to the server',
            },
          },
          {
            type: 'refresh',
            label: 'Refresh Page',
            primary: false,
            accessibility: {
              ariaLabel: 'Refresh the current page',
              description: 'Reload the page to start fresh',
            },
          },
        ],
      };

    case ErrorType.CLIENT:
      return {
        ...baseMessage,
        title: 'Invalid Request',
        message: 'There was a problem with the request data.',
        actionableMessage: 'Please check your input and try again.',
        recoveryOptions: [
          {
            type: 'dismiss',
            label: 'Dismiss',
            primary: true,
            accessibility: {
              ariaLabel: 'Dismiss error message',
              description: 'Close this error and continue',
            },
          },
          {
            type: 'refresh',
            label: 'Refresh Page',
            primary: false,
            accessibility: {
              ariaLabel: 'Refresh the current page',
              description: 'Reload the page to start fresh',
            },
          },
        ],
      };

    default:
      return {
        ...baseMessage,
        title: 'Unexpected Error',
        message: 'An unexpected error occurred.',
        actionableMessage: 'Please try refreshing the page or contact support if the problem persists.',
        recoveryOptions: [
          {
            type: 'refresh',
            label: 'Refresh Page',
            primary: true,
            accessibility: {
              ariaLabel: 'Refresh the current page',
              description: 'Reload the page to recover from the error',
            },
          },
          {
            type: 'contact',
            label: 'Contact Support',
            primary: false,
            accessibility: {
              ariaLabel: 'Contact support for assistance',
              description: 'Get help resolving this issue',
            },
          },
        ],
      };
  }
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(attempt: number, config: ErrorBoundaryConfig): number {
  const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxRetryDelay);
}

// ============================================================================
// ERROR MESSAGE COMPONENT
// ============================================================================

/**
 * Props for ErrorMessage component
 */
interface ErrorMessageProps {
  /** User-friendly error message */
  userMessage: UserFriendlyErrorMessage;
  /** Whether retry is in progress */
  isRetrying: boolean;
  /** Function to handle recovery actions */
  onRecoveryAction: (action: RecoveryAction) => void;
  /** Function to retry the error boundary */
  onRetry: () => void;
  /** Whether to show technical details */
  showTechnicalDetails?: boolean;
}

/**
 * Error message component with accessible recovery actions
 */
function ErrorMessage({
  userMessage,
  isRetrying,
  onRecoveryAction,
  onRetry,
  showTechnicalDetails = false,
}: ErrorMessageProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900"
      role="alert"
      aria-live="assertive"
      aria-label={userMessage.accessibility?.ariaLabel}
    >
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        {/* Error Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
          {userMessage.title}
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          {userMessage.message}
        </p>

        {/* Actionable Message */}
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-6">
          {userMessage.actionableMessage}
        </p>

        {/* Recovery Actions */}
        <div className="space-y-2">
          {userMessage.recoveryOptions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                if (action.type === 'retry') {
                  onRetry();
                } else {
                  onRecoveryAction(action);
                }
              }}
              disabled={isRetrying && action.type === 'retry'}
              className={cn(
                'w-full px-4 py-2 rounded-md font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                action.primary
                  ? 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
              )}
              aria-label={action.accessibility?.ariaLabel}
              title={action.accessibility?.description}
            >
              {isRetrying && action.type === 'retry' ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 inline"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Retrying...
                </>
              ) : (
                action.label
              )}
            </button>
          ))}
        </div>

        {/* Technical Details (Development) */}
        {showTechnicalDetails && userMessage.technicalDetails && (
          <details className="mt-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
            <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Technical Details
            </summary>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono">
              <div>Code: {userMessage.technicalDetails.code}</div>
              <div>Time: {userMessage.technicalDetails.timestamp}</div>
              {userMessage.technicalDetails.correlationId && (
                <div>ID: {userMessage.technicalDetails.correlationId}</div>
              )}
            </div>
          </details>
        )}

        {/* Screen Reader Text */}
        <div className="sr-only" aria-live="polite">
          {userMessage.accessibility?.screenReaderText}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * React Error Boundary class component
 * 
 * Catches JavaScript errors anywhere in the component tree, logs those errors,
 * and displays a fallback UI instead of the component tree that crashed.
 * Replaces Angular DfErrorService with React error handling patterns.
 */
export class ErrorBoundary extends Component<
  React.PropsWithChildren<ErrorBoundaryProps>,
  ErrorBoundaryState
> {
  private config: ErrorBoundaryConfig;
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: React.PropsWithChildren<ErrorBoundaryProps>) {
    super(props);
    
    this.config = {
      ...DEFAULT_CONFIG,
      // Allow props to override defaults
      ...(props.recoveryOptions as any),
    };

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecoverable: false,
      recoveryActions: [],
      userMessage: null,
      context: null,
      isRetrying: false,
      lastRetryTime: null,
    };
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: classifyError(error),
      isRecoverable: true, // Will be refined in componentDidCatch
    };
  }

  /**
   * Component lifecycle method called when an error occurs
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const classifiedError = classifyError(error, errorInfo);
    const context = collectErrorContext();
    const userMessage = generateUserFriendlyMessage(classifiedError);

    // Update state with comprehensive error information
    this.setState({
      error: classifiedError,
      errorInfo,
      context,
      userMessage,
      isRecoverable: classifiedError.isRetryable,
      recoveryActions: userMessage.recoveryOptions,
    });

    // Report error if auto-reporting is enabled
    if (this.config.autoReport) {
      this.reportError(classifiedError, context, errorInfo);
    }

    // Log error to console in development
    if (this.config.development.showErrorDetails) {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Classified Error:', classifiedError);
      console.error('Context:', context);
      console.groupEnd();
    }
  }

  /**
   * Report error to monitoring service
   */
  private async reportError(
    error: AppError,
    context: ErrorContext,
    errorInfo?: ErrorInfo
  ): Promise<void> {
    try {
      // In a real application, this would send to an error monitoring service
      // like Sentry, LogRocket, or custom error reporting endpoint
      const report = {
        error: {
          ...error,
          reactErrorInfo: errorInfo,
        },
        context,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Mock reporting for development
      if (this.config.development.enableMswMocks) {
        console.info('📊 Error Report (Mock):', report);
      } else {
        // In production, send to actual monitoring service
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(report),
        // });
      }
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
    }
  }

  /**
   * Retry the failed operation with exponential backoff
   */
  private handleRetry = () => {
    if (this.state.retryCount >= this.config.maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    const nextRetryCount = this.state.retryCount + 1;
    const delay = calculateRetryDelay(nextRetryCount, this.config);

    this.setState({
      isRetrying: true,
      retryCount: nextRetryCount,
    });

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Set retry timeout with exponential backoff
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
        lastRetryTime: Date.now(),
      });
    }, delay);
  };

  /**
   * Handle recovery actions
   */
  private handleRecoveryAction = (action: RecoveryAction) => {
    switch (action.type) {
      case 'refresh':
        window.location.reload();
        break;
      
      case 'navigate':
        if (action.url) {
          window.location.href = action.url;
        }
        break;
      
      case 'login':
        if (action.url) {
          window.location.href = action.url;
        } else {
          window.location.href = '/login';
        }
        break;
      
      case 'dismiss':
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: 0,
        });
        break;
      
      case 'contact':
        // In a real application, this might open a support widget
        // or navigate to a contact form
        alert('Please contact support at support@dreamfactory.com');
        break;
      
      case 'reset':
        // Reset the error boundary and clear all state
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: 0,
          isRecoverable: false,
          recoveryActions: [],
          userMessage: null,
          context: null,
          isRetrying: false,
          lastRetryTime: null,
        });
        break;
      
      default:
        console.warn('Unknown recovery action:', action.type);
    }
  };

  /**
   * Component cleanup
   */
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Render method
   */
  render() {
    if (this.state.hasError && this.state.userMessage) {
      // Custom fallback component provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            errorInfo={this.state.errorInfo || undefined}
            retry={this.handleRetry}
            recoveryActions={this.state.recoveryActions}
          />
        );
      }

      // Default error UI
      return (
        <ErrorMessage
          userMessage={this.state.userMessage}
          isRetrying={this.state.isRetrying}
          onRecoveryAction={this.handleRecoveryAction}
          onRetry={this.handleRetry}
          showTechnicalDetails={this.config.development.showErrorDetails}
        />
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

// ============================================================================
// HOOK FOR FUNCTIONAL COMPONENT INTEGRATION
// ============================================================================

/**
 * Hook to create an error boundary programmatically
 */
export function useErrorBoundary(
  fallbackComponent?: React.ComponentType<ErrorBoundaryInfo>
) {
  return React.useCallback(
    ({ children }: { children: ReactNode }) => (
      <ErrorBoundary fallback={fallbackComponent}>
        {children}
      </ErrorBoundary>
    ),
    [fallbackComponent]
  );
}

// ============================================================================
// HOC FOR WRAPPING COMPONENTS
// ============================================================================

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<ErrorBoundaryInfo>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary fallback={fallbackComponent}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;
export type { ErrorBoundaryProps, ErrorBoundaryState, ErrorBoundaryConfig };