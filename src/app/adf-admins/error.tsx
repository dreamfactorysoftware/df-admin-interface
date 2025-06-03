'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { XCircleIcon, ArrowPathIcon, HomeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Error boundary props interface for admin management routes
 */
interface AdminErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Error boundary state interface with comprehensive error tracking
 */
interface AdminErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isRetrying: boolean;
}

/**
 * Admin-specific error types for contextual messaging
 */
export enum AdminErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ADMIN_NOT_FOUND = 'ADMIN_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error classification utility for admin-specific error scenarios
 */
function classifyAdminError(error: Error): AdminErrorType {
  const message = error.message.toLowerCase();
  
  if (message.includes('403') || message.includes('forbidden') || message.includes('permission')) {
    return AdminErrorType.PERMISSION_DENIED;
  }
  
  if (message.includes('404') || message.includes('not found')) {
    return AdminErrorType.ADMIN_NOT_FOUND;
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return AdminErrorType.VALIDATION_ERROR;
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return AdminErrorType.NETWORK_ERROR;
  }
  
  if (message.includes('500') || message.includes('server')) {
    return AdminErrorType.SERVER_ERROR;
  }
  
  return AdminErrorType.UNKNOWN_ERROR;
}

/**
 * Generate contextual error messages for admin operations
 */
function getAdminErrorMessage(errorType: AdminErrorType, error: Error): {
  title: string;
  message: string;
  suggestion: string;
} {
  switch (errorType) {
    case AdminErrorType.PERMISSION_DENIED:
      return {
        title: 'Access Denied',
        message: 'You do not have sufficient permissions to perform admin management operations.',
        suggestion: 'Please contact your system administrator to request admin privileges.',
      };
    
    case AdminErrorType.ADMIN_NOT_FOUND:
      return {
        title: 'Admin Not Found',
        message: 'The requested admin user could not be found or may have been removed.',
        suggestion: 'Please verify the admin ID and try again, or return to the admin list.',
      };
    
    case AdminErrorType.VALIDATION_ERROR:
      return {
        title: 'Validation Error',
        message: 'The admin data provided is invalid or incomplete.',
        suggestion: 'Please check all required fields and ensure the data meets the validation requirements.',
      };
    
    case AdminErrorType.NETWORK_ERROR:
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        suggestion: 'Verify your network connection and try again. If the problem persists, contact support.',
      };
    
    case AdminErrorType.SERVER_ERROR:
      return {
        title: 'Server Error',
        message: 'The server encountered an error while processing your admin request.',
        suggestion: 'This is likely a temporary issue. Please try again in a few moments.',
      };
    
    default:
      return {
        title: 'Unexpected Error',
        message: 'An unexpected error occurred in the admin management system.',
        suggestion: 'Please try refreshing the page or contact support if the issue persists.',
      };
  }
}

/**
 * Simple error logging utility (placeholder for actual error logger dependency)
 */
function logError(error: Error, errorInfo: ErrorInfo, errorId: string, context: string) {
  // Enhanced error logging for admin operations
  const logData = {
    errorId,
    timestamp: new Date().toISOString(),
    context: `admin-management-${context}`,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    errorInfo: {
      componentStack: errorInfo.componentStack,
    },
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userId: typeof window !== 'undefined' ? localStorage.getItem('userId') : null,
  };

  // Log to console in development, send to error service in production
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Admin Error Boundary Triggered');
    console.error('Error ID:', errorId);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', context);
    console.error('Full Log Data:', logData);
    console.groupEnd();
  } else {
    // In production, send to error monitoring service
    // This would integrate with the actual error-logger dependency when available
    try {
      // Placeholder for actual error reporting service
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData),
      }).catch(console.error);
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }
}

/**
 * Error boundary component for admin management routes
 * Implements React 19 error boundary capabilities with admin-specific error handling
 */
export default class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private readonly maxRetries = 3;

  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  /**
   * React error boundary lifecycle method to capture errors
   */
  static getDerivedStateFromError(error: Error): Partial<AdminErrorBoundaryState> {
    const errorId = `admin-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  /**
   * React error boundary lifecycle method to handle error logging
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state;
    
    if (errorId) {
      logError(error, errorInfo, errorId, 'boundary-catch');
    }
    
    this.setState({
      errorInfo,
    });
  }

  /**
   * Cleanup timeout on unmount
   */
  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Handle retry action with exponential backoff
   */
  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;
    
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: retryCount + 1,
        isRetrying: false,
      });
    }, delay);
  };

  /**
   * Reset error boundary state
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  /**
   * Navigate to admin list page
   */
  handleGoToAdminList = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/adf-admins';
    }
  };

  /**
   * Navigate to dashboard home
   */
  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    const { children, fallback } = this.props;
    const { hasError, error, errorId, retryCount, isRetrying } = this.state;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const errorType = classifyAdminError(error);
      const { title, message, suggestion } = getAdminErrorMessage(errorType, error);
      const canRetry = retryCount < this.maxRetries && errorType !== AdminErrorType.PERMISSION_DENIED;

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Error Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Admin Management Error
                  </p>
                </div>
              </div>
            </div>

            {/* Error Content */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {message}
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {suggestion}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-4">
                  <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    Technical Details
                  </summary>
                  <div className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded border font-mono">
                    <p className="text-red-600 dark:text-red-400 mb-1">
                      <strong>Error:</strong> {error.message}
                    </p>
                    {errorId && (
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        <strong>Error ID:</strong> {errorId}
                      </p>
                    )}
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Type:</strong> {errorType}
                    </p>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    disabled={isRetrying}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                    {isRetrying ? 'Retrying...' : `Retry ${retryCount > 0 ? `(${this.maxRetries - retryCount} left)` : ''}`}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={this.handleGoToAdminList}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Admin List
                  </button>

                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <HomeIcon className="h-4 w-4 mr-1" />
                    Dashboard
                  </button>
                </div>

                <button
                  onClick={this.handleReset}
                  className="w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Reset and Try Again
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                If this error persists, please contact your system administrator
                {errorId && ` with error ID: ${errorId}`}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap components with admin error boundary
 */
export function withAdminErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function AdminErrorBoundaryWrapper(props: P) {
    return (
      <AdminErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AdminErrorBoundary>
    );
  };
}

/**
 * Hook for manually triggering error boundary (for testing)
 */
export function useAdminErrorBoundary() {
  return {
    captureError: (error: Error) => {
      throw error;
    },
  };
}