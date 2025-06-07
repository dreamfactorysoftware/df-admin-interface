'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, ArrowLeft, Bug, Network, Lock, FileQuestion } from 'lucide-react';

/**
 * Error boundary component for the edit limit page
 * Handles and displays errors in the limit editing workflow with comprehensive error categorization
 * and recovery actions per Section 4.2 error handling requirements
 */
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EditLimitError({ error, reset }: ErrorProps) {
  const router = useRouter();

  // Error categorization based on HTTP status codes and error types
  const getErrorCategory = useCallback((error: Error) => {
    const errorMessage = error.message.toLowerCase();
    const errorDigest = error.digest;

    // Check for HTTP status codes in error message or digest
    if (errorMessage.includes('404') || errorMessage.includes('not found') || errorDigest?.includes('404')) {
      return {
        type: 'not_found',
        status: 404,
        title: 'Limit Not Found',
        message: 'The requested limit configuration could not be found. It may have been deleted or the ID is invalid.',
        icon: FileQuestion,
        primaryAction: 'Return to Limits List',
        canRetry: false
      };
    }

    if (errorMessage.includes('403') || errorMessage.includes('forbidden') || errorMessage.includes('unauthorized') || errorDigest?.includes('403')) {
      return {
        type: 'access_denied',
        status: 403,
        title: 'Access Denied',
        message: 'You do not have permission to edit this limit configuration. Please contact your administrator for access.',
        icon: Lock,
        primaryAction: 'Return to Limits List',
        canRetry: false
      };
    }

    if (errorMessage.includes('401') || errorMessage.includes('unauthenticated')) {
      return {
        type: 'authentication',
        status: 401,
        title: 'Authentication Required',
        message: 'Your session has expired. Please log in again to continue editing this limit.',
        icon: Lock,
        primaryAction: 'Log In',
        canRetry: false
      };
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return {
        type: 'network',
        status: 0,
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        icon: Network,
        primaryAction: 'Retry',
        canRetry: true
      };
    }

    if (errorMessage.includes('500') || errorMessage.includes('internal server') || errorDigest?.includes('500')) {
      return {
        type: 'server_error',
        status: 500,
        title: 'Server Error',
        message: 'An unexpected server error occurred while loading the limit configuration. Our team has been notified.',
        icon: AlertTriangle,
        primaryAction: 'Retry',
        canRetry: true
      };
    }

    // Default to generic error
    return {
      type: 'generic',
      status: 0,
      title: 'Unexpected Error',
      message: 'An unexpected error occurred while loading the limit editor. Please try again or contact support if the problem persists.',
      icon: Bug,
      primaryAction: 'Retry',
      canRetry: true
    };
  }, []);

  // Error reporting for monitoring and observability per Section 6.5
  useEffect(() => {
    const errorDetails = getErrorCategory(error);
    
    // Report error to monitoring service (placeholder for actual implementation)
    const reportError = async () => {
      try {
        // In a real implementation, this would integrate with monitoring services like Sentry, LogRocket, etc.
        console.error('Edit Limit Error:', {
          errorType: errorDetails.type,
          status: errorDetails.status,
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });

        // Placeholder for actual error reporting API call
        // await fetch('/api/monitoring/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     component: 'edit-limit-error-boundary',
        //     error: errorDetails,
        //     context: { url: window.location.href }
        //   })
        // });
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    };

    reportError();
  }, [error, getErrorCategory]);

  const errorDetails = getErrorCategory(error);
  const IconComponent = errorDetails.icon;

  // Recovery action handlers
  const handlePrimaryAction = useCallback(() => {
    switch (errorDetails.type) {
      case 'authentication':
        // Redirect to login page
        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
        break;
      case 'not_found':
      case 'access_denied':
        // Navigate back to limits list
        router.push('/api-security/limits');
        break;
      case 'network':
      case 'server_error':
      case 'generic':
        // Attempt to retry the operation
        reset();
        break;
      default:
        router.push('/api-security/limits');
    }
  }, [errorDetails.type, router, reset]);

  const handleSecondaryAction = useCallback(() => {
    // Always provide option to return to limits list
    router.push('/api-security/limits');
  }, [router]);

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md">
        {/* Error Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6">
          {/* Error Icon and Status */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
            <IconComponent 
              className="w-8 h-8 text-red-600 dark:text-red-400" 
              aria-hidden="true"
            />
          </div>

          {/* Error Title */}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
            {errorDetails.title}
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
            {errorDetails.message}
          </p>

          {/* Status Code Badge (if applicable) */}
          {errorDetails.status > 0 && (
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200">
                Error {errorDetails.status}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Action Button */}
            <button
              onClick={handlePrimaryAction}
              className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-label={`${errorDetails.primaryAction} - primary recovery action`}
            >
              {errorDetails.canRetry ? (
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              ) : errorDetails.type === 'authentication' ? (
                <Lock className="w-4 h-4 mr-2" aria-hidden="true" />
              ) : (
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              )}
              {errorDetails.primaryAction}
            </button>

            {/* Secondary Action Button - Always show option to return to list */}
            {errorDetails.type !== 'not_found' && errorDetails.type !== 'access_denied' && (
              <button
                onClick={handleSecondaryAction}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 focus:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label="Return to limits list - secondary recovery action"
              >
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                Return to Limits List
              </button>
            )}
          </div>
        </div>

        {/* Additional Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If this problem persists, please contact your system administrator.
          </p>
          
          {/* Error ID for support (when available) */}
          {error.digest && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Accessibility Instructions */}
        <div className="sr-only">
          An error occurred while loading the limit editor. 
          Use the primary action button to {errorDetails.canRetry ? 'retry the operation' : 'navigate away from this error'}. 
          Additional recovery options may be available below the primary action.
          {error.digest && ` Error reference ID: ${error.digest}`}
        </div>
      </div>
    </div>
  );
}

// Type definitions for error categorization
interface ErrorCategory {
  type: 'not_found' | 'access_denied' | 'authentication' | 'network' | 'server_error' | 'generic';
  status: number;
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryAction: string;
  canRetry: boolean;
}