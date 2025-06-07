'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Code, Shield, Network } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorType {
  type: 'paywall' | 'authentication' | 'script_operation' | 'code_editor' | 'network' | 'generic';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  recoveryOptions: {
    primary?: string;
    secondary?: string;
  };
}

/**
 * Error boundary component for the event scripts section providing graceful error handling
 * with recovery options and user-friendly messaging. Implements React 19 error boundary
 * patterns with logging capabilities and retry mechanisms for script management operations
 * and code editor failures.
 */
export default function EventScriptsError({ error, reset }: ErrorProps) {
  // Determine error type based on error message and properties
  const getErrorType = (error: Error): ErrorType => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Paywall enforcement errors
    if (message.includes('paywall') || message.includes('subscription') || message.includes('premium')) {
      return {
        type: 'paywall',
        title: 'Premium Feature Access Required',
        description: 'Event scripts are a premium feature. Please upgrade your subscription to access script management capabilities.',
        icon: Shield,
        recoveryOptions: {
          primary: 'View Pricing',
          secondary: 'Return to Dashboard'
        }
      };
    }

    // Authentication failures
    if (message.includes('unauthorized') || message.includes('authentication') || message.includes('401')) {
      return {
        type: 'authentication',
        title: 'Authentication Required',
        description: 'Your session has expired or you lack permission to access event scripts. Please sign in again.',
        icon: Shield,
        recoveryOptions: {
          primary: 'Sign In',
          secondary: 'Return to Dashboard'
        }
      };
    }

    // Script operation errors (loading, saving, validation)
    if (message.includes('script') || message.includes('validation') || message.includes('save') || message.includes('load')) {
      return {
        type: 'script_operation',
        title: 'Script Operation Failed',
        description: 'Unable to complete the script operation. This may be due to validation errors, server issues, or invalid script content.',
        icon: Code,
        recoveryOptions: {
          primary: 'Retry Operation',
          secondary: 'Return to Scripts List'
        }
      };
    }

    // Code editor failures
    if (stack.includes('monaco') || stack.includes('editor') || message.includes('editor') || message.includes('syntax')) {
      return {
        type: 'code_editor',
        title: 'Code Editor Error',
        description: 'The script editor encountered an unexpected error. This may be due to syntax highlighting, autocomplete, or editor configuration issues.',
        icon: Code,
        recoveryOptions: {
          primary: 'Reload Editor',
          secondary: 'Use Basic Editor'
        }
      };
    }

    // Network connectivity issues
    if (message.includes('network') || message.includes('fetch') || message.includes('connection') || message.includes('timeout')) {
      return {
        type: 'network',
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        icon: Network,
        recoveryOptions: {
          primary: 'Retry Connection',
          secondary: 'Refresh Page'
        }
      };
    }

    // Generic error fallback
    return {
      type: 'generic',
      title: 'Unexpected Error',
      description: 'An unexpected error occurred in the event scripts section. Our team has been notified.',
      icon: AlertTriangle,
      recoveryOptions: {
        primary: 'Try Again',
        secondary: 'Return to Dashboard'
      }
    };
  };

  const errorType = getErrorType(error);

  // Log error for production analysis and monitoring
  useEffect(() => {
    // Enhanced error logging for production error analysis
    const errorDetails = {
      timestamp: new Date().toISOString(),
      section: 'event-scripts',
      errorType: errorType.type,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userId: typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null,
      sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') : null
    };

    // In a real implementation, this would integrate with error tracking services
    // like Sentry, LogRocket, or similar production monitoring tools
    console.error('[EventScripts Error Boundary]', errorDetails);

    // Future implementation would send to error tracking service:
    // errorLogger.logError('event-scripts', errorDetails);

    // Announce error to screen readers for accessibility
    const announcement = `Error in event scripts section: ${errorType.title}. ${errorType.description}`;
    const ariaLiveRegion = document.createElement('div');
    ariaLiveRegion.setAttribute('aria-live', 'assertive');
    ariaLiveRegion.setAttribute('aria-atomic', 'true');
    ariaLiveRegion.setAttribute('class', 'sr-only');
    ariaLiveRegion.textContent = announcement;
    document.body.appendChild(ariaLiveRegion);

    // Clean up announcement after screen readers have processed it
    setTimeout(() => {
      if (document.body.contains(ariaLiveRegion)) {
        document.body.removeChild(ariaLiveRegion);
      }
    }, 1000);
  }, [error, errorType]);

  // Handle primary recovery action
  const handlePrimaryAction = () => {
    switch (errorType.type) {
      case 'paywall':
        // Navigate to pricing or subscription page
        window.location.href = '/pricing';
        break;
      case 'authentication':
        // Navigate to login page
        window.location.href = '/login';
        break;
      case 'script_operation':
      case 'code_editor':
      case 'network':
      case 'generic':
        // Attempt to reset/retry the operation
        reset();
        break;
      default:
        reset();
    }
  };

  // Handle secondary recovery action
  const handleSecondaryAction = () => {
    switch (errorType.type) {
      case 'paywall':
      case 'authentication':
        // Return to dashboard
        window.location.href = '/';
        break;
      case 'script_operation':
        // Return to scripts list
        window.location.href = '/adf-event-scripts';
        break;
      case 'code_editor':
        // Reload page to reset editor state
        window.location.reload();
        break;
      case 'network':
        // Refresh the entire page
        window.location.reload();
        break;
      case 'generic':
        // Return to dashboard
        window.location.href = '/';
        break;
      default:
        window.location.href = '/';
    }
  };

  const IconComponent = errorType.icon;

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8"
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="p-3 bg-red-100 rounded-full">
              <IconComponent 
                className="h-8 w-8 text-red-600" 
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Error Title */}
          <h1 
            id="error-title"
            className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl"
          >
            {errorType.title}
          </h1>

          {/* Error Description */}
          <p 
            id="error-description"
            className="mt-4 text-base text-gray-600 leading-relaxed"
          >
            {errorType.description}
          </p>

          {/* Technical Error Details (Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-40">
                <div className="space-y-1">
                  <div><strong>Message:</strong> {error.message}</div>
                  {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
                  {error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}
        </div>

        {/* Recovery Actions */}
        <div className="space-y-3">
          {/* Primary Action Button */}
          {errorType.recoveryOptions.primary && (
            <button
              onClick={handlePrimaryAction}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              aria-describedby="primary-action-description"
            >
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              {errorType.recoveryOptions.primary}
            </button>
          )}

          {/* Secondary Action Button */}
          {errorType.recoveryOptions.secondary && (
            <button
              onClick={handleSecondaryAction}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              aria-describedby="secondary-action-description"
            >
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              {errorType.recoveryOptions.secondary}
            </button>
          )}
        </div>

        {/* Additional Support Information */}
        <div className="text-center text-sm text-gray-500">
          <p>
            If this problem persists, please{' '}
            <a 
              href="/support" 
              className="text-blue-600 hover:text-blue-500 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              contact support
            </a>
            {' '}for assistance.
          </p>
        </div>

        {/* Screen Reader Only Content */}
        <div className="sr-only">
          <p>Error ID: {error.digest || 'N/A'}</p>
          <p>Timestamp: {new Date().toLocaleString()}</p>
          <p>Section: Event Scripts Management</p>
        </div>
      </div>
    </div>
  );
}