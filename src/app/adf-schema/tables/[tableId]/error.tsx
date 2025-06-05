'use client';

import React from 'react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertContent, AlertIcon } from '@/components/ui/alert';
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

/**
 * Error boundary props interface for Next.js app router error boundaries
 */
interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error classification for improved user messaging and recovery options
 */
interface ErrorClassification {
  type: 'network' | 'validation' | 'permission' | 'not-found' | 'server' | 'unknown';
  title: string;
  description: string;
  recoverable: boolean;
  suggested_actions: string[];
}

/**
 * Classifies errors for appropriate user messaging and recovery options
 * @param error - The error object to classify
 * @returns Classified error information for user-friendly display
 */
function classifyError(error: Error): ErrorClassification {
  const message = error.message.toLowerCase();
  
  // Network-related errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      type: 'network',
      title: 'Connection Problem',
      description: 'Unable to connect to the server. Please check your internet connection and try again.',
      recoverable: true,
      suggested_actions: [
        'Check your internet connection',
        'Retry the operation',
        'Refresh the page if the problem persists'
      ]
    };
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return {
      type: 'validation',
      title: 'Data Validation Error',
      description: 'The table data contains invalid or missing required information.',
      recoverable: true,
      suggested_actions: [
        'Check all required fields are filled',
        'Verify data formats are correct',
        'Contact support if validation rules are unclear'
      ]
    };
  }
  
  // Permission/authorization errors
  if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('permission')) {
    return {
      type: 'permission',
      title: 'Access Denied',
      description: 'You do not have permission to access or modify this table.',
      recoverable: false,
      suggested_actions: [
        'Contact your administrator for access',
        'Verify you are logged in with the correct account',
        'Return to the tables list'
      ]
    };
  }
  
  // Not found errors
  if (message.includes('not found') || message.includes('404')) {
    return {
      type: 'not-found',
      title: 'Table Not Found',
      description: 'The requested table could not be found or may have been deleted.',
      recoverable: false,
      suggested_actions: [
        'Check the table name is correct',
        'Verify the table still exists',
        'Return to the tables list to browse available tables'
      ]
    };
  }
  
  // Server errors
  if (message.includes('server') || message.includes('500') || message.includes('internal')) {
    return {
      type: 'server',
      title: 'Server Error',
      description: 'An unexpected server error occurred while processing your request.',
      recoverable: true,
      suggested_actions: [
        'Wait a moment and try again',
        'Check server status',
        'Contact support if the problem persists'
      ]
    };
  }
  
  // Unknown/generic errors
  return {
    type: 'unknown',
    title: 'Unexpected Error',
    description: 'An unexpected error occurred while loading the table details.',
    recoverable: true,
    suggested_actions: [
      'Try refreshing the page',
      'Check your connection',
      'Contact support if the problem persists'
    ]
  };
}

/**
 * Logs error details for debugging and monitoring purposes
 * @param error - The error to log
 * @param context - Additional context information
 */
function logError(error: Error, context: { page: string; user_action?: string }) {
  // Enhanced error logging for debugging and monitoring
  const errorDetails = {
    timestamp: new Date().toISOString(),
    error_type: error.name,
    error_message: error.message,
    error_stack: error.stack,
    digest: (error as any).digest,
    page_context: context.page,
    user_action: context.user_action,
    user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
    url: typeof window !== 'undefined' ? window.location.href : 'SSR'
  };
  
  // Log to console in development, would integrate with monitoring service in production
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Table Details Error:', errorDetails);
  }
  
  // In production, this would send to monitoring service (e.g., Sentry, DataDog)
  // Example: monitoringService.captureError(errorDetails);
}

/**
 * Next.js error boundary component for table details functionality
 * Provides graceful error handling and recovery options with user-friendly messaging
 */
export default function TableDetailsError({ error, reset }: ErrorBoundaryProps) {
  const classification = classifyError(error);
  
  useEffect(() => {
    // Log error for debugging and monitoring
    logError(error, {
      page: 'table-details',
      user_action: 'page_load_or_interaction'
    });
  }, [error]);
  
  /**
   * Handles retry action with loading state management
   */
  const handleRetry = () => {
    logError(error, {
      page: 'table-details',
      user_action: 'retry_attempted'
    });
    reset();
  };
  
  /**
   * Navigates back to tables list
   */
  const handleGoToTables = () => {
    window.location.href = '/adf-schema/tables';
  };
  
  /**
   * Navigates to home page
   */
  const handleGoHome = () => {
    window.location.href = '/';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          {/* Error Icon */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <ExclamationTriangleIcon 
                className="w-8 h-8 text-red-600 dark:text-red-400" 
                aria-hidden="true"
              />
            </div>
          </div>
          
          {/* Error Content */}
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {classification.title}
              </h1>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                {classification.description}
              </p>
            </div>
            
            {/* Error Details Alert */}
            <div className="mt-6">
              <Alert variant="error" className="max-w-lg">
                <AlertIcon />
                <AlertContent>
                  <div className="space-y-2">
                    <p className="font-medium">What happened?</p>
                    <p className="text-sm">{error.message}</p>
                    {error.digest && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Error ID: {error.digest}
                      </p>
                    )}
                  </div>
                </AlertContent>
              </Alert>
            </div>
            
            {/* Suggested Actions */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Suggested Actions
              </h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {classification.suggested_actions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 text-gray-400 mr-2">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {classification.recoverable && (
                <Button
                  onClick={handleRetry}
                  variant="primary"
                  className="inline-flex items-center gap-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Try Again
                </Button>
              )}
              
              <Button
                onClick={handleGoToTables}
                variant="secondary"
                className="inline-flex items-center gap-2"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Browse Tables
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="inline-flex items-center gap-2"
              >
                <HomeIcon className="w-4 h-4" />
                Go Home
              </Button>
            </div>
            
            {/* Technical Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                  Technical Details (Development Only)
                </summary>
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-2">
                  <div>
                    <strong>Error Type:</strong> {error.name}
                  </div>
                  <div>
                    <strong>Message:</strong> {error.message}
                  </div>
                  {error.digest && (
                    <div>
                      <strong>Digest:</strong> {error.digest}
                    </div>
                  )}
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">{error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            {/* Help Section */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                If this error persists, please contact your system administrator or 
                check the DreamFactory documentation for troubleshooting guidance.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}