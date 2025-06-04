'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Error boundary component for the scheduler task details page that catches and displays
 * comprehensive error information specific to scheduler task management operations.
 * 
 * This component implements React Error Boundary integration with Next.js error handling
 * patterns, providing graceful degradation for scheduler task creation, editing, validation,
 * and data fetching failures with contextual error messages and recovery options tailored
 * to scheduler workflows.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Error & { digest?: string }} props.error - The error object containing error details
 * @param {() => void} props.reset - Function to reset the error boundary and retry the operation
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SchedulerTaskError({ error, reset }: ErrorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Enhanced error logging and reporting integration
  useEffect(() => {
    // Log error to monitoring systems (error reporting integration)
    console.error('Scheduler Task Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      context: 'scheduler-task-details',
      url: window.location.href,
    });

    // Report to error monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Integration point for error reporting service (e.g., Sentry, LogRocket)
      // This would be implemented based on the chosen monitoring solution
      try {
        // Example error reporting call
        // errorReportingService.captureException(error, {
        //   tags: { component: 'scheduler-task-details' },
        //   extra: { digest: error.digest }
        // });
      } catch (reportingError) {
        console.warn('Error reporting failed:', reportingError);
      }
    }
  }, [error]);

  /**
   * Determines the error type and returns appropriate messaging
   * Handles scheduler-specific error scenarios with contextual messaging
   */
  const getErrorDetails = () => {
    const errorMessage = error.message.toLowerCase();

    // Network and connectivity errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        title: 'Network Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        type: 'network' as const,
        icon: '🌐',
        canRetry: true,
      };
    }

    // Scheduler task validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('required')) {
      return {
        title: 'Task Validation Error',
        description: 'The scheduler task configuration contains invalid data. Please review the form fields and correct any errors.',
        type: 'validation' as const,
        icon: '⚠️',
        canRetry: true,
      };
    }

    // Service-related errors
    if (errorMessage.includes('service') || errorMessage.includes('endpoint')) {
      return {
        title: 'Service Configuration Error',
        description: 'Unable to load service information or access list. The selected service may be unavailable.',
        type: 'service' as const,
        icon: '🔧',
        canRetry: true,
      };
    }

    // Authentication and authorization errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      return {
        title: 'Access Denied',
        description: 'You do not have permission to perform this action. Please contact your administrator.',
        type: 'auth' as const,
        icon: '🔒',
        canRetry: false,
      };
    }

    // Server errors
    if (errorMessage.includes('500') || errorMessage.includes('server')) {
      return {
        title: 'Server Error',
        description: 'An internal server error occurred while processing your request. Please try again later.',
        type: 'server' as const,
        icon: '🔥',
        canRetry: true,
      };
    }

    // Task creation/update specific errors
    if (errorMessage.includes('create') || errorMessage.includes('update') || errorMessage.includes('save')) {
      return {
        title: 'Task Operation Failed',
        description: 'Failed to save the scheduler task. Please verify your configuration and try again.',
        type: 'operation' as const,
        icon: '💾',
        canRetry: true,
      };
    }

    // JSON payload errors
    if (errorMessage.includes('json') || errorMessage.includes('payload')) {
      return {
        title: 'Invalid JSON Payload',
        description: 'The task payload contains invalid JSON. Please check the syntax and format.',
        type: 'json' as const,
        icon: '📝',
        canRetry: true,
      };
    }

    // Generic fallback
    return {
      title: 'Unexpected Error',
      description: 'An unexpected error occurred while managing the scheduler task. Please try again.',
      type: 'generic' as const,
      icon: '❌',
      canRetry: true,
    };
  };

  /**
   * Comprehensive error recovery mechanisms including cache reset and form state clearing
   * Implements scheduler task error recovery per React Query patterns
   */
  const handleRetry = async () => {
    try {
      // Reset React Query cache for scheduler-related queries
      await queryClient.invalidateQueries({ 
        queryKey: ['scheduler-tasks'] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['scheduler-task'] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['services'] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['component-access-list'] 
      });

      // Clear any error states in the cache
      queryClient.removeQueries({ 
        queryKey: ['scheduler'], 
        exact: false 
      });

      // Reset the error boundary
      reset();
    } catch (retryError) {
      console.error('Retry operation failed:', retryError);
      // If retry fails, still attempt to reset the boundary
      reset();
    }
  };

  /**
   * Navigate back to scheduler list with proper cache cleanup
   */
  const handleNavigateBack = () => {
    // Clear any pending mutations or stale cache entries
    queryClient.removeQueries({ 
      queryKey: ['scheduler-task'], 
      exact: false 
    });
    
    router.push('/system-settings/scheduler');
  };

  /**
   * Advanced recovery - refresh page and clear all scheduler-related cache
   */
  const handleFullRefresh = () => {
    // Clear all scheduler-related queries
    queryClient.clear();
    
    // Refresh the page
    window.location.reload();
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error Alert Component */}
        <div 
          className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-6 mb-6"
          role="alert"
          aria-live="assertive"
          aria-describedby="error-description"
        >
          {/* Error Icon and Title */}
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3" aria-hidden="true">
              {errorDetails.icon}
            </span>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {errorDetails.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scheduler Task Management Error
              </p>
            </div>
          </div>

          {/* Error Description */}
          <div id="error-description" className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {errorDetails.description}
            </p>
            
            {/* Technical Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded border">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400">
                  Technical Details
                </summary>
                <div className="mt-2 text-xs font-mono text-gray-800 dark:text-gray-200">
                  <p><strong>Error:</strong> {error.name}</p>
                  <p><strong>Message:</strong> {error.message}</p>
                  {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
                  {error.stack && (
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>

          {/* Recovery Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Primary Recovery Action */}
            {errorDetails.canRetry && (
              <button
                onClick={handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 
                         text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         dark:focus:ring-offset-gray-800"
                aria-describedby="retry-description"
              >
                🔄 Try Again
              </button>
            )}

            {/* Secondary Actions */}
            <button
              onClick={handleNavigateBack}
              className="flex-1 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600
                       text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                       dark:focus:ring-offset-gray-800"
            >
              ← Back to Scheduler
            </button>

            {/* Advanced Recovery for Persistent Issues */}
            <button
              onClick={handleFullRefresh}
              className="flex-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600
                       text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                       dark:focus:ring-offset-gray-800"
              title="Clear all cached data and refresh the page"
            >
              🔃 Full Refresh
            </button>
          </div>

          {/* Contextual Help Text */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {errorDetails.type === 'validation' && (
              <p id="retry-description">
                💡 <strong>Tip:</strong> Check that all required fields are filled and the JSON payload is valid.
              </p>
            )}
            {errorDetails.type === 'service' && (
              <p>
                💡 <strong>Tip:</strong> Verify that the selected service is running and accessible.
              </p>
            )}
            {errorDetails.type === 'network' && (
              <p>
                💡 <strong>Tip:</strong> Check your internet connection or try again in a few moments.
              </p>
            )}
            {errorDetails.type === 'auth' && (
              <p>
                💡 <strong>Note:</strong> You may need to log in again or contact your administrator for access.
              </p>
            )}
          </div>
        </div>

        {/* Accessibility Information */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            If the problem persists, please contact your system administrator or 
            <a 
              href="/support" 
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              submit a support request
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}