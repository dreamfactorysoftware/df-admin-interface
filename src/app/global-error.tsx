'use client';

import { useEffect, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Global error handler for Next.js app router that catches unhandled errors
// across the entire application, providing fallback UI and error reporting
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorId, setErrorId] = useState<string>('');

  useEffect(() => {
    // Generate unique error ID for tracking
    const id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setErrorId(id);

    // Log error with comprehensive context
    const errorContext = {
      errorId: id,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      retryCount,
      userId: getUserId(), // Get current user ID if available
      sessionId: getSessionId(), // Get session ID if available
      buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
    };

    // Attempt to log error using error logger service
    try {
      logGlobalError(errorContext);
    } catch (loggingError) {
      // Fallback logging to console if error logger fails
      console.error('Failed to log error:', loggingError);
      console.error('Original error:', errorContext);
    }

    // Report to external monitoring services (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined') {
      try {
        reportToMonitoring(errorContext);
      } catch (reportingError) {
        console.error('Failed to report error to monitoring:', reportingError);
      }
    }
  }, [error, retryCount]);

  // Handle retry with exponential backoff
  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    try {
      // Optional: Clear any cached data that might be causing issues
      if (typeof window !== 'undefined') {
        // Clear React Query cache if available
        try {
          const queryClient = getQueryClient();
          if (queryClient) {
            queryClient.clear();
          }
        } catch (e) {
          console.warn('Could not clear query cache:', e);
        }

        // Clear local storage of potentially corrupted data
        try {
          const corruptedKeys = ['dreamfactory-admin-store', 'app-cache'];
          corruptedKeys.forEach(key => {
            localStorage.removeItem(key);
          });
        } catch (e) {
          console.warn('Could not clear local storage:', e);
        }
      }

      // Wait for delay before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      reset();
    } catch (retryError) {
      console.error('Error during retry:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle page reload as last resort
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // Navigate to safe landing page
  const handleNavigateHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <html>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="max-w-2xl w-full space-y-8">
            {/* Error Icon and Title */}
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                Application Error
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Something went wrong and the application encountered an unexpected error.
                Our team has been automatically notified.
              </p>
            </div>

            {/* Error Details Card */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Error Details
                  </h2>
                  <button
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {isDetailsExpanded ? (
                      <>
                        <ChevronDownIcon className="h-4 w-4 mr-1" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronRightIcon className="h-4 w-4 mr-1" />
                        Show Details
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Error ID
                    </p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {errorId}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Error Message
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {error.message || 'An unexpected error occurred'}
                    </p>
                  </div>

                  {error.digest && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Error Digest
                      </p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {error.digest}
                      </p>
                    </div>
                  )}

                  {retryCount > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Retry Attempts
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {retryCount} attempt{retryCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Expandable Stack Trace */}
                {isDetailsExpanded && error.stack && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Stack Trace
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 overflow-auto max-h-60">
                      <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recovery Actions */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recovery Options
              </h3>
              
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRetrying ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Retrying...
                      </>
                    ) : (
                      'Try Again'
                    )}
                  </button>

                  <button
                    onClick={handleNavigateHome}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>

                <button
                  onClick={handleReload}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Reload Page
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If the problem persists, please contact support with the Error ID above.
                  Our team can use this ID to investigate the issue and provide assistance.
                </p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                DreamFactory Admin Interface • Error occurred at {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

// Utility functions that attempt to integrate with expected services
// These provide fallback functionality if the services don't exist yet

/**
 * Attempts to log error using the error logger service
 * Falls back to console logging if service is unavailable
 */
function logGlobalError(errorContext: any) {
  try {
    // Try to import and use the error logger service
    // This will gracefully fail if the service doesn't exist yet
    if (typeof window !== 'undefined') {
      // Dynamic import for client-side only
      import('../lib/error-logger').then(({ logError }) => {
        logError('GLOBAL_ERROR', errorContext);
      }).catch(() => {
        // Fallback to console logging
        console.error('[Global Error]', errorContext);
      });
    }
  } catch (error) {
    // Fallback logging
    console.error('[Global Error]', errorContext);
  }
}

/**
 * Reports error to external monitoring services
 * Integrates with Sentry, LogRocket, or other monitoring tools
 */
function reportToMonitoring(errorContext: any) {
  try {
    // Sentry integration (if available)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(errorContext.message), {
        tags: {
          component: 'global-error',
          errorId: errorContext.errorId,
        },
        extra: errorContext,
      });
    }

    // LogRocket integration (if available)
    if (typeof window !== 'undefined' && (window as any).LogRocket) {
      (window as any).LogRocket.captureException(new Error(errorContext.message));
    }

    // Custom monitoring endpoint
    if (process.env.NEXT_PUBLIC_MONITORING_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorContext),
      }).catch(() => {
        // Silent fail for monitoring - we don't want monitoring to break the app
      });
    }
  } catch (error) {
    // Silent fail for monitoring integrations
    console.warn('Failed to report to monitoring services:', error);
  }
}

/**
 * Gets current user ID from authentication state
 * Returns null if user is not authenticated or service unavailable
 */
function getUserId(): string | null {
  try {
    if (typeof window !== 'undefined') {
      // Try to get from various possible auth stores
      const authData = localStorage.getItem('dreamfactory-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id || parsed.userId || null;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Gets current session ID for tracking
 * Returns null if session is not available
 */
function getSessionId(): string | null {
  try {
    if (typeof window !== 'undefined') {
      // Try to get from session storage or auth store
      const sessionData = sessionStorage.getItem('dreamfactory-session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return parsed.sessionId || parsed.id || null;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Gets React Query client instance if available
 * Used for clearing cache during error recovery
 */
function getQueryClient(): any {
  try {
    if (typeof window !== 'undefined') {
      // Try to access global query client (common pattern)
      return (window as any).__REACT_QUERY_CLIENT__;
    }
    return null;
  } catch (error) {
    return null;
  }
}