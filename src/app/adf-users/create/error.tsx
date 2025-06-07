'use client';

/**
 * Error Boundary Component for User Creation Route
 * 
 * Implements React 19 error boundary patterns with Next.js app router conventions
 * for comprehensive error handling during user creation workflows. Provides
 * accessible, user-friendly error UI with recovery options and contextual messaging.
 * 
 * Features:
 * - React 19 error boundary capabilities with comprehensive error capture
 * - Next.js app router error.tsx conventions for route-level error handling
 * - WCAG 2.1 AA compliant error messaging and recovery interfaces
 * - Contextual error handling for form validation, network, and API errors
 * - Retry mechanisms for transient errors with exponential backoff
 * - Error logging and monitoring integration for production analysis
 * - Tailwind CSS responsive design with theme-aware styling
 * 
 * @see Section 4.2 Error Handling and Validation
 * @see React/Next.js Integration Requirements
 * @see Section 5.1 High-Level Architecture - Error Boundary Patterns
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  HomeIcon,
  UserPlusIcon,
  WifiIcon,
  ServerIcon
} from '@heroicons/react/24/outline';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorDetails {
  type: ErrorType;
  title: string;
  message: string;
  icon: typeof ExclamationTriangleIcon;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  contextualActions: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
    icon?: typeof ArrowPathIcon;
  }>;
}

type ErrorType = 
  | 'validation' 
  | 'network' 
  | 'api' 
  | 'authentication' 
  | 'permission' 
  | 'server' 
  | 'timeout'
  | 'unknown';

// ============================================================================
// ERROR CLASSIFICATION AND CONTEXTUAL MESSAGING
// ============================================================================

/**
 * Classifies errors and provides contextual messaging and recovery options
 * based on error type, supporting different user creation failure scenarios.
 */
function classifyError(error: Error): ErrorDetails {
  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || '';

  // Form validation errors
  if (errorMessage.includes('validation') || 
      errorMessage.includes('required') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('schema')) {
    return {
      type: 'validation',
      title: 'Form Validation Error',
      message: 'Please check the form fields and correct any validation errors before submitting.',
      icon: ExclamationTriangleIcon,
      severity: 'low',
      retryable: false,
      contextualActions: [
        {
          label: 'Review Form',
          action: () => window.location.reload(),
          primary: true,
          icon: UserPlusIcon
        }
      ]
    };
  }

  // Network connectivity errors
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      error.name === 'NetworkError') {
    return {
      type: 'network',
      title: 'Network Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      icon: WifiIcon,
      severity: 'medium',
      retryable: true,
      contextualActions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          primary: true,
          icon: ArrowPathIcon
        },
        {
          label: 'Check Connection',
          action: () => {
            // Open network diagnostics in new tab
            window.open('https://network-test.com', '_blank');
          }
        }
      ]
    };
  }

  // Authentication errors
  if (errorMessage.includes('authentication') || 
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('401')) {
    return {
      type: 'authentication',
      title: 'Authentication Required',
      message: 'Your session has expired. Please log in again to continue creating users.',
      icon: ExclamationTriangleIcon,
      severity: 'high',
      retryable: false,
      contextualActions: [
        {
          label: 'Login',
          action: () => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
          },
          primary: true
        }
      ]
    };
  }

  // Permission/authorization errors
  if (errorMessage.includes('permission') || 
      errorMessage.includes('forbidden') ||
      errorMessage.includes('403')) {
    return {
      type: 'permission',
      title: 'Insufficient Permissions',
      message: 'You do not have the required permissions to create users. Please contact your administrator.',
      icon: ExclamationTriangleIcon,
      severity: 'high',
      retryable: false,
      contextualActions: [
        {
          label: 'Contact Admin',
          action: () => {
            // Could integrate with support system
            window.location.href = 'mailto:admin@dreamfactory.com?subject=Permission%20Request';
          }
        },
        {
          label: 'Back to Users',
          action: () => {
            window.location.href = '/adf-users';
          },
          primary: true,
          icon: HomeIcon
        }
      ]
    };
  }

  // Server errors
  if (errorMessage.includes('500') || 
      errorMessage.includes('server') ||
      errorMessage.includes('internal')) {
    return {
      type: 'server',
      title: 'Server Error',
      message: 'An internal server error occurred while processing your request. The issue has been logged and will be investigated.',
      icon: ServerIcon,
      severity: 'critical',
      retryable: true,
      contextualActions: [
        {
          label: 'Try Again',
          action: () => window.location.reload(),
          primary: true,
          icon: ArrowPathIcon
        },
        {
          label: 'Back to Users',
          action: () => {
            window.location.href = '/adf-users';
          },
          icon: HomeIcon
        }
      ]
    };
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('aborted')) {
    return {
      type: 'timeout',
      title: 'Request Timeout',
      message: 'The request took too long to complete. This may be due to high server load or network issues.',
      icon: ExclamationTriangleIcon,
      severity: 'medium',
      retryable: true,
      contextualActions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          primary: true,
          icon: ArrowPathIcon
        }
      ]
    };
  }

  // API errors
  if (errorMessage.includes('api') || 
      errorStack.includes('api')) {
    return {
      type: 'api',
      title: 'API Error',
      message: 'An error occurred while communicating with the DreamFactory API. Please try again or contact support if the issue persists.',
      icon: ServerIcon,
      severity: 'medium',
      retryable: true,
      contextualActions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          primary: true,
          icon: ArrowPathIcon
        },
        {
          label: 'Back to Users',
          action: () => {
            window.location.href = '/adf-users';
          },
          icon: HomeIcon
        }
      ]
    };
  }

  // Unknown/generic errors
  return {
    type: 'unknown',
    title: 'Unexpected Error',
    message: 'An unexpected error occurred while creating the user. Please try again or contact support if the problem continues.',
    icon: ExclamationTriangleIcon,
    severity: 'medium',
    retryable: true,
    contextualActions: [
      {
        label: 'Try Again',
        action: () => window.location.reload(),
        primary: true,
        icon: ArrowPathIcon
      },
      {
        label: 'Back to Users',
        action: () => {
          window.location.href = '/adf-users';
        },
        icon: HomeIcon
      }
    ]
  };
}

// ============================================================================
// ERROR LOGGING AND MONITORING
// ============================================================================

/**
 * Comprehensive error logging function with production monitoring integration
 * Logs errors to console in development and sends to monitoring service in production
 */
async function logError(error: Error, errorDetails: ErrorDetails, context: Record<string, any> = {}) {
  const errorData = {
    timestamp: new Date().toISOString(),
    route: '/adf-users/create',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: (error as any).digest
    },
    classification: {
      type: errorDetails.type,
      severity: errorDetails.severity,
      retryable: errorDetails.retryable
    },
    context: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      ...context
    },
    user: {
      // Would be populated from auth context when available
      id: 'unknown',
      role: 'unknown'
    }
  };

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 User Creation Error');
    console.error('Error Details:', errorData);
    console.error('Original Error:', error);
    console.groupEnd();
  }

  try {
    // Production error logging - integrate with monitoring service
    if (process.env.NODE_ENV === 'production') {
      // This would integrate with error logging service when lib/error-logger.ts is available
      // await errorLogger.log(errorData);
      
      // For now, send to a generic endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      }).catch(() => {
        // Silently handle logging errors to prevent cascading failures
      });
    }
  } catch (loggingError) {
    // Prevent error logging from causing additional errors
    console.warn('Failed to log error:', loggingError);
  }
}

// ============================================================================
// RETRY MECHANISM WITH EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Custom hook for retry logic with exponential backoff
 * Provides intelligent retry mechanisms for transient errors
 */
function useRetryLogic(maxRetries: number = 3) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async (retryFn: () => void | Promise<void>) => {
    if (retryCount >= maxRetries) {
      return false;
    }

    setIsRetrying(true);
    
    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      await retryFn();
      setRetryCount(0); // Reset on success
      return true;
    } catch (error) {
      setRetryCount(prev => prev + 1);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries]);

  const resetRetries = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return { retry, retryCount, isRetrying, resetRetries, canRetry: retryCount < maxRetries };
}

// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * React 19 Error Boundary Component for User Creation Route
 * 
 * Provides comprehensive error handling with accessibility compliance,
 * contextual messaging, and recovery options following Next.js app router conventions.
 */
export default function UserCreateError({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();
  const { retry, retryCount, isRetrying, resetRetries, canRetry } = useRetryLogic();
  const [errorDetails] = useState(() => classifyError(error));

  // Log error on mount and when error changes
  useEffect(() => {
    logError(error, errorDetails, {
      retryCount,
      route: '/adf-users/create'
    });
  }, [error, errorDetails, retryCount]);

  // Enhanced retry function with error boundary reset
  const handleRetry = useCallback(async () => {
    try {
      await retry(() => {
        resetRetries();
        reset();
      });
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    }
  }, [retry, reset, resetRetries]);

  // Navigation handlers
  const navigateToUsers = useCallback(() => {
    router.push('/adf-users');
  }, [router]);

  const navigateToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  // Severity-based styling
  const getSeverityStyles = (severity: ErrorDetails['severity']) => {
    switch (severity) {
      case 'low':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'medium':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
      case 'high':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'critical':
        return 'border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/30';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50';
    }
  };

  const getIconColor = (severity: ErrorDetails['severity']) => {
    switch (severity) {
      case 'low':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'medium':
        return 'text-orange-600 dark:text-orange-400';
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'critical':
        return 'text-red-700 dark:text-red-300';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Error Card */}
        <div 
          className={`
            rounded-lg border-2 p-6 shadow-lg transition-all duration-300
            ${getSeverityStyles(errorDetails.severity)}
          `}
          role="alert"
          aria-live="assertive"
          aria-labelledby="error-title"
          aria-describedby="error-description"
        >
          {/* Error Icon and Title */}
          <div className="flex items-center space-x-3 mb-4">
            <div className={`flex-shrink-0 ${getIconColor(errorDetails.severity)}`}>
              <errorDetails.icon 
                className="h-8 w-8" 
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <h1 
                id="error-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {errorDetails.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User Creation Error
              </p>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-6">
            <p 
              id="error-description"
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {errorDetails.message}
            </p>
            
            {/* Technical Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
                  Technical Details
                </summary>
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto">
                  <p><strong>Error:</strong> {error.name}</p>
                  <p><strong>Message:</strong> {error.message}</p>
                  {error.stack && (
                    <p><strong>Stack:</strong> <br/>{error.stack}</p>
                  )}
                </div>
              </details>
            )}
          </div>

          {/* Retry Information */}
          {errorDetails.retryable && retryCount > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Retry attempt {retryCount} of 3
                {!canRetry && ' (maximum retries reached)'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Contextual Actions */}
            {errorDetails.contextualActions
              .filter(action => action.primary)
              .map((action, index) => (
                <button
                  key={`primary-${index}`}
                  onClick={action.action}
                  disabled={isRetrying}
                  className={`
                    w-full flex items-center justify-center space-x-2 px-4 py-2 
                    rounded-md font-medium transition-all duration-200
                    bg-primary-600 hover:bg-primary-700 
                    text-white shadow-sm hover:shadow-md
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    dark:focus:ring-offset-gray-800
                  `}
                  aria-label={`${action.label}${isRetrying ? ' (in progress)' : ''}`}
                >
                  {isRetrying ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : action.icon ? (
                    <action.icon className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                  <span>{isRetrying ? 'Processing...' : action.label}</span>
                </button>
              ))}

            {/* Retry Button for Retryable Errors */}
            {errorDetails.retryable && canRetry && !errorDetails.contextualActions.some(a => a.primary) && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className={`
                  w-full flex items-center justify-center space-x-2 px-4 py-2 
                  rounded-md font-medium transition-all duration-200
                  bg-primary-600 hover:bg-primary-700 
                  text-white shadow-sm hover:shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  dark:focus:ring-offset-gray-800
                `}
                aria-label={`Retry${isRetrying ? ' (in progress)' : ''}`}
              >
                {isRetrying ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
              </button>
            )}

            {/* Secondary Actions */}
            <div className="flex space-x-3">
              {errorDetails.contextualActions
                .filter(action => !action.primary)
                .map((action, index) => (
                  <button
                    key={`secondary-${index}`}
                    onClick={action.action}
                    className={`
                      flex-1 flex items-center justify-center space-x-2 px-3 py-2 
                      rounded-md font-medium transition-all duration-200
                      border border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                      text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                      dark:focus:ring-offset-gray-800
                    `}
                    aria-label={action.label}
                  >
                    {action.icon && <action.icon className="h-4 w-4" aria-hidden="true" />}
                    <span className="text-sm">{action.label}</span>
                  </button>
                ))}
              
              {/* Default navigation if no contextual actions */}
              {errorDetails.contextualActions.filter(a => !a.primary).length === 0 && (
                <button
                  onClick={navigateToUsers}
                  className={`
                    flex-1 flex items-center justify-center space-x-2 px-3 py-2 
                    rounded-md font-medium transition-all duration-200
                    border border-gray-300 dark:border-gray-600
                    bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                    text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    dark:focus:ring-offset-gray-800
                  `}
                  aria-label="Go back to users list"
                >
                  <HomeIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm">Back to Users</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Code and Timestamp */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Error Type: {errorDetails.type.toUpperCase()} | 
              Time: {new Date().toLocaleTimeString()} |
              {(error as any).digest && ` ID: ${(error as any).digest.slice(0, 8)}`}
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If this problem continues, please{' '}
            <a 
              href="mailto:support@dreamfactory.com?subject=User%20Creation%20Error"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              contact support
            </a>
            {' '}with the error details above.
          </p>
        </div>
      </div>
    </div>
  );
}