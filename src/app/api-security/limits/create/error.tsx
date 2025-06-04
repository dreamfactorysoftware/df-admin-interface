'use client';

/**
 * Error Boundary Component for Create Limit Page
 * 
 * Next.js error boundary that handles and displays errors in the limit creation workflow.
 * Provides user-friendly error messages, recovery actions, and error reporting while 
 * maintaining application stability during form submission failures or validation errors.
 * 
 * Features:
 * - Next.js app router error handling conventions
 * - Comprehensive error recovery actions and retry mechanisms
 * - User-friendly error messages with internationalization support
 * - Tailwind CSS styling with WCAG 2.1 AA accessibility compliance
 * - Integration with centralized error handling system
 * - Automatic error reporting and logging
 * - Multiple recovery strategies (retry, refresh, redirect)
 * - Context-aware error messages based on error type
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useErrorHandler, ErrorType, RecoveryStrategy } from '@/hooks/use-error-handler';
import { AlertTriangle, RefreshCw, ArrowLeft, Home, Bug, Wifi, Clock, Shield, FileText, Database } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ErrorBoundaryProps {
  error: Error & { digest?: string; statusCode?: number };
  reset: () => void;
}

interface ErrorDisplayConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'destructive' | 'warning' | 'default';
  showTechnicalDetails: boolean;
  recoveryActions: RecoveryAction[];
}

interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  variant: 'default' | 'outline' | 'destructive' | 'secondary';
  icon?: React.ComponentType<{ className?: string }>;
  primary?: boolean;
}

// ============================================================================
// ERROR CLASSIFICATION AND CONFIGURATION
// ============================================================================

const ERROR_CONFIGURATIONS: Record<string, ErrorDisplayConfig> = {
  // Network and API Errors
  network_error: {
    title: 'Connection Problem',
    description: 'Unable to connect to the server. Please check your internet connection and try again.',
    icon: Wifi,
    variant: 'warning',
    showTechnicalDetails: false,
    recoveryActions: [
      {
        label: 'Try Again',
        action: () => window.location.reload(),
        variant: 'default',
        icon: RefreshCw,
        primary: true,
      },
      {
        label: 'Check Connection',
        action: () => window.open('https://www.google.com', '_blank'),
        variant: 'outline',
      },
    ],
  },
  timeout_error: {
    title: 'Request Timeout',
    description: 'The request took too long to complete. The server might be experiencing high load.',
    icon: Clock,
    variant: 'warning',
    showTechnicalDetails: false,
    recoveryActions: [
      {
        label: 'Retry Request',
        action: () => window.location.reload(),
        variant: 'default',
        icon: RefreshCw,
        primary: true,
      },
    ],
  },
  api_error: {
    title: 'Server Error',
    description: 'There was a problem processing your request on the server. Please try again in a few moments.',
    icon: Database,
    variant: 'destructive',
    showTechnicalDetails: true,
    recoveryActions: [
      {
        label: 'Try Again',
        action: () => window.location.reload(),
        variant: 'default',
        icon: RefreshCw,
        primary: true,
      },
    ],
  },

  // Authentication and Authorization Errors  
  authentication_error: {
    title: 'Authentication Required',
    description: 'Your session has expired or you need to log in to access this page.',
    icon: Shield,
    variant: 'warning',
    showTechnicalDetails: false,
    recoveryActions: [
      {
        label: 'Log In',
        action: () => window.location.href = '/login',
        variant: 'default',
        icon: Shield,
        primary: true,
      },
    ],
  },
  authorization_error: {
    title: 'Access Denied',
    description: 'You do not have permission to create API rate limits. Please contact your administrator.',
    icon: Shield,
    variant: 'destructive',
    showTechnicalDetails: false,
    recoveryActions: [
      {
        label: 'Go to Dashboard',
        action: () => window.location.href = '/',
        variant: 'default',
        icon: Home,
        primary: true,
      },
      {
        label: 'Contact Support',
        action: () => window.location.href = 'mailto:support@dreamfactory.com',
        variant: 'outline',
      },
    ],
  },

  // Validation and Form Errors
  validation_error: {
    title: 'Form Validation Error',
    description: 'There are validation errors in the limit creation form. Please review your input and try again.',
    icon: FileText,
    variant: 'warning',
    showTechnicalDetails: false,
    recoveryActions: [
      {
        label: 'Return to Form',
        action: () => window.history.back(),
        variant: 'default',
        icon: ArrowLeft,
        primary: true,
      },
    ],
  },

  // Application and Component Errors
  component_error: {
    title: 'Component Error',
    description: 'A problem occurred while loading the limit creation form. Refreshing the page may resolve this issue.',
    icon: Bug,
    variant: 'destructive',
    showTechnicalDetails: true,
    recoveryActions: [
      {
        label: 'Refresh Page',
        action: () => window.location.reload(),
        variant: 'default',
        icon: RefreshCw,
        primary: true,
      },
      {
        label: 'Go Back',
        action: () => window.history.back(),
        variant: 'outline',
        icon: ArrowLeft,
      },
    ],
  },

  // Default/Unknown Errors
  unknown_error: {
    title: 'Unexpected Error',
    description: 'An unexpected error occurred while creating the rate limit. Please try again or contact support if the problem persists.',
    icon: AlertTriangle,
    variant: 'destructive',
    showTechnicalDetails: true,
    recoveryActions: [
      {
        label: 'Try Again',
        action: () => window.location.reload(),
        variant: 'default',
        icon: RefreshCw,
        primary: true,
      },
      {
        label: 'Go to Limits List',
        action: () => window.location.href = '/api-security/limits',
        variant: 'outline',
        icon: ArrowLeft,
      },
      {
        label: 'Report Issue',
        action: () => window.location.href = 'mailto:support@dreamfactory.com?subject=Error in Limit Creation',
        variant: 'secondary',
        icon: Bug,
      },
    ],
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Classifies an error based on its properties and message content
 */
function classifyError(error: Error & { digest?: string; statusCode?: number }): string {
  // Check status code first
  if (error.statusCode) {
    if (error.statusCode === 401) return 'authentication_error';
    if (error.statusCode === 403) return 'authorization_error';
    if (error.statusCode === 408 || error.statusCode === 504) return 'timeout_error';
    if (error.statusCode === 422) return 'validation_error';
    if (error.statusCode >= 500) return 'api_error';
  }

  // Check error message content
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network_error';
  }
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout_error';
  }
  
  if (message.includes('unauthorized') || message.includes('authentication')) {
    return 'authentication_error';
  }
  
  if (message.includes('forbidden') || message.includes('permission') || message.includes('access denied')) {
    return 'authorization_error';
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return 'validation_error';
  }
  
  if (message.includes('component') || error.name.includes('ChunkLoadError')) {
    return 'component_error';
  }

  return 'unknown_error';
}

/**
 * Formats error details for display
 */
function formatErrorDetails(error: Error & { digest?: string; statusCode?: number }): {
  errorId: string;
  timestamp: string;
  technical: string;
} {
  const timestamp = new Date().toISOString();
  const errorId = error.digest || `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let technical = error.message;
  if (error.statusCode) {
    technical = `HTTP ${error.statusCode}: ${technical}`;
  }
  if (error.stack && process.env.NODE_ENV === 'development') {
    technical += `\n\nStack trace:\n${error.stack}`;
  }

  return { errorId, timestamp, technical };
}

// ============================================================================
// ALERT COMPONENT (Simplified inline implementation)
// ============================================================================

const Alert = ({ 
  children, 
  variant = 'default',
  className = '',
}: { 
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning';
  className?: string;
}) => {
  const baseClasses = 'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7';
  
  const variantClasses = {
    default: 'border-border bg-background text-foreground',
    destructive: 'border-red-500/50 text-red-900 dark:text-red-50 [&>svg]:text-red-500 bg-red-50 dark:bg-red-950/30',
    warning: 'border-yellow-500/50 text-yellow-900 dark:text-yellow-50 [&>svg]:text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} role="alert">
      {children}
    </div>
  );
};

const AlertTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
    {children}
  </h5>
);

const AlertDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
    {children}
  </div>
);

// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================

export default function CreateLimitErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();
  const errorHandler = useErrorHandler();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Classify and configure error display
  const errorType = classifyError(error);
  const config = ERROR_CONFIGURATIONS[errorType];
  const errorDetails = formatErrorDetails(error);

  // Report error to centralized error handling system
  useEffect(() => {
    const appError = errorHandler.createError(
      errorType as ErrorType,
      error.message,
      {
        originalError: error,
        statusCode: error.statusCode,
        context: {
          component: 'CreateLimitErrorBoundary',
          route: '/api-security/limits/create',
          action: 'limit_creation',
          feature: 'api_security',
          errorId: errorDetails.errorId,
          timestamp: errorDetails.timestamp,
        },
      }
    );

    errorHandler.handleError(appError, {
      component: 'CreateLimitErrorBoundary',
      route: '/api-security/limits/create',
    });
  }, [error, errorHandler, errorType, errorDetails.errorId, errorDetails.timestamp]);

  // Enhanced retry function with loading state
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  }, [reset]);

  // Enhanced recovery actions with retry integration
  const enhancedRecoveryActions: RecoveryAction[] = config.recoveryActions.map(action => {
    if (action.label === 'Try Again' || action.label === 'Retry Request') {
      return {
        ...action,
        action: handleRetry,
      };
    }
    return action;
  });

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50 dark:bg-gray-900"
      role="main"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="w-full max-w-2xl">
        <Alert variant={config.variant} className="mb-6">
          <config.icon className="h-4 w-4" aria-hidden="true" />
          <AlertTitle id="error-title" className="mb-2">
            {config.title}
          </AlertTitle>
          <AlertDescription id="error-description" className="mb-4">
            {config.description}
          </AlertDescription>

          {/* Primary Recovery Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {enhancedRecoveryActions
              .filter(action => action.primary)
              .map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  onClick={action.action}
                  disabled={isRetrying}
                  className="flex items-center gap-2"
                  aria-label={`${action.label}${isRetrying && action.label.includes('Again') ? ' - Loading' : ''}`}
                >
                  {action.icon && (
                    <action.icon 
                      className={`h-4 w-4 ${isRetrying && action.label.includes('Again') ? 'animate-spin' : ''}`} 
                      aria-hidden="true" 
                    />
                  )}
                  {isRetrying && action.label.includes('Again') ? 'Retrying...' : action.label}
                </Button>
              ))
            }
          </div>

          {/* Secondary Recovery Actions */}
          {enhancedRecoveryActions.some(action => !action.primary) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {enhancedRecoveryActions
                .filter(action => !action.primary)
                .map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant}
                    size="sm"
                    onClick={action.action}
                    className="flex items-center gap-1"
                    aria-label={action.label}
                  >
                    {action.icon && <action.icon className="h-3 w-3" aria-hidden="true" />}
                    {action.label}
                  </Button>
                ))
              }
            </div>
          )}
        </Alert>

        {/* Technical Details Section */}
        {config.showTechnicalDetails && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center gap-2 w-full text-left text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              aria-expanded={showTechnicalDetails}
              aria-controls="technical-details"
            >
              <Bug className="h-4 w-4" aria-hidden="true" />
              Technical Details
              <span className="ml-auto">
                {showTechnicalDetails ? '−' : '+'}
              </span>
            </button>

            {showTechnicalDetails && (
              <div 
                id="technical-details"
                className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                role="region"
                aria-label="Technical error details"
              >
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="font-medium text-gray-600 dark:text-gray-300">Error ID:</dt>
                    <dd className="font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1">
                      {errorDetails.errorId}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600 dark:text-gray-300">Timestamp:</dt>
                    <dd className="font-mono text-gray-900 dark:text-gray-100">
                      {new Date(errorDetails.timestamp).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600 dark:text-gray-300">Technical Message:</dt>
                    <dd className="font-mono text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 whitespace-pre-wrap text-xs">
                      {errorDetails.technical}
                    </dd>
                  </div>
                </dl>

                {/* Copy Error Details Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const errorReport = `Error Report\n` +
                      `=============\n` +
                      `Error ID: ${errorDetails.errorId}\n` +
                      `Timestamp: ${errorDetails.timestamp}\n` +
                      `Page: /api-security/limits/create\n` +
                      `User Agent: ${navigator.userAgent}\n` +
                      `Technical Details: ${errorDetails.technical}`;
                    
                    navigator.clipboard.writeText(errorReport).then(() => {
                      // You could show a toast notification here
                      console.log('Error details copied to clipboard');
                    });
                  }}
                  className="mt-3"
                  aria-label="Copy error details to clipboard"
                >
                  Copy Error Details
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Need Additional Help?
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            If this error persists, you can:
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
            <li>• Check the <a href="/api-docs" className="underline hover:no-underline">API documentation</a> for rate limit requirements</li>
            <li>• Review your permissions with your administrator</li>
            <li>• Contact support with the error ID: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{errorDetails.errorId}</code></li>
          </ul>
        </div>

        {/* Accessibility Instructions */}
        <div className="sr-only">
          <h2>Error Recovery Instructions</h2>
          <p>
            An error occurred while creating a rate limit. Use the buttons above to retry the operation,
            return to the previous page, or access help resources. If you need technical assistance,
            reference error ID {errorDetails.errorId} when contacting support.
          </p>
        </div>
      </div>
    </div>
  );
}