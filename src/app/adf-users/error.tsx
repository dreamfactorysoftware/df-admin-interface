'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, Home, Users, ChevronRight } from 'lucide-react';

/**
 * Error logger utility for production error tracking and debugging
 * Implements comprehensive error logging with context information
 */
const logError = (error: Error, errorInfo?: { componentStack?: string; errorBoundary?: string }) => {
  // Enhanced error logging for React 19 error boundary capabilities
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    component: 'UserManagementErrorBoundary',
    context: 'adf-users',
    digest: (error as any).digest || null,
    componentStack: errorInfo?.componentStack,
    errorBoundary: errorInfo?.errorBoundary,
  };

  // Console logging for development with enhanced React 19 error information
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 User Management Error Boundary Triggered');
    console.error('Error Details:', errorData);
    console.error('Original Error:', error);
    if (errorInfo?.componentStack) {
      console.error('Component Stack:', errorInfo.componentStack);
    }
    console.groupEnd();
  }

  // Production error reporting integration
  if (process.env.NODE_ENV === 'production') {
    // Send to error monitoring service (e.g., Sentry, LogRocket, Datadog)
    try {
      // Example integration - replace with actual monitoring service
      if (typeof window !== 'undefined' && (window as any).errorTracking) {
        (window as any).errorTracking.captureException(error, {
          tags: {
            component: 'user-management',
            boundary: 'adf-users-error',
          },
          extra: errorData,
        });
      }
    } catch (loggingError) {
      console.error('Failed to log error to monitoring service:', loggingError);
    }
  }
};

/**
 * User Management Error Boundary Component
 * 
 * Implements Next.js app router error boundary for the user management section.
 * Provides graceful error handling with recovery options and user-friendly messaging
 * using React 19 error boundary patterns with comprehensive logging capabilities.
 * 
 * Features:
 * - WCAG 2.1 AA compliant error messaging and recovery options
 * - Accessible error announcements for screen readers
 * - User-friendly error UI with recovery options using Tailwind CSS
 * - Error tracking and monitoring integration for production analysis
 * - Retry mechanisms for robust user experience
 */
interface UserManagementErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function UserManagementError({ error, reset }: UserManagementErrorProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Log error on component mount and error changes
  useEffect(() => {
    logError(error, {
      componentStack: 'UserManagementError component in adf-users section',
      errorBoundary: 'Next.js app router error boundary',
    });
  }, [error]);

  // Handle retry with loading state and retry tracking
  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Add slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      reset();
    } catch (resetError) {
      console.error('Error boundary reset failed:', resetError);
      logError(resetError as Error, {
        componentStack: 'Error boundary reset operation',
        errorBoundary: 'UserManagementError',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Navigate to safe fallback routes
  const handleNavigateHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const handleNavigateToUsers = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/adf-users';
    }
  };

  // Determine error type for contextual messaging
  const getErrorContext = () => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        title: 'Connection Issue',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        icon: <RefreshCw className="h-8 w-8 text-blue-500" aria-hidden="true" />,
        retryText: 'Retry Connection',
      };
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('403') || errorMessage.includes('401')) {
      return {
        title: 'Access Denied',
        description: 'You do not have permission to access this user management feature. Please contact your administrator.',
        icon: <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden="true" />,
        retryText: 'Try Again',
      };
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return {
        title: 'User Not Found',
        description: 'The requested user or user management feature could not be found.',
        icon: <Users className="h-8 w-8 text-gray-500" aria-hidden="true" />,
        retryText: 'Reload Page',
      };
    }
    
    return {
      title: 'Unexpected Error',
      description: 'An unexpected error occurred in the user management system. Our team has been notified.',
      icon: <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />,
      retryText: 'Try Again',
    };
  };

  const errorContext = getErrorContext();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Error Announcement for Screen Readers - WCAG 2.1 AA Compliance */}
        <div
          role="alert"
          aria-live="assertive"
          className="sr-only"
        >
          Error in user management: {errorContext.title}. {errorContext.description}
        </div>

        {/* Visual Error Display */}
        <div className="text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            {errorContext.icon}
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {errorContext.title}
          </h1>

          {/* Error Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {errorContext.description}
          </p>

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
            <span>Home</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span>User Management</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="text-red-500 dark:text-red-400">Error</span>
          </nav>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Primary Retry Button */}
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200"
              aria-describedby="retry-description"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5" aria-hidden="true" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="-ml-1 mr-3 h-5 w-5" aria-hidden="true" />
                  {errorContext.retryText}
                </>
              )}
            </button>
            <p id="retry-description" className="sr-only">
              Click to retry the failed operation. Attempt number {retryCount + 1}.
            </p>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleNavigateToUsers}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Users className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                User List
              </button>

              <button
                onClick={handleNavigateHome}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Home className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                Dashboard
              </button>
            </div>
          </div>

          {/* Retry Count Indicator */}
          {retryCount > 0 && (
            <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {retryCount === 1 ? '1 retry attempt made' : `${retryCount} retry attempts made`}
                {retryCount >= 3 && (
                  <span className="block mt-1 text-xs">
                    If the problem persists, please contact technical support.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Technical Details (Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                Technical Details (Development Mode)
              </summary>
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border">
                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Error:</span>
                    <pre className="mt-1 text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                      {error.name}: {error.message}
                    </pre>
                  </div>
                  {error.digest && (
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Digest:</span>
                      <pre className="mt-1 text-gray-600 dark:text-gray-400 break-words">
                        {error.digest}
                      </pre>
                    </div>
                  )}
                  {error.stack && (
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Stack Trace:</span>
                      <pre className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Error ID: {error.digest || 'N/A'} • {new Date().toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              If this error persists, please contact support with the error ID above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}