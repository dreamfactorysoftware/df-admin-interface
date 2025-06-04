'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  Ban, 
  ServerCrash, 
  RefreshCw, 
  ArrowLeft, 
  Shield,
  Bug,
  Home
} from 'lucide-react';

// Error types for categorization
type ErrorType = 'not-found' | 'forbidden' | 'server-error' | 'network-error' | 'validation-error' | 'unknown';

interface ErrorInfo {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  variant: 'error' | 'warning' | 'destructive';
  recoveryActions: {
    label: string;
    action: () => void;
    variant: 'primary' | 'secondary' | 'outline';
    icon?: React.ComponentType<any>;
  }[];
}

interface LimitEditErrorProps {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}

/**
 * Error boundary component for the edit limit page that handles and displays errors
 * in the limit editing workflow. Provides user-friendly error messages for invalid 
 * limit IDs, data fetching failures, form submission errors, and provides recovery 
 * actions including navigation back to the limits list and retry mechanisms.
 * 
 * Implements Next.js 15.1+ error boundary patterns with comprehensive error handling
 * per Section 4.2 error handling requirements.
 */
export default function LimitEditError({ error, reset }: LimitEditErrorProps) {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Log error for monitoring and observability per Section 6.5 requirements
  useEffect(() => {
    const logError = async () => {
      try {
        // Enhanced error context for debugging and monitoring
        const errorContext = {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            digest: error.digest,
            status: error.status,
          },
          route: '/api-security/limits/[id]',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          retryCount,
          sessionId: document.cookie.match(/session-id=([^;]+)/)?.[1] || 'unknown',
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Limit Edit Error:', errorContext);
        }

        // In production, this would integrate with monitoring services
        // such as Sentry, DataDog, or AWS CloudWatch
        if (process.env.NODE_ENV === 'production') {
          // Example error reporting integration
          // await reportError(errorContext);
        }
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    };

    logError();
  }, [error, retryCount]);

  /**
   * Categorize error type based on error properties and HTTP status codes
   * per HTTP standards and REST API error handling patterns
   */
  const getErrorType = (): ErrorType => {
    // Check HTTP status codes first
    if (error.status === 404) return 'not-found';
    if (error.status === 403) return 'forbidden';
    if (error.status >= 500) return 'server-error';
    if (error.status >= 400 && error.status < 500) return 'validation-error';

    // Check error message patterns for client-side errors
    const message = error.message.toLowerCase();
    if (message.includes('not found') || message.includes('404')) return 'not-found';
    if (message.includes('forbidden') || message.includes('unauthorized') || message.includes('403')) return 'forbidden';
    if (message.includes('network') || message.includes('fetch')) return 'network-error';
    if (message.includes('validation') || message.includes('invalid')) return 'validation-error';
    if (message.includes('server') || message.includes('500')) return 'server-error';

    return 'unknown';
  };

  /**
   * Handle retry with exponential backoff pattern
   * Implements retry mechanisms per Section 4.2 error handling
   */
  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Add exponential backoff delay for subsequent retries
      if (retryCount > 0) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Max 5 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Navigate back to limits list with proper route handling
   * Implements user-friendly error recovery per Section 7.6 user interactions
   */
  const handleBackToList = () => {
    router.push('/api-security/limits');
  };

  /**
   * Navigate to dashboard home
   */
  const handleGoHome = () => {
    router.push('/');
  };

  /**
   * Get error information based on error type for user-friendly display
   * Implements comprehensive error categorization per requirements
   */
  const getErrorInfo = (): ErrorInfo => {
    const errorType = getErrorType();

    switch (errorType) {
      case 'not-found':
        return {
          title: 'Limit Not Found',
          description: 'The requested limit could not be found. It may have been deleted or the ID is invalid.',
          icon: AlertTriangle,
          variant: 'warning',
          recoveryActions: [
            {
              label: 'Back to Limits List',
              action: handleBackToList,
              variant: 'primary',
              icon: ArrowLeft,
            },
            {
              label: 'Go to Dashboard',
              action: handleGoHome,
              variant: 'outline',
              icon: Home,
            },
          ],
        };

      case 'forbidden':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to edit this limit. Please contact your administrator if you need access.',
          icon: Ban,
          variant: 'error',
          recoveryActions: [
            {
              label: 'Back to Limits List',
              action: handleBackToList,
              variant: 'primary',
              icon: ArrowLeft,
            },
            {
              label: 'Go to Dashboard',
              action: handleGoHome,
              variant: 'outline',
              icon: Home,
            },
          ],
        };

      case 'server-error':
        return {
          title: 'Server Error',
          description: 'A server error occurred while loading the limit. Please try again in a few moments.',
          icon: ServerCrash,
          variant: 'error',
          recoveryActions: [
            {
              label: isRetrying ? 'Retrying...' : `Retry ${retryCount > 0 ? `(${retryCount + 1})` : ''}`,
              action: handleRetry,
              variant: 'primary',
              icon: RefreshCw,
            },
            {
              label: 'Back to Limits List',
              action: handleBackToList,
              variant: 'secondary',
              icon: ArrowLeft,
            },
          ],
        };

      case 'network-error':
        return {
          title: 'Connection Error',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
          icon: AlertTriangle,
          variant: 'warning',
          recoveryActions: [
            {
              label: isRetrying ? 'Retrying...' : `Retry ${retryCount > 0 ? `(${retryCount + 1})` : ''}`,
              action: handleRetry,
              variant: 'primary',
              icon: RefreshCw,
            },
            {
              label: 'Back to Limits List',
              action: handleBackToList,
              variant: 'secondary',
              icon: ArrowLeft,
            },
          ],
        };

      case 'validation-error':
        return {
          title: 'Validation Error',
          description: 'The limit data is invalid or corrupted. Please try accessing the limit again.',
          icon: AlertTriangle,
          variant: 'warning',
          recoveryActions: [
            {
              label: 'Try Again',
              action: handleRetry,
              variant: 'primary',
              icon: RefreshCw,
            },
            {
              label: 'Back to Limits List',
              action: handleBackToList,
              variant: 'secondary',
              icon: ArrowLeft,
            },
          ],
        };

      default:
        return {
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred while loading the limit. Please try again or contact support if the problem persists.',
          icon: Bug,
          variant: 'error',
          recoveryActions: [
            {
              label: isRetrying ? 'Retrying...' : `Retry ${retryCount > 0 ? `(${retryCount + 1})` : ''}`,
              action: handleRetry,
              variant: 'primary',
              icon: RefreshCw,
            },
            {
              label: 'Back to Limits List',
              action: handleBackToList,
              variant: 'secondary',
              icon: ArrowLeft,
            },
            {
              label: 'Go to Dashboard',
              action: handleGoHome,
              variant: 'outline',
              icon: Home,
            },
          ],
        };
    }
  };

  const errorInfo = getErrorInfo();
  const IconComponent = errorInfo.icon;

  // Variant-specific styling for WCAG 2.1 AA compliance
  const getVariantStyles = () => {
    switch (errorInfo.variant) {
      case 'error':
        return {
          container: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
          description: 'text-red-700 dark:text-red-200',
        };
      case 'warning':
        return {
          container: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20',
          icon: 'text-amber-600 dark:text-amber-400',
          title: 'text-amber-900 dark:text-amber-100',
          description: 'text-amber-700 dark:text-amber-200',
        };
      case 'destructive':
        return {
          container: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
          description: 'text-red-700 dark:text-red-200',
        };
      default:
        return {
          container: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
          icon: 'text-gray-600 dark:text-gray-400',
          title: 'text-gray-900 dark:text-gray-100',
          description: 'text-gray-700 dark:text-gray-300',
        };
    }
  };

  const styles = getVariantStyles();

  // Button variant styling for accessibility and consistency
  const getButtonStyles = (variant: 'primary' | 'secondary' | 'outline') => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-w-[100px] h-10 px-4 py-2';
    
    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700`;
      case 'secondary':
        return `${baseStyles} bg-secondary-100 text-secondary-900 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-100 dark:hover:bg-secondary-700`;
      case 'outline':
        return `${baseStyles} border border-input bg-background hover:bg-accent hover:text-accent-foreground`;
      default:
        return baseStyles;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl mx-auto">
        {/* Main Error Card */}
        <div 
          className={`rounded-lg border p-8 ${styles.container}`}
          role="alert"
          aria-live="assertive"
          aria-labelledby="error-title"
          aria-describedby="error-description"
        >
          {/* Header with Icon and Title */}
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 p-2 rounded-full bg-white dark:bg-gray-900 ${styles.icon}`}>
              <IconComponent 
                className="h-8 w-8"
                aria-hidden="true"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 
                id="error-title"
                className={`text-xl font-semibold ${styles.title}`}
              >
                {errorInfo.title}
              </h1>
              
              <p 
                id="error-description"
                className={`mt-2 text-sm leading-relaxed ${styles.description}`}
              >
                {errorInfo.description}
              </p>

              {/* Error Details for Development */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className={`cursor-pointer text-xs font-mono ${styles.description} hover:opacity-75`}>
                    Technical Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-auto">
                    <div><strong>Error:</strong> {error.name}</div>
                    <div><strong>Message:</strong> {error.message}</div>
                    {error.status && <div><strong>Status:</strong> {error.status}</div>}
                    {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
                    {error.stack && (
                      <div className="mt-2">
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>

          {/* Recovery Actions */}
          <div className="mt-8">
            <h2 className="sr-only">Recovery Actions</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              {errorInfo.recoveryActions.map((action, index) => {
                const ActionIcon = action.icon;
                const isDisabled = action.label.includes('Retrying') || isRetrying;
                
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    disabled={isDisabled}
                    className={getButtonStyles(action.variant)}
                    aria-label={`${action.label}${isDisabled ? ' - Please wait' : ''}`}
                  >
                    {ActionIcon && (
                      <ActionIcon 
                        className={`mr-2 h-4 w-4 ${isRetrying && action.icon === RefreshCw ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                      />
                    )}
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Additional Context */}
          <div className="mt-6 pt-6 border-t border-current/10">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-3 w-3" aria-hidden="true" />
                <span>API Security - Rate Limits</span>
              </div>
              {retryCount > 0 && (
                <span>
                  Retry attempts: {retryCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Screen Reader Instructions */}
        <div className="sr-only" aria-live="polite">
          Error occurred on the limit editing page. Use the provided buttons to retry loading the limit, 
          navigate back to the limits list, or go to the dashboard home page. 
          {retryCount > 0 && `You have attempted to retry ${retryCount} time${retryCount > 1 ? 's' : ''}.`}
        </div>
      </div>
    </div>
  );
}