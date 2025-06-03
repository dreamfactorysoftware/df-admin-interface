'use client';

/**
 * User Management Error Boundary Component
 * 
 * Next.js app router error boundary component that provides comprehensive error
 * handling for the user management section. Implements React 19 error boundary
 * patterns with logging capabilities, retry mechanisms, and WCAG 2.1 AA compliant
 * error messaging for robust user experience.
 * 
 * Features:
 * - React 19 error boundary capabilities with getDerivedStateFromError
 * - Comprehensive error logging and monitoring integration
 * - User-friendly fallback UI with recovery options
 * - WCAG 2.1 AA compliant error messaging and navigation
 * - Tailwind CSS responsive design with theme support
 * - Retry mechanisms and graceful degradation
 * 
 * @fileoverview User management error boundary per Next.js app router conventions
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Metadata } from 'next';

// ===================================================================
// INTERFACES AND TYPES
// ===================================================================

/**
 * Error boundary state interface
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isLogging: boolean;
}

/**
 * Error boundary props interface
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
}

/**
 * Error severity levels for categorization
 */
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error context information for logging
 */
interface ErrorContext {
  section: string;
  userAgent: string;
  url: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  stackTrace?: string;
  componentStack?: string;
  severity: ErrorSeverity;
}

/**
 * Error logging interface - will be implemented by error-logger.ts
 */
interface ErrorLogger {
  logError: (error: Error, context: ErrorContext) => Promise<void>;
  reportError: (errorId: string, error: Error, context: ErrorContext) => Promise<void>;
}

/**
 * Mock error logger implementation for immediate functionality
 * This will be replaced by actual error-logger.ts implementation
 */
const mockErrorLogger: ErrorLogger = {
  logError: async (error: Error, context: ErrorContext) => {
    console.error('[User Management Error]', {
      message: error.message,
      stack: error.stack,
      context,
    });
  },
  reportError: async (errorId: string, error: Error, context: ErrorContext) => {
    console.error('[User Management Error Report]', {
      errorId,
      message: error.message,
      context,
    });
  },
};

// ===================================================================
// ERROR MESSAGE COMPONENT
// ===================================================================

/**
 * Error message component interface
 * This interface will be implemented by error-message.tsx
 */
interface ErrorMessageProps {
  title: string;
  message: string;
  severity?: ErrorSeverity;
  errorId?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Inline Error Message Component
 * Temporary implementation until error-message.tsx is created
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  severity = 'medium',
  errorId,
  className = '',
  children,
}) => {
  const severityClasses = {
    low: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    high: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200',
    critical: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  };

  const iconClasses = {
    low: 'text-blue-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  const Icon = () => (
    <svg
      className={`h-5 w-5 ${iconClasses[severity]}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div
      className={`rounded-md border p-4 ${severityClasses[severity]} ${className}`}
      role="alert"
      aria-live="polite"
      aria-labelledby="error-title"
      aria-describedby="error-message"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon />
        </div>
        <div className="ml-3 flex-1">
          <h3 id="error-title" className="text-sm font-medium">
            {title}
          </h3>
          <div id="error-message" className="mt-2 text-sm">
            <p>{message}</p>
            {errorId && (
              <p className="mt-2 text-xs opacity-75">
                Error ID: <code className="font-mono">{errorId}</code>
              </p>
            )}
          </div>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );
};

// ===================================================================
// BUTTON COMPONENT
// ===================================================================

/**
 * Button component interface
 * This interface will be implemented by button.tsx
 */
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Inline Button Component
 * Temporary implementation until button.tsx is created
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  type = 'button',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 dark:bg-gray-500 dark:hover:bg-gray-600',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-xs rounded',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={ariaLabel}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
      )}
      {children}
    </button>
  );
};

// ===================================================================
// ERROR BOUNDARY COMPONENT
// ===================================================================

/**
 * User Management Error Boundary Component
 * 
 * Implements React 19 error boundary pattern for the user management section
 * with comprehensive error handling, logging, and recovery mechanisms.
 */
export default class UserManagementErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries: number;
  private errorLogger: ErrorLogger;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.maxRetries = props.maxRetries || 3;
    this.errorLogger = mockErrorLogger; // Will use actual error-logger.ts when available
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isLogging: false,
    };
  }

  /**
   * React 19 error boundary method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `UM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * React 19 error boundary method to handle component errors
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.logError(error, errorInfo);
    
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Component update lifecycle to handle prop changes
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.props.resetOnPropsChange && this.props.children !== prevProps.children) {
      if (this.state.hasError) {
        this.resetErrorBoundary();
      }
    }
  }

  /**
   * Log error to monitoring system
   */
  private async logError(error: Error, errorInfo?: ErrorInfo): Promise<void> {
    this.setState({ isLogging: true });

    try {
      const context: ErrorContext = {
        section: 'user-management',
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
        stackTrace: error.stack,
        componentStack: errorInfo?.componentStack,
        severity: this.determineSeverity(error),
      };

      await this.errorLogger.logError(error, context);
      
      if (this.state.errorId) {
        await this.errorLogger.reportError(this.state.errorId, error, context);
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    } finally {
      this.setState({ isLogging: false });
    }
  }

  /**
   * Determine error severity based on error type and message
   */
  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'high';
    }
    
    if (message.includes('chunk') || message.includes('loading')) {
      return 'low';
    }
    
    return 'critical';
  }

  /**
   * Get current user ID from context or storage
   */
  private getUserId(): string | undefined {
    try {
      // Try to get from sessionStorage or context
      return sessionStorage.getItem('userId') || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get current session ID from storage
   */
  private getSessionId(): string | undefined {
    try {
      return sessionStorage.getItem('sessionId') || undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Reset error boundary state and retry
   */
  private handleRetry = (): void => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
        isLogging: false,
      }));
    }
  };

  /**
   * Reset error boundary completely
   */
  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isLogging: false,
    });
  };

  /**
   * Navigate back to safe location
   */
  private handleGoBack = (): void => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  /**
   * Reload the current page
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Copy error details to clipboard for user reporting
   */
  private handleCopyErrorDetails = async (): Promise<void> => {
    try {
      const errorDetails = {
        errorId: this.state.errorId,
        message: this.state.error?.message,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };
      
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      
      // Show success feedback (could be enhanced with toast notification)
      alert('Error details copied to clipboard');
    } catch {
      // Fallback for older browsers
      console.error('Failed to copy error details');
    }
  };

  /**
   * Render error fallback UI
   */
  private renderErrorFallback(): ReactNode {
    const { error, errorId, retryCount, isLogging } = this.state;
    const canRetry = retryCount < this.maxRetries;
    const severity = error ? this.determineSeverity(error) : 'medium';

    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          {/* Error Message */}
          <ErrorMessage
            title="User Management Error"
            message={
              error?.message ||
              'An unexpected error occurred while loading the user management interface. Please try again or contact support if the problem persists.'
            }
            severity={severity}
            errorId={errorId || undefined}
          >
            {/* Error Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              {canRetry && (
                <Button
                  variant="primary"
                  onClick={this.handleRetry}
                  disabled={isLogging}
                  loading={isLogging}
                  aria-label="Retry loading user management"
                >
                  {isLogging ? 'Logging Error...' : 'Try Again'}
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={this.handleGoBack}
                aria-label="Go back to previous page"
              >
                Go Back
              </Button>
              
              <Button
                variant="ghost"
                onClick={this.handleReload}
                aria-label="Reload current page"
              >
                Reload Page
              </Button>
            </div>

            {/* Additional Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleCopyErrorDetails}
                aria-label="Copy error details for support"
              >
                Copy Error Details
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('/help', '_blank')}
                aria-label="Open help documentation"
              >
                Get Help
              </Button>
            </div>

            {/* Retry Counter */}
            {retryCount > 0 && (
              <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Retry attempt {retryCount} of {this.maxRetries}
              </div>
            )}
          </ErrorMessage>

          {/* Accessibility Notice */}
          <div className="sr-only" aria-live="polite" role="status">
            An error has occurred in the user management section. 
            {canRetry ? 'You can try again or navigate back to the previous page.' : 'Please reload the page or contact support.'}
          </div>
        </div>
      </div>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback or default error UI
      return this.props.fallback || this.renderErrorFallback();
    }

    return this.props.children;
  }
}

/**
 * Export metadata for Next.js (if needed for SEO)
 */
export const metadata: Metadata = {
  title: 'User Management Error - DreamFactory Admin',
  description: 'Error page for user management section',
  robots: 'noindex',
};

// Export component types for external usage
export type { ErrorBoundaryProps, ErrorBoundaryState, ErrorContext, ErrorSeverity };