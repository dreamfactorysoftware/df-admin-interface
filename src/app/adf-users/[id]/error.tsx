'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, Home, Bug } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Error types based on the user edit context
interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  errorInfo?: React.ErrorInfo;
}

interface UserEditErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Error categorization for contextual messaging
type ErrorCategory = 
  | 'validation'
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'server'
  | 'client'
  | 'unknown';

interface ErrorContext {
  category: ErrorCategory;
  isRetryable: boolean;
  userMessage: string;
  actionMessage: string;
  technicalDetails?: string;
}

/**
 * React 19 Error Boundary Component for User Edit Route
 * 
 * Provides comprehensive error handling with WCAG 2.1 AA compliance,
 * retry mechanisms, and contextual recovery options for user editing workflows.
 * 
 * Features:
 * - React 19 error boundary patterns with enhanced error capture
 * - WCAG 2.1 AA compliant error messaging and navigation
 * - Contextual error categorization and recovery suggestions
 * - Retry mechanisms for transient errors
 * - Comprehensive error logging and monitoring integration
 * - Accessible error announcements for screen readers
 */
export default function UserEditError({ error, reset }: UserEditErrorProps) {
  const router = useRouter();
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const maxRetries = 3;

  // Error categorization logic
  const categorizeError = React.useCallback((error: Error): ErrorContext => {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Form validation errors
    if (message.includes('validation') || message.includes('required') || 
        message.includes('invalid') || name.includes('validation')) {
      return {
        category: 'validation',
        isRetryable: false,
        userMessage: 'There are validation errors in the user form that need to be corrected.',
        actionMessage: 'Please review the highlighted fields and correct any validation errors.',
        technicalDetails: 'Form validation failed. Check field requirements and data formats.',
      };
    }

    // Network connectivity errors
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('connection') || name.includes('networkerror')) {
      return {
        category: 'network',
        isRetryable: true,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        actionMessage: 'Try again in a moment, or check your network connection.',
        technicalDetails: 'Network request failed. Possible connectivity issues or server unavailability.',
      };
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('authentication') || 
        message.includes('login') || error.message.includes('401')) {
      return {
        category: 'authentication',
        isRetryable: false,
        userMessage: 'Your session has expired or you are not authenticated.',
        actionMessage: 'Please log in again to continue editing users.',
        technicalDetails: 'Authentication token expired or invalid. User needs to re-authenticate.',
      };
    }

    // Authorization/permission errors
    if (message.includes('forbidden') || message.includes('permission') || 
        message.includes('access') || error.message.includes('403')) {
      return {
        category: 'authorization',
        isRetryable: false,
        userMessage: 'You do not have permission to edit this user.',
        actionMessage: 'Contact your administrator if you believe you should have access.',
        technicalDetails: 'Insufficient permissions for user editing operation.',
      };
    }

    // Server errors (5xx)
    if (message.includes('server') || message.includes('500') || 
        message.includes('503') || message.includes('502')) {
      return {
        category: 'server',
        isRetryable: true,
        userMessage: 'The server encountered an error while processing your request.',
        actionMessage: 'This is usually temporary. Please try again in a moment.',
        technicalDetails: 'Server-side error occurred. Check server logs for details.',
      };
    }

    // Client-side errors
    if (name.includes('typeerror') || name.includes('referenceerror') || 
        message.includes('undefined') || message.includes('null')) {
      return {
        category: 'client',
        isRetryable: true,
        userMessage: 'A technical error occurred while loading the user editor.',
        actionMessage: 'Refreshing the page should resolve this issue.',
        technicalDetails: 'Client-side JavaScript error. Component or data loading issue.',
      };
    }

    // Unknown errors
    return {
      category: 'unknown',
      isRetryable: true,
      userMessage: 'An unexpected error occurred while editing the user.',
      actionMessage: 'Please try again or contact support if the problem persists.',
      technicalDetails: `Unhandled error: ${error.name} - ${error.message}`,
    };
  }, []);

  const errorContext = React.useMemo(() => categorizeError(error), [error, categorizeError]);

  // Error logging and monitoring integration
  React.useEffect(() => {
    const logError = async () => {
      try {
        // Enhanced error logging with user context
        const errorLog = {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            digest: error.digest,
          },
          context: {
            route: '/adf-users/[id]',
            operation: 'user-edit',
            category: errorContext.category,
            isRetryable: errorContext.isRetryable,
            retryCount,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            url: window.location.href,
          },
          user: {
            // Note: In real implementation, get from auth context
            // sessionId: authContext.sessionId,
            // userId: authContext.userId,
          },
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('User Edit Error:', errorLog);
        }

        // In production, send to monitoring service
        // await errorLogger.log(errorLog);
        
        // Placeholder for future error logger integration
        console.warn('Error logging service not yet implemented:', errorLog);
      } catch (loggingError) {
        console.error('Failed to log error:', loggingError);
      }
    };

    logError();
  }, [error, errorContext, retryCount]);

  // Announce error to screen readers
  React.useEffect(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Error: ${errorContext.userMessage} ${errorContext.actionMessage}`;
    document.body.appendChild(announcement);

    return () => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    };
  }, [errorContext]);

  // Retry mechanism with exponential backoff
  const handleRetry = React.useCallback(async () => {
    if (!errorContext.isRetryable || retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Exponential backoff delay (1s, 2s, 4s)
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  }, [errorContext.isRetryable, retryCount, maxRetries, reset]);

  // Navigation handlers
  const handleGoBack = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleGoHome = React.useCallback(() => {
    router.push('/');
  }, [router]);

  const handleGoToUsers = React.useCallback(() => {
    router.push('/adf-users');
  }, [router]);

  // Get appropriate icon for error category
  const getErrorIcon = () => {
    switch (errorContext.category) {
      case 'network':
        return <RefreshCw className="h-8 w-8 text-warning-500" aria-hidden="true" />;
      case 'authentication':
      case 'authorization':
        return <AlertTriangle className="h-8 w-8 text-error-500" aria-hidden="true" />;
      default:
        return <Bug className="h-8 w-8 text-error-500" aria-hidden="true" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        {/* Main Error Card */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 border border-gray-200 dark:border-gray-700">
          {/* Error Icon and Title */}
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error-50 dark:bg-error-900/20 mb-4">
              {getErrorIcon()}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              User Edit Error
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Error Category: {errorContext.category.charAt(0).toUpperCase() + errorContext.category.slice(1)}
            </p>
          </div>

          {/* Error Message */}
          <div className="mb-6">
            <div 
              className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-md p-4"
              role="alert"
              aria-describedby="error-description"
            >
              <div className="flex">
                <AlertTriangle 
                  className="h-5 w-5 text-error-500 mt-0.5 flex-shrink-0" 
                  aria-hidden="true" 
                />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800 dark:text-error-200 mb-2">
                    What happened?
                  </h3>
                  <p 
                    id="error-description"
                    className="text-sm text-error-700 dark:text-error-300 mb-3"
                  >
                    {errorContext.userMessage}
                  </p>
                  <p className="text-sm text-error-600 dark:text-error-400">
                    {errorContext.actionMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Retry Button (if retryable) */}
            {errorContext.isRetryable && retryCount < maxRetries && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px]"
                aria-describedby="retry-description"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Retrying... ({retryCount + 1}/{maxRetries})
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                    Try Again ({retryCount + 1}/{maxRetries})
                  </>
                )}
              </button>
            )}

            {/* Navigation Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleGoBack}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 min-h-[44px]"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Go Back
              </button>

              <button
                onClick={handleGoToUsers}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 min-h-[44px]"
                aria-label="Go to users list"
              >
                <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                Users List
              </button>
            </div>

            <button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200 min-h-[44px]"
              aria-label="Go to dashboard home"
            >
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              Back to Dashboard
            </button>
          </div>

          {/* Retry Limit Reached */}
          {errorContext.isRetryable && retryCount >= maxRetries && (
            <div className="mt-6 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-md p-4">
              <div className="flex">
                <AlertTriangle 
                  className="h-5 w-5 text-warning-500 mt-0.5 flex-shrink-0" 
                  aria-hidden="true" 
                />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-warning-800 dark:text-warning-200 mb-1">
                    Maximum retry attempts reached
                  </h3>
                  <p className="text-sm text-warning-700 dark:text-warning-300">
                    The error persists after {maxRetries} attempts. Please try refreshing the page or contact support if the problem continues.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details (Development only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6">
              <summary className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400">
                Technical Details (Development)
              </summary>
              <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Error:</strong> {error.name}
                </p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Message:</strong> {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Digest:</strong> {error.digest}
                  </p>
                )}
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  <strong>Category:</strong> {errorContext.technicalDetails}
                </p>
              </div>
            </details>
          )}
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact{' '}
            <a 
              href="/support" 
              className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded"
            >
              technical support
            </a>
            {' '}or check the{' '}
            <a 
              href="/docs/troubleshooting" 
              className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded"
            >
              troubleshooting guide
            </a>
            .
          </p>
        </div>
      </div>

      {/* Hidden content for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        <p id="retry-description">
          {errorContext.isRetryable 
            ? `This error can be retried. You have ${maxRetries - retryCount} attempts remaining.`
            : 'This error cannot be automatically retried. Please use the navigation options below.'
          }
        </p>
      </div>
    </div>
  );
}