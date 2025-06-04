'use client';

/**
 * Service Reports Error Boundary Component
 * 
 * Next.js app router error boundary providing graceful error handling and recovery
 * options for service reports functionality. Implements React Error Boundary with
 * fallback UI, retry mechanisms, and error reporting integration, ensuring robust
 * user experience during service report failures.
 * 
 * Features:
 * - React Error Boundary integration for comprehensive client-side error capture
 * - Error boundary fallback UI rendering with Tailwind CSS styling
 * - Retry mechanisms with exponential backoff for transient failures
 * - Error reporting and recovery options for enhanced reliability
 * - WCAG 2.1 AA compliant accessibility features
 * - Integration with Next.js app router architecture
 * 
 * Requirements Compliance:
 * - Section 4.2.1.1: React Error Boundary integration for comprehensive client-side error capture
 * - Section 4.2.1.1: Error boundary fallback UI rendering through error boundary components
 * - Section 4.2.1: Graceful degradation and optimal user experience across all error scenarios
 * - Section 0.2.1: Next.js app router error boundary component per file-based routing requirements
 * - React/Next.js Integration Requirements: Error reporting and recovery options
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// ERROR BOUNDARY INTERFACES
// ============================================================================

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorDetails {
  message: string;
  stack?: string;
  digest?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
}

interface RetryState {
  count: number;
  isRetrying: boolean;
  lastAttempt: Date | null;
  backoffMs: number;
}

// ============================================================================
// ERROR REPORTING UTILITIES
// ============================================================================

/**
 * Log error details for monitoring and debugging
 * Implements error reporting integration per React/Next.js Integration Requirements
 */
function logError(errorDetails: ErrorDetails): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Service Reports Error Boundary');
    console.error('Error Message:', errorDetails.message);
    console.error('Timestamp:', errorDetails.timestamp.toISOString());
    console.error('URL:', errorDetails.url);
    console.error('User Agent:', errorDetails.userAgent);
    if (errorDetails.stack) {
      console.error('Stack Trace:', errorDetails.stack);
    }
    if (errorDetails.digest) {
      console.error('Error Digest:', errorDetails.digest);
    }
    console.groupEnd();
  }

  // In production, this would integrate with error monitoring services
  // such as Sentry, DataDog, or similar error reporting platforms
  try {
    // Example error reporting (would be configured based on environment)
    if (typeof window !== 'undefined' && window.navigator.sendBeacon) {
      const errorPayload = JSON.stringify({
        level: 'error',
        message: errorDetails.message,
        timestamp: errorDetails.timestamp.toISOString(),
        url: errorDetails.url,
        userAgent: errorDetails.userAgent,
        digest: errorDetails.digest,
        component: 'service-reports-error-boundary',
        stack: errorDetails.stack?.substring(0, 1000), // Limit stack trace size
      });

      // Send error data to monitoring endpoint
      window.navigator.sendBeacon('/api/errors', errorPayload);
    }
  } catch (reportingError) {
    // Silently fail if error reporting fails to avoid recursive errors
    console.warn('Failed to report error:', reportingError);
  }
}

/**
 * Calculate exponential backoff delay with jitter
 * Implements retry mechanisms with exponential backoff per Section 4.2.1 error handling flowchart
 */
function calculateBackoffDelay(retryCount: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  
  // Add jitter (±25%) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
  return Math.floor(exponentialDelay + jitter);
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Service Reports Error Boundary Component
 * 
 * Next.js app router error boundary component providing graceful error handling
 * and recovery options for service reports functionality. Implements comprehensive
 * error capture, fallback UI, and retry mechanisms per technical specification.
 */
export default function ServiceReportsErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const [retryState, setRetryState] = useState<RetryState>({
    count: 0,
    isRetrying: false,
    lastAttempt: null,
    backoffMs: 0,
  });

  const [showDetails, setShowDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);

  // Maximum retry attempts before giving up
  const MAX_RETRY_ATTEMPTS = 3;

  /**
   * Initialize error details and logging on component mount
   */
  useEffect(() => {
    const details: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };

    setErrorDetails(details);
    logError(details);
  }, [error]);

  /**
   * Handle retry attempt with exponential backoff
   * Implements retry mechanisms with exponential backoff per Section 4.2.1
   */
  const handleRetry = async () => {
    if (retryState.count >= MAX_RETRY_ATTEMPTS) {
      return;
    }

    const backoffDelay = calculateBackoffDelay(retryState.count);
    
    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      backoffMs: backoffDelay,
    }));

    // Wait for backoff delay
    await new Promise(resolve => setTimeout(resolve, backoffDelay));

    setRetryState(prev => ({
      count: prev.count + 1,
      isRetrying: false,
      lastAttempt: new Date(),
      backoffMs: 0,
    }));

    // Attempt to reset the error boundary
    reset();
  };

  /**
   * Handle page refresh as fallback recovery option
   */
  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  /**
   * Handle navigation back to dashboard
   */
  const handleGoToDashboard = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  /**
   * Toggle error details visibility
   */
  const toggleDetails = () => {
    setShowDetails(prev => !prev);
  };

  /**
   * Determine if retry is available
   */
  const canRetry = retryState.count < MAX_RETRY_ATTEMPTS && !retryState.isRetrying;

  return (
    <div className="min-h-96 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 shadow-lg">
        {/* Error Header */}
        <div className="p-6 border-b border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Service Reports Error
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400">
                An error occurred while loading the service reports
              </p>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Error Message */}
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {error.message || 'An unexpected error occurred while processing service reports.'}
              </p>
            </div>

            {/* Retry Information */}
            {retryState.count > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Retry attempts: {retryState.count} / {MAX_RETRY_ATTEMPTS}
                {retryState.lastAttempt && (
                  <span className="ml-2">
                    Last attempt: {retryState.lastAttempt.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}

            {/* Retry Loading State */}
            {retryState.isRetrying && (
              <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
                <span>
                  Retrying in {Math.ceil(retryState.backoffMs / 1000)} seconds...
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {/* Retry Button */}
              {canRetry && (
                <Button
                  onClick={handleRetry}
                  variant="default"
                  size="default"
                  fullWidth
                  disabled={retryState.isRetrying}
                  className="flex items-center justify-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Retry Loading</span>
                </Button>
              )}

              {/* Alternative Actions */}
              <div className="flex space-x-3">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="default"
                  className="flex-1"
                >
                  Refresh Page
                </Button>
                <Button
                  onClick={handleGoToDashboard}
                  variant="secondary"
                  size="default"
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>

            {/* Error Details Toggle */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                onClick={toggleDetails}
                className="flex items-center justify-between w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                aria-expanded={showDetails}
                aria-controls="error-details"
              >
                <span>Error Details</span>
                <svg
                  className={cn(
                    'h-4 w-4 transition-transform',
                    showDetails ? 'rotate-180' : ''
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expandable Error Details */}
              {showDetails && errorDetails && (
                <div id="error-details" className="mt-3 space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Error Information
                    </h4>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Time:</span>{' '}
                        {errorDetails.timestamp.toLocaleString()}
                      </div>
                      {errorDetails.digest && (
                        <div>
                          <span className="font-medium">Error ID:</span>{' '}
                          {errorDetails.digest}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">URL:</span>{' '}
                        <span className="break-all">{errorDetails.url}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stack Trace (Development Only) */}
                  {process.env.NODE_ENV === 'development' && errorDetails.stack && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                      <h4 className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">
                        Stack Trace (Development)
                      </h4>
                      <pre className="text-xs text-red-600 dark:text-red-400 overflow-x-auto whitespace-pre-wrap">
                        {errorDetails.stack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Help Information */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            If this problem persists, please contact your system administrator or check the
            {' '}
            <a
              href="/api-docs"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              API documentation
            </a>
            {' '}
            for troubleshooting guidance.
          </p>
        </div>
      </div>
    </div>
  );
}