'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Error boundary component for the create limits route
 * Implements React 19 error boundary patterns with comprehensive error handling,
 * fallback UI rendering, and user-friendly recovery mechanisms.
 * 
 * Features:
 * - React 19 error boundary implementation per Section 4.2.1.1
 * - Next.js error boundary integration with fallback UI per React/Next.js Integration Requirements
 * - Comprehensive error logging and monitoring per Section 3.6
 * - WCAG 2.1 AA compliance for error states and recovery mechanisms
 * - User-friendly error recovery with retry options per Section 4.2.2
 * - React Query error handling integration per Section 3.2.2
 */

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface CreateLimitsErrorProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

/**
 * Custom alert component interface for error display
 * This will be replaced with the actual Alert component when available
 */
interface AlertProps {
  variant: 'error' | 'warning' | 'info' | 'success';
  children: ReactNode;
  className?: string;
  role?: string;
  'aria-live'?: 'polite' | 'assertive';
}

/**
 * Temporary Alert component implementation
 * Will be replaced with actual src/components/ui/alert.tsx when available
 */
const Alert: React.FC<AlertProps> = ({ 
  variant, 
  children, 
  className = '', 
  role = 'alert',
  'aria-live': ariaLive = 'assertive'
}) => {
  const baseClasses = 'rounded-lg border p-4 text-sm';
  const variantClasses = {
    error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
    success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      role={role}
      aria-live={ariaLive}
    >
      {children}
    </div>
  );
};

/**
 * Custom button component interface for error recovery actions
 * This will be replaced with the actual Button component when available
 */
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Temporary Button component implementation
 * Will be replaced with actual src/components/ui/button.tsx when available
 */
const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  children, 
  onClick, 
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

/**
 * Custom card component interface for error display container
 * This will be replaced with the actual Card component when available
 */
interface CardProps {
  children: ReactNode;
  className?: string;
  role?: string;
}

/**
 * Temporary Card component implementation
 * Will be replaced with actual src/components/ui/card.tsx when available
 */
const Card: React.FC<CardProps> = ({ children, className = '', role }) => {
  return (
    <div 
      className={`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 ${className}`}
      role={role}
    >
      {children}
    </div>
  );
};

/**
 * Error logging utility
 * Integrates with Next.js built-in error reporting and monitoring systems
 * per Section 3.6 development and deployment requirements
 */
class ErrorLogger {
  private static instance: ErrorLogger;

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log error with comprehensive context for monitoring and debugging
   * Implements error logging integration per Section 3.6 monitoring and logging
   */
  public logError(error: Error, errorInfo: ErrorInfo, context: Record<string, any> = {}): string {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    const logData = {
      errorId,
      timestamp,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      context,
      level: 'error',
      source: 'create-limits-error-boundary'
    };

    // Development mode enhanced error reporting per Section 3.6 quality assurance
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary - ${errorId}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Context:', context);
      console.error('Full Log Data:', logData);
      console.groupEnd();
    }

    // Production error reporting to monitoring systems
    if (process.env.NODE_ENV === 'production') {
      try {
        // Integration with Next.js built-in error reporting
        if (typeof window !== 'undefined' && 'analytics' in window) {
          (window as any).analytics?.track('Error Boundary Triggered', logData);
        }

        // Send to external error monitoring service (e.g., Sentry, DataDog)
        this.sendToMonitoringService(logData);
      } catch (loggingError) {
        console.error('Failed to log error to monitoring service:', loggingError);
      }
    }

    return errorId;
  }

  /**
   * Generate unique error ID for tracking and correlation
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send error data to external monitoring service
   * Placeholder for integration with monitoring systems per Section 3.6
   */
  private sendToMonitoringService(logData: any): void {
    // Integration point for external monitoring services
    // Example: Sentry, DataDog, New Relic, CloudWatch, etc.
    if (process.env.NEXT_PUBLIC_MONITORING_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      }).catch(err => {
        console.error('Failed to send error to monitoring service:', err);
      });
    }
  }
}

/**
 * Main error boundary component for create limits route
 * Implements React 19 error boundary patterns per Section 4.2.1.1 error boundary implementation
 */
export default class CreateLimitsError extends React.Component<CreateLimitsErrorProps, ErrorBoundaryState> {
  private errorLogger: ErrorLogger;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: CreateLimitsErrorProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };

    this.errorLogger = ErrorLogger.getInstance();
  }

  /**
   * React error boundary lifecycle method
   * Captures errors during render, lifecycle methods, and constructors
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  /**
   * Handle error with comprehensive logging and monitoring
   * Implements comprehensive error logging per Section 3.6 monitoring and logging
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = this.errorLogger.logError(error, errorInfo, {
      route: '/adf-limits/create',
      retryCount: this.state.retryCount,
      component: 'CreateLimitsError',
      timestamp: new Date().toISOString()
    });

    this.setState({
      errorInfo,
      errorId
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Clear any existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Cleanup on component unmount
   */
  componentWillUnmount(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Handle retry action with rate limiting
   * Implements user-friendly error recovery per Section 4.2.2 form validation flow
   */
  private handleRetry = (): void => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    // Clear React Query cache for fresh data on retry
    // Integration with React Query error handling per Section 3.2.2
    if (typeof window !== 'undefined') {
      const queryClient = (window as any).__REACT_QUERY_CLIENT__;
      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: ['limits'] });
        queryClient.removeQueries({ queryKey: ['limits', 'create'] });
      }
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));

    // Log retry attempt
    this.errorLogger.logError(
      new Error('User initiated retry'), 
      { componentStack: 'Retry attempt' } as ErrorInfo,
      {
        retryCount: this.state.retryCount + 1,
        previousErrorId: this.state.errorId,
        route: '/adf-limits/create'
      }
    );
  };

  /**
   * Navigate back to limits list
   */
  private handleGoBack = (): void => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  /**
   * Navigate to limits list page
   */
  private handleGoToLimitsList = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/adf-limits';
    }
  };

  /**
   * Render error fallback UI with accessibility compliance
   * Implements WCAG 2.1 AA compliance per Section 3.2.6 UI component architecture
   */
  private renderErrorFallback(): ReactNode {
    const { error, errorId, retryCount } = this.state;
    const maxRetries = this.props.maxRetries || 3;
    const canRetry = retryCount < maxRetries;
    
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900"
        role="main"
        aria-labelledby="error-title"
        aria-describedby="error-description"
      >
        <Card className="w-full max-w-2xl p-6" role="region">
          <div className="text-center space-y-6">
            {/* Error Icon with accessibility */}
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Error icon"
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
            <div className="space-y-2">
              <h1 
                id="error-title"
                className="text-2xl font-bold text-gray-900 dark:text-gray-100"
              >
                Unable to Create Limit
              </h1>
              <p 
                id="error-description"
                className="text-gray-600 dark:text-gray-400"
              >
                An unexpected error occurred while trying to create a new limit. 
                Please try again or contact support if the problem persists.
              </p>
            </div>

            {/* Error Details for Development */}
            {process.env.NODE_ENV === 'development' && error && (
              <Alert variant="error" className="text-left">
                <div className="space-y-2">
                  <h3 className="font-semibold">Development Error Details:</h3>
                  <p className="text-sm font-mono break-all">{error.message}</p>
                  {errorId && (
                    <p className="text-xs text-gray-500">Error ID: {errorId}</p>
                  )}
                </div>
              </Alert>
            )}

            {/* Error ID for Production */}
            {process.env.NODE_ENV === 'production' && errorId && (
              <Alert variant="info">
                <p className="text-sm">
                  Error ID: <code className="font-mono">{errorId}</code>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Please provide this ID when contacting support.
                </p>
              </Alert>
            )}

            {/* Retry Information */}
            {retryCount > 0 && (
              <Alert variant="warning">
                <p className="text-sm">
                  Retry attempt {retryCount} of {maxRetries}
                  {!canRetry && ' - Maximum retries reached'}
                </p>
              </Alert>
            )}

            {/* Action Buttons with accessibility */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  aria-label={`Retry creating limit (attempt ${retryCount + 1} of ${maxRetries})`}
                >
                  Try Again
                </Button>
              )}
              
              <Button
                onClick={this.handleGoBack}
                variant="secondary"
                aria-label="Go back to previous page"
              >
                Go Back
              </Button>
              
              <Button
                onClick={this.handleGoToLimitsList}
                variant="outline"
                aria-label="Navigate to limits list page"
              >
                View All Limits
              </Button>
            </div>

            {/* Additional Help Information */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Need Help?
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>• Check your network connection</p>
                <p>• Verify you have permission to create limits</p>
                <p>• Try refreshing the page</p>
                <p>• Contact system administrator if the issue persists</p>
              </div>
            </div>

            {/* Accessibility: Screen reader announcement */}
            <div 
              className="sr-only" 
              aria-live="assertive" 
              aria-atomic="true"
            >
              An error occurred while creating a limit. 
              {canRetry ? 'You can try again or navigate to a different page.' : 'Maximum retry attempts reached. Please navigate to a different page or contact support.'}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /**
   * Render method - returns children if no error, otherwise fallback UI
   */
  render(): ReactNode {
    if (this.state.hasError) {
      // Return custom fallback if provided, otherwise default error UI
      return this.props.fallback || this.renderErrorFallback();
    }

    return this.props.children;
  }
}

/**
 * Hook for integrating with React Query error handling
 * Provides error boundary context for React Query mutations and queries
 * Integration with React Query error handling per Section 3.2.2 state management architecture
 */
export const useErrorBoundaryIntegration = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleQueryError = React.useCallback((error: Error, queryKey?: string[]) => {
    const errorLogger = ErrorLogger.getInstance();
    
    errorLogger.logError(
      error,
      { componentStack: 'React Query Error' } as ErrorInfo,
      {
        queryKey,
        route: '/adf-limits/create',
        source: 'react-query-integration'
      }
    );

    // Clear related cache on error
    if (queryKey) {
      queryClient.removeQueries({ queryKey });
    }
  }, [queryClient]);

  const resetErrorBoundary = React.useCallback(() => {
    // Clear all queries related to limits creation
    queryClient.invalidateQueries({ queryKey: ['limits'] });
    queryClient.removeQueries({ queryKey: ['limits', 'create'] });
    
    // Navigate to a clean state
    router.refresh();
  }, [queryClient, router]);

  return {
    handleQueryError,
    resetErrorBoundary
  };
};

/**
 * Export types for use in other components
 */
export type { ErrorBoundaryState, CreateLimitsErrorProps };