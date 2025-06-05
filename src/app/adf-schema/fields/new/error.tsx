'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js Error Boundary Component for Field Creation Page
 * 
 * Provides comprehensive error handling for the field creation workflow with:
 * - WCAG 2.1 AA compliant accessibility features
 * - Multiple recovery options and navigation alternatives
 * - Diagnostic information for debugging
 * - Consistent Tailwind CSS 4.1+ styling with theme support
 * - Manual retry mechanisms with graceful degradation
 */
export default function FieldCreationError({ error, reset }: ErrorProps) {
  const router = useRouter();

  // Log error for debugging and monitoring
  useEffect(() => {
    console.error('Field creation error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      path: '/adf-schema/fields/new'
    });
  }, [error]);

  // Handle manual retry with error boundary reset
  const handleRetry = useCallback(() => {
    try {
      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      // If reset fails, navigate to parent page
      router.back();
    }
  }, [reset, router]);

  // Navigate back to fields list
  const handleBackToFields = useCallback(() => {
    router.push('/adf-schema/fields');
  }, [router]);

  // Navigate to schema root
  const handleBackToSchema = useCallback(() => {
    router.push('/adf-schema');
  }, [router]);

  // Navigate to dashboard
  const handleBackToDashboard = useCallback(() => {
    router.push('/');
  }, [router]);

  // Determine error type for specialized messaging
  const getErrorType = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    }
    if (message.includes('validation') || message.includes('schema')) {
      return 'validation';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    return 'generic';
  };

  const errorType = getErrorType(error);

  // Error-specific messaging and recovery options
  const getErrorContent = (type: string) => {
    switch (type) {
      case 'network':
        return {
          title: 'Network Connection Error',
          description: 'Unable to connect to the database service. Please check your network connection and try again.',
          suggestions: [
            'Check your internet connection',
            'Verify the database service is running',
            'Contact your system administrator if the problem persists'
          ]
        };
      case 'permission':
        return {
          title: 'Access Permission Error',
          description: 'You do not have sufficient permissions to create fields in this schema.',
          suggestions: [
            'Contact your administrator to request field creation permissions',
            'Verify you are logged in with the correct account',
            'Check if your session has expired'
          ]
        };
      case 'validation':
        return {
          title: 'Schema Validation Error',
          description: 'There was an issue validating the field schema or configuration.',
          suggestions: [
            'Check the database schema is accessible',
            'Verify the table structure is valid',
            'Ensure required permissions are granted'
          ]
        };
      case 'timeout':
        return {
          title: 'Request Timeout Error',
          description: 'The field creation request timed out. This may be due to a slow network or server response.',
          suggestions: [
            'Try again with a faster network connection',
            'Check if the database server is responding',
            'Contact support if timeouts persist'
          ]
        };
      default:
        return {
          title: 'Field Creation Error',
          description: 'An unexpected error occurred while creating the field. Please try again or contact support.',
          suggestions: [
            'Try refreshing the page and attempting again',
            'Check the browser console for additional details',
            'Contact technical support if the issue persists'
          ]
        };
    }
  };

  const errorContent = getErrorContent(errorType);

  return (
    <div 
      className="min-h-[600px] flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900"
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-title"
      aria-describedby="error-description"
      data-testid="field-creation-error"
    >
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        {/* Error Icon and Title */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-shrink-0">
            <svg
              className="h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h1 
              id="error-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              {errorContent.title}
            </h1>
            <p 
              id="error-description"
              className="mt-2 text-lg text-gray-600 dark:text-gray-400"
            >
              {errorContent.description}
            </p>
          </div>
        </div>

        {/* Error Details Section */}
        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Error Details
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Troubleshooting Suggestions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Troubleshooting Steps
          </h2>
          <ul className="space-y-2" role="list">
            {errorContent.suggestions.map((suggestion, index) => (
              <li 
                key={index}
                className="flex items-start space-x-3"
              >
                <span 
                  className="flex-shrink-0 h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5"
                  aria-hidden="true"
                >
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {suggestion}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recovery Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recovery Options
          </h2>
          
          {/* Primary Recovery Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-describedby="retry-description"
            >
              <svg 
                className="h-5 w-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Try Again
            </button>
            
            <button
              onClick={handleBackToFields}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 focus:bg-gray-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-describedby="back-fields-description"
            >
              <svg 
                className="h-5 w-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Back to Fields
            </button>
          </div>

          {/* Secondary Navigation Options */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleBackToSchema}
              className="inline-flex items-center justify-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-md"
              aria-describedby="back-schema-description"
            >
              <svg 
                className="h-4 w-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
                />
              </svg>
              Schema Overview
            </button>
            
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center justify-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-md"
              aria-describedby="back-dashboard-description"
            >
              <svg 
                className="h-4 w-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              Dashboard
            </button>
          </div>
        </div>

        {/* Hidden descriptions for screen readers */}
        <div className="sr-only">
          <p id="retry-description">
            Attempts to retry the field creation operation that failed
          </p>
          <p id="back-fields-description">
            Navigate back to the fields list page to try a different approach
          </p>
          <p id="back-schema-description">
            Go to the schema overview page to review database structure
          </p>
          <p id="back-dashboard-description">
            Return to the main dashboard to access other features
          </p>
        </div>
      </div>
    </div>
  );
}