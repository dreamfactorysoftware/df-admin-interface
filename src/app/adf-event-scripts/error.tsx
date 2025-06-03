'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { errorLogger } from '@/lib/error-logger';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary component for the event scripts section providing graceful error handling
 * with recovery options and user-friendly messaging. Implements React 19 error boundary
 * patterns with logging capabilities and retry mechanisms for script management operations
 * and code editor failures.
 */
export default function EventScriptsError({
  error,
  reset,
}: ErrorBoundaryProps) {
  const router = useRouter();

  useEffect(() => {
    // Log error to monitoring service for production error analysis
    errorLogger.logError(error, {
      context: 'event-scripts',
      section: 'adf-event-scripts',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      digest: error.digest,
    });
  }, [error]);

  // Determine error type and appropriate messaging
  const getErrorDetails = () => {
    const message = error.message.toLowerCase();
    
    // Paywall enforcement errors
    if (message.includes('paywall') || message.includes('premium') || message.includes('license')) {
      return {
        title: 'Premium Feature Required',
        description: 'Event Scripts functionality requires a premium DreamFactory license. Please upgrade your plan to access this feature.',
        type: 'paywall' as const,
        icon: <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden="true" />,
        actions: ['contact-admin', 'home']
      };
    }

    // Authentication failures
    if (message.includes('unauthorized') || message.includes('auth') || message.includes('session')) {
      return {
        title: 'Authentication Required',
        description: 'Your session has expired or you do not have permission to access Event Scripts. Please log in again.',
        type: 'auth' as const,
        icon: <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />,
        actions: ['login', 'home']
      };
    }

    // Script loading/saving failures
    if (message.includes('script') || message.includes('save') || message.includes('load')) {
      return {
        title: 'Script Operation Failed',
        description: 'There was an error loading or saving your script. This may be due to a temporary network issue or server problem.',
        type: 'script' as const,
        icon: <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />,
        actions: ['retry', 'back', 'home']
      };
    }

    // Code editor failures
    if (message.includes('editor') || message.includes('syntax') || message.includes('highlight')) {
      return {
        title: 'Code Editor Error',
        description: 'The code editor encountered an error. This may affect syntax highlighting or editing capabilities.',
        type: 'editor' as const,
        icon: <AlertTriangle className="h-8 w-8 text-orange-500" aria-hidden="true" />,
        actions: ['retry', 'back']
      };
    }

    // Generic script management errors
    return {
      title: 'Script Management Error',
      description: 'An unexpected error occurred while managing your event scripts. Please try again or contact support if the problem persists.',
      type: 'generic' as const,
      icon: <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />,
      actions: ['retry', 'back', 'home']
    };
  };

  const errorDetails = getErrorDetails();

  const handleAction = (action: string) => {
    switch (action) {
      case 'retry':
        reset();
        break;
      case 'back':
        router.back();
        break;
      case 'home':
        router.push('/');
        break;
      case 'login':
        router.push('/login');
        break;
      case 'contact-admin':
        // In a real app, this might open a support ticket modal
        router.push('/admin-settings');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Error Icon and Title */}
        <div className="flex items-center space-x-3 mb-4">
          {errorDetails.icon}
          <div>
            <h2 
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              id="error-title"
            >
              {errorDetails.title}
            </h2>
          </div>
        </div>

        {/* Error Description */}
        <div 
          className="text-sm text-gray-600 dark:text-gray-300 mb-6"
          id="error-description"
          role="status"
          aria-live="polite"
        >
          {errorDetails.description}
        </div>

        {/* Technical Details (Development/Debug) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-xs">
            <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded border font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
              {error.stack && `\n\nStack:\n${error.stack}`}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          {errorDetails.actions.includes('retry') && (
            <button
              onClick={() => handleAction('retry')}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              aria-describedby="error-description"
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Try Again
            </button>
          )}

          <div className="flex space-x-3">
            {errorDetails.actions.includes('back') && (
              <button
                onClick={() => handleAction('back')}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Go Back
              </button>
            )}

            {errorDetails.actions.includes('home') && (
              <button
                onClick={() => handleAction('home')}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                Home
              </button>
            )}
          </div>

          {errorDetails.actions.includes('login') && (
            <button
              onClick={() => handleAction('login')}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              Sign In
            </button>
          )}

          {errorDetails.actions.includes('contact-admin') && (
            <button
              onClick={() => handleAction('contact-admin')}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              Contact Administrator
            </button>
          )}
        </div>

        {/* Screen Reader Announcements */}
        <div 
          className="sr-only" 
          role="status" 
          aria-live="assertive"
          aria-atomic="true"
        >
          Error in Event Scripts: {errorDetails.title}. {errorDetails.description}
        </div>
      </div>
    </div>
  );
}