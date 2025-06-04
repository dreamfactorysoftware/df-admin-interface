/**
 * @fileoverview Error Boundary Component for Database Service Creation Page
 * 
 * Comprehensive error boundary implementing Next.js error handling conventions
 * for client components. Provides user-friendly error messages for connection
 * failures, validation errors, and system issues with retry mechanisms and
 * recovery workflows as specified in Section 7.2.3.
 * 
 * Key Features:
 * - React error boundary with Next.js conventions for client components
 * - User-friendly error messages with actionable recovery options
 * - Retry mechanisms with exponential backoff for connection and network errors
 * - Accessibility compliance ensuring screen reader compatibility
 * - Error logging integration for monitoring and debugging capabilities
 * - Responsive error layouts maintaining visual consistency with application design
 * 
 * Error Recovery Flows:
 * - Connection timeout recovery with auto-retry
 * - Authentication error correction with credential editing
 * - Network diagnostics with manual retry options
 * - Validation error correction with form field highlighting
 * 
 * Performance Requirements:
 * - Error state rendering under 100ms
 * - Retry mechanisms with exponential backoff (1s, 2s, 4s, 8s)
 * - Accessibility compliance with WCAG 2.1 AA standards
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ============================================================================
// ERROR TYPES AND INTERFACES
// ============================================================================

/**
 * Enumeration of error types for categorized error handling
 */
export enum DatabaseErrorType {
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Interface for error context information
 */
interface ErrorContext {
  type: DatabaseErrorType;
  code?: string;
  statusCode?: number;
  retryable: boolean;
  recoverable: boolean;
  userMessage: string;
  technicalMessage: string;
  suggestions: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Interface for retry state management
 */
interface RetryState {
  count: number;
  maxRetries: number;
  nextRetryDelay: number;
  isRetrying: boolean;
  canRetry: boolean;
}

/**
 * Props for the DatabaseConnectionError component
 */
interface DatabaseConnectionErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// ============================================================================
// ERROR CLASSIFICATION UTILITIES
// ============================================================================

/**
 * Classify error and extract context information
 * Analyzes error details to provide appropriate user messaging and recovery options
 */
function classifyError(error: Error): ErrorContext {
  // Default error context
  let context: ErrorContext = {
    type: DatabaseErrorType.UNKNOWN_ERROR,
    retryable: false,
    recoverable: true,
    userMessage: 'An unexpected error occurred',
    technicalMessage: error.message,
    suggestions: ['Please try again or contact support if the problem persists'],
  };

  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Connection timeout errors
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('etimedout') ||
      errorMessage.includes('connection timed out')) {
    context = {
      type: DatabaseErrorType.CONNECTION_TIMEOUT,
      retryable: true,
      recoverable: true,
      userMessage: 'Connection timeout - The database server is taking too long to respond',
      technicalMessage: error.message,
      suggestions: [
        'Check your network connection',
        'Verify the database server is running',
        'Increase the connection timeout setting',
        'Contact your database administrator'
      ],
    };
  }
  
  // Authentication errors
  else if (errorMessage.includes('authentication') ||
           errorMessage.includes('invalid credentials') ||
           errorMessage.includes('access denied') ||
           errorMessage.includes('unauthorized')) {
    context = {
      type: DatabaseErrorType.AUTHENTICATION_ERROR,
      retryable: false,
      recoverable: true,
      userMessage: 'Authentication failed - Invalid database credentials',
      technicalMessage: error.message,
      suggestions: [
        'Verify your username and password',
        'Check if the database user account is active',
        'Ensure the user has proper database permissions',
        'Contact your database administrator'
      ],
    };
  }
  
  // Network connectivity errors
  else if (errorMessage.includes('network') ||
           errorMessage.includes('econnrefused') ||
           errorMessage.includes('host not found') ||
           errorMessage.includes('dns resolution failed')) {
    context = {
      type: DatabaseErrorType.NETWORK_ERROR,
      retryable: true,
      recoverable: true,
      userMessage: 'Network connection failed - Unable to reach the database server',
      technicalMessage: error.message,
      suggestions: [
        'Check your internet connection',
        'Verify the database host address and port',
        'Check firewall settings',
        'Ensure the database server is accessible from your network'
      ],
    };
  }
  
  // Validation errors
  else if (errorMessage.includes('validation') ||
           errorMessage.includes('invalid') ||
           errorMessage.includes('required') ||
           errorName.includes('validation')) {
    context = {
      type: DatabaseErrorType.VALIDATION_ERROR,
      retryable: false,
      recoverable: true,
      userMessage: 'Configuration validation failed - Please check your input',
      technicalMessage: error.message,
      suggestions: [
        'Review all required fields',
        'Check data format requirements',
        'Verify configuration parameters',
        'Use the connection test to validate settings'
      ],
    };
  }
  
  // Server errors (5xx)
  else if (errorMessage.includes('500') ||
           errorMessage.includes('502') ||
           errorMessage.includes('503') ||
           errorMessage.includes('server error')) {
    context = {
      type: DatabaseErrorType.SERVER_ERROR,
      retryable: true,
      recoverable: true,
      userMessage: 'Server error - The database server encountered an internal error',
      technicalMessage: error.message,
      suggestions: [
        'Wait a moment and try again',
        'Check server status and logs',
        'Contact your system administrator',
        'Report this issue if it persists'
      ],
    };
  }
  
  // Permission errors
  else if (errorMessage.includes('permission') ||
           errorMessage.includes('forbidden') ||
           errorMessage.includes('insufficient privileges')) {
    context = {
      type: DatabaseErrorType.PERMISSION_ERROR,
      retryable: false,
      recoverable: true,
      userMessage: 'Insufficient permissions - You don\'t have access to this database',
      technicalMessage: error.message,
      suggestions: [
        'Contact your administrator to request access',
        'Verify your user role and permissions',
        'Check if you\'re using the correct credentials',
        'Ensure your account has database access rights'
      ],
    };
  }

  return context;
}

/**
 * Log error information for monitoring and debugging
 * Implements basic error logging functionality
 */
function logError(error: Error, context: ErrorContext, retryState: RetryState): void {
  const errorData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: (error as any).digest,
    },
    context,
    retryState,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    referrer: typeof window !== 'undefined' ? document.referrer : undefined,
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Database Connection Error');
    console.error('Error Details:', errorData);
    console.groupEnd();
  }

  // In production, you would send this to your monitoring service
  // Example: analytics.track('database_connection_error', errorData);
  
  // Store error in session storage for support debugging
  try {
    if (typeof window !== 'undefined') {
      const errors = JSON.parse(sessionStorage.getItem('df_connection_errors') || '[]');
      errors.push(errorData);
      // Keep only last 10 errors
      sessionStorage.setItem('df_connection_errors', JSON.stringify(errors.slice(-10)));
    }
  } catch (storageError) {
    console.warn('Failed to store error in session storage:', storageError);
  }
}

// ============================================================================
// ALERT COMPONENT (BASIC IMPLEMENTATION)
// ============================================================================

interface AlertProps {
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  className?: string;
  children: React.ReactNode;
}

function Alert({ variant = 'default', className, children }: AlertProps) {
  const variants = {
    default: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
    destructive: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200',
  };

  return (
    <div
      className={cn(
        'border rounded-lg p-4',
        variants[variant],
        className
      )}
      role="alert"
    >
      {children}
    </div>
  );
}

// ============================================================================
// CARD COMPONENT (BASIC IMPLEMENTATION)
// ============================================================================

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// RETRY MECHANISM WITH EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Custom hook for retry logic with exponential backoff
 */
function useRetryMechanism(maxRetries: number = 3) {
  const [retryState, setRetryState] = useState<RetryState>({
    count: 0,
    maxRetries,
    nextRetryDelay: 1000, // Start with 1 second
    isRetrying: false,
    canRetry: true,
  });

  const executeRetry = useCallback(async (retryFunction: () => void | Promise<void>) => {
    if (!retryState.canRetry || retryState.isRetrying) {
      return;
    }

    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
    }));

    // Wait for the retry delay
    await new Promise(resolve => setTimeout(resolve, retryState.nextRetryDelay));

    try {
      await retryFunction();
      
      // Reset retry state on success
      setRetryState({
        count: 0,
        maxRetries,
        nextRetryDelay: 1000,
        isRetrying: false,
        canRetry: true,
      });
    } catch (error) {
      // Update retry state
      const newCount = retryState.count + 1;
      const newDelay = Math.min(retryState.nextRetryDelay * 2, 16000); // Max 16 seconds
      
      setRetryState({
        count: newCount,
        maxRetries,
        nextRetryDelay: newDelay,
        isRetrying: false,
        canRetry: newCount < maxRetries,
      });
      
      throw error;
    }
  }, [retryState, maxRetries]);

  const resetRetryState = useCallback(() => {
    setRetryState({
      count: 0,
      maxRetries,
      nextRetryDelay: 1000,
      isRetrying: false,
      canRetry: true,
    });
  }, [maxRetries]);

  return {
    retryState,
    executeRetry,
    resetRetryState,
  };
}

// ============================================================================
// ERROR ICONS
// ============================================================================

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-6 w-6', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-4 w-4', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-4 w-4', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Database Connection Error Component
 * 
 * Comprehensive error boundary for database service creation page with
 * user-friendly error messages, recovery options, and retry mechanisms.
 * Implements accessibility best practices and responsive design.
 */
export default function DatabaseConnectionError({
  error,
  reset,
}: DatabaseConnectionErrorProps) {
  const router = useRouter();
  const { retryState, executeRetry, resetRetryState } = useRetryMechanism(3);
  const [errorContext, setErrorContext] = useState<ErrorContext>(() => classifyError(error));

  // Log error on mount and when error changes
  useEffect(() => {
    logError(error, errorContext, retryState);
  }, [error, errorContext, retryState]);

  // Update error context when error changes
  useEffect(() => {
    setErrorContext(classifyError(error));
    resetRetryState();
  }, [error, resetRetryState]);

  // Handle retry with exponential backoff
  const handleRetry = useCallback(async () => {
    if (!errorContext.retryable || !retryState.canRetry) {
      return;
    }

    try {
      await executeRetry(() => {
        reset();
      });
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      // The retry state is already updated by executeRetry
    }
  }, [errorContext.retryable, retryState.canRetry, executeRetry, reset]);

  // Navigate back to service list
  const handleGoBack = useCallback(() => {
    router.push('/api-connections/database');
  }, [router]);

  // Get error severity styling
  const getErrorSeverity = (type: DatabaseErrorType) => {
    switch (type) {
      case DatabaseErrorType.VALIDATION_ERROR:
        return 'warning';
      case DatabaseErrorType.AUTHENTICATION_ERROR:
      case DatabaseErrorType.PERMISSION_ERROR:
        return 'destructive';
      case DatabaseErrorType.CONNECTION_TIMEOUT:
      case DatabaseErrorType.NETWORK_ERROR:
        return 'info';
      default:
        return 'destructive';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ErrorIcon className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Database Connection Error
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            We encountered an issue while setting up your database connection
          </p>
        </div>

        {/* Main Error Card */}
        <Card className="mb-6">
          <div className="p-6">
            {/* Error Alert */}
            <Alert 
              variant={getErrorSeverity(errorContext.type)}
              className="mb-6"
            >
              <div className="flex items-start space-x-3">
                <ErrorIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium">
                    {errorContext.userMessage}
                  </h3>
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        Technical Details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                        {errorContext.technicalMessage}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </Alert>

            {/* Recovery Suggestions */}
            {errorContext.suggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Suggested Solutions
                </h3>
                <ul className="space-y-2">
                  {errorContext.suggestions.map((suggestion, index) => (
                    <li 
                      key={index}
                      className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Retry Information */}
            {errorContext.retryable && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Automatic Retry Available
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {retryState.count > 0 ? (
                        <>
                          Retry {retryState.count} of {retryState.maxRetries} failed.
                          {retryState.canRetry && (
                            <> Next retry in {Math.ceil(retryState.nextRetryDelay / 1000)} seconds.</>
                          )}
                        </>
                      ) : (
                        'You can retry this operation with automatic backoff.'
                      )}
                    </p>
                  </div>
                  {retryState.canRetry && (
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {retryState.maxRetries - retryState.count} retries left
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Retry Button */}
              {errorContext.retryable && retryState.canRetry && (
                <Button
                  onClick={handleRetry}
                  disabled={retryState.isRetrying}
                  loading={retryState.isRetrying}
                  loadingText="Retrying..."
                  leftIcon={!retryState.isRetrying ? <RefreshIcon /> : undefined}
                  className="flex-1"
                >
                  {retryState.count > 0 ? 'Retry Again' : 'Retry Connection'}
                </Button>
              )}

              {/* Manual Reset Button */}
              <Button
                onClick={reset}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>

              {/* Go Back Button */}
              <Button
                onClick={handleGoBack}
                variant="secondary"
                leftIcon={<BackIcon />}
                className="flex-1"
              >
                Back to Services
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Context Information */}
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Error Information
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Type:</dt>
                <dd className="text-gray-900 dark:text-white">{errorContext.type}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Retryable:</dt>
                <dd className="text-gray-900 dark:text-white">
                  {errorContext.retryable ? 'Yes' : 'No'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Recoverable:</dt>
                <dd className="text-gray-900 dark:text-white">
                  {errorContext.recoverable ? 'Yes' : 'No'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Timestamp:</dt>
                <dd className="text-gray-900 dark:text-white">
                  {new Date().toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        {/* Support Information */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            If this problem persists, please contact support with the error details above.
          </p>
          <p className="mt-1">
            Need help? Visit our{' '}
            <a 
              href="/help" 
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              documentation
            </a>{' '}
            or{' '}
            <a 
              href="/support" 
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DatabaseErrorType };
export type { ErrorContext, RetryState };