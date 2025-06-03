'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Database, 
  Shield, 
  Wifi, 
  FileX,
  Bug,
  Settings,
  Home
} from 'lucide-react';

/**
 * Error boundary component for the service editing page that handles and displays 
 * user-friendly error messages when service modification workflows fail.
 * 
 * Implements React 19 error boundary patterns with fallback UI and recovery actions
 * for common failure scenarios like network errors, validation failures, 
 * authentication issues, and service not found errors.
 * 
 * Features:
 * - Dynamic route error handling with serviceId parameter validation
 * - Context-aware error messaging based on error type
 * - Retry mechanisms with exponential backoff
 * - Navigation options and recovery actions
 * - Accessibility compliant error display (WCAG 2.1 AA)
 * - Error logging integration for monitoring
 * - Dark mode support with Tailwind CSS
 */
export default function ServiceEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string; statusCode?: number };
  reset: () => void;
}) {
  const router = useRouter();
  const params = useParams();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorLogged, setErrorLogged] = useState(false);

  const serviceId = params?.serviceId as string;
  const maxRetries = 3;

  // Error type detection based on error properties
  const getErrorType = () => {
    const message = error.message?.toLowerCase() || '';
    const statusCode = error.statusCode;

    if (statusCode === 404 || message.includes('not found') || message.includes('service not found')) {
      return 'NOT_FOUND';
    }
    if (statusCode === 401 || message.includes('unauthorized') || message.includes('authentication')) {
      return 'AUTHENTICATION';
    }
    if (statusCode === 403 || message.includes('forbidden') || message.includes('access denied')) {
      return 'AUTHORIZATION';
    }
    if (statusCode === 422 || message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'NETWORK';
    }
    if (statusCode && statusCode >= 500) {
      return 'SERVER';
    }
    return 'UNKNOWN';
  };

  const errorType = getErrorType();

  // Log error for monitoring and debugging
  useEffect(() => {
    if (!errorLogged) {
      // Error logging implementation would integrate with logging service
      console.error('Service editing error:', {
        error: error.message,
        stack: error.stack,
        digest: error.digest,
        statusCode: error.statusCode,
        serviceId,
        errorType,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Mark as logged to prevent duplicate logging
      setErrorLogged(true);

      // TODO: Integrate with actual logging service
      // logError({
      //   message: error.message,
      //   stack: error.stack,
      //   context: {
      //     serviceId,
      //     errorType,
      //     retryCount,
      //     digest: error.digest
      //   }
      // });
    }
  }, [error, errorLogged, serviceId, errorType, retryCount]);

  // Error-specific configuration
  const getErrorConfig = () => {
    switch (errorType) {
      case 'NOT_FOUND':
        return {
          icon: FileX,
          title: 'Service Not Found',
          message: serviceId 
            ? `The database service "${serviceId}" could not be found. It may have been deleted or you may not have access to it.`
            : 'The requested database service could not be found.',
          primaryAction: {
            label: 'Go to Services',
            action: () => router.push('/adf-services'),
            icon: Database
          },
          secondaryAction: {
            label: 'Back to Dashboard',
            action: () => router.push('/'),
            icon: Home
          },
          canRetry: false,
          severity: 'warning'
        };

      case 'AUTHENTICATION':
        return {
          icon: Shield,
          title: 'Authentication Required',
          message: 'Your session has expired or you need to log in to access this service.',
          primaryAction: {
            label: 'Log In',
            action: () => router.push('/login?redirect=' + encodeURIComponent(window.location.pathname)),
            icon: Shield
          },
          secondaryAction: {
            label: 'Go to Dashboard',
            action: () => router.push('/'),
            icon: Home
          },
          canRetry: false,
          severity: 'error'
        };

      case 'AUTHORIZATION':
        return {
          icon: Shield,
          title: 'Access Denied',
          message: 'You do not have permission to edit this database service. Please contact your administrator if you believe this is an error.',
          primaryAction: {
            label: 'Go to Services',
            action: () => router.push('/adf-services'),
            icon: Database
          },
          secondaryAction: {
            label: 'Contact Support',
            action: () => window.open('/help/contact', '_blank'),
            icon: Settings
          },
          canRetry: false,
          severity: 'error'
        };

      case 'VALIDATION':
        return {
          icon: AlertTriangle,
          title: 'Validation Error',
          message: 'There was a problem with the service configuration. Please check your settings and try again.',
          primaryAction: {
            label: 'Retry',
            action: handleRetry,
            icon: RefreshCw
          },
          secondaryAction: {
            label: 'Go Back',
            action: () => router.back(),
            icon: ArrowLeft
          },
          canRetry: true,
          severity: 'warning'
        };

      case 'NETWORK':
        return {
          icon: Wifi,
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          primaryAction: {
            label: 'Retry',
            action: handleRetry,
            icon: RefreshCw
          },
          secondaryAction: {
            label: 'Go Back',
            action: () => router.back(),
            icon: ArrowLeft
          },
          canRetry: true,
          severity: 'error'
        };

      case 'SERVER':
        return {
          icon: Bug,
          title: 'Server Error',
          message: 'An unexpected server error occurred while processing your request. Our team has been notified.',
          primaryAction: {
            label: 'Retry',
            action: handleRetry,
            icon: RefreshCw
          },
          secondaryAction: {
            label: 'Go to Services',
            action: () => router.push('/adf-services'),
            icon: Database
          },
          canRetry: true,
          severity: 'error'
        };

      default:
        return {
          icon: AlertTriangle,
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred while editing the service. Please try again or contact support if the problem persists.',
          primaryAction: {
            label: 'Retry',
            action: handleRetry,
            icon: RefreshCw
          },
          secondaryAction: {
            label: 'Go Back',
            action: () => router.back(),
            icon: ArrowLeft
          },
          canRetry: true,
          severity: 'error'
        };
    }
  };

  // Handle retry with exponential backoff
  async function handleRetry() {
    if (retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  }

  const config = getErrorConfig();
  const IconComponent = config.icon;

  return (
    <div 
      className="min-h-[600px] flex items-center justify-center p-6"
      data-testid="service-edit-error"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className={`
            p-3 rounded-full
            ${config.severity === 'error' 
              ? 'bg-red-100 dark:bg-red-900/20' 
              : 'bg-amber-100 dark:bg-amber-900/20'
            }
          `}>
            <IconComponent 
              className={`
                h-8 w-8
                ${config.severity === 'error' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-amber-600 dark:text-amber-400'
                }
              `}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {config.title}
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          {config.message}
        </p>

        {/* Service ID Context */}
        {serviceId && errorType !== 'NOT_FOUND' && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-xs">
            <span className="text-gray-500 dark:text-gray-400">Service ID: </span>
            <span className="font-mono text-gray-700 dark:text-gray-300">{serviceId}</span>
          </div>
        )}

        {/* Error Details for Development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
              Debug Information
            </summary>
            <pre className="text-xs text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap font-mono">
              {error.stack || error.message}
            </pre>
            {error.digest && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </details>
        )}

        {/* Retry Count Display */}
        {config.canRetry && retryCount > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Retry attempt {retryCount} of {maxRetries}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Action */}
          <button
            onClick={config.primaryAction.action}
            disabled={isRetrying || (config.canRetry && retryCount >= maxRetries)}
            className={`
              w-full inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${config.severity === 'error'
                ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
              }
              dark:bg-opacity-90 dark:hover:bg-opacity-100
            `}
            aria-describedby={isRetrying ? 'retry-status' : undefined}
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Retrying...
              </>
            ) : (
              <>
                <config.primaryAction.icon className="h-4 w-4 mr-2" aria-hidden="true" />
                {config.primaryAction.label}
              </>
            )}
          </button>

          {/* Secondary Action */}
          <button
            onClick={config.secondaryAction.action}
            disabled={isRetrying}
            className="
              w-full inline-flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium
              bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
              disabled:opacity-50 disabled:cursor-not-allowed
              dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300
            "
          >
            <config.secondaryAction.icon className="h-4 w-4 mr-2" aria-hidden="true" />
            {config.secondaryAction.label}
          </button>
        </div>

        {/* Retry Status for Screen Readers */}
        {isRetrying && (
          <div id="retry-status" className="sr-only">
            Retrying operation, please wait...
          </div>
        )}

        {/* Max Retries Reached Message */}
        {config.canRetry && retryCount >= maxRetries && (
          <div className="text-xs text-red-600 dark:text-red-400">
            Maximum retry attempts reached. Please try again later or contact support.
          </div>
        )}
      </div>
    </div>
  );
}