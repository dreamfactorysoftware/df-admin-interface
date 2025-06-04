'use client';

/**
 * Error Boundary Component for Roles Management
 * 
 * Next.js App Router error boundary that handles and displays errors in role management 
 * workflows. Provides user-friendly error messages, recovery actions, and maintains 
 * application stability during role operations.
 * 
 * Features:
 * - Comprehensive error handling and validation per Section 4.2 requirements
 * - User-friendly error recovery interfaces per Section 7.6 user interactions
 * - Accessibility compliance for error states per WCAG 2.1 AA requirements
 * - Next.js error boundary component per app router error handling conventions
 * - Internationalization support for error messages
 * - Tailwind CSS styling per React/Next.js Integration Requirements
 * - Integration with error handling hook and UI components
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  useErrorHandler, 
  ErrorType, 
  ErrorSeverity, 
  RecoveryStrategy,
  type AppError 
} from '@/hooks/use-error-handling';
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  ClockIcon,
  ShieldExclamationIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ============================================================================
// Error Boundary Props Interface
// ============================================================================

interface RoleErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorDetails {
  timestamp: string;
  errorId: string;
  digest?: string;
  stack?: string;
  componentStack?: string;
}

interface RetryState {
  attempts: number;
  lastAttempt: number;
  isRetrying: boolean;
}

// ============================================================================
// Error Classification and Messaging
// ============================================================================

const ERROR_MESSAGES = {
  // Authentication & Authorization Errors
  [ErrorType.AUTHENTICATION_ERROR]: {
    title: 'Authentication Required',
    description: 'Your session has expired. Please log in again to continue managing roles.',
    icon: ShieldExclamationIcon,
    variant: 'warning' as const,
    actions: ['login', 'refresh']
  },
  [ErrorType.AUTHORIZATION_ERROR]: {
    title: 'Access Denied',
    description: 'You don\'t have permission to access role management. Contact your administrator for access.',
    icon: ShieldExclamationIcon,
    variant: 'error' as const,
    actions: ['home', 'contact']
  },
  [ErrorType.PERMISSION_DENIED]: {
    title: 'Insufficient Permissions',
    description: 'Your current role doesn\'t allow role management operations. Administrator privileges required.',
    icon: ShieldExclamationIcon,
    variant: 'warning' as const,
    actions: ['home', 'contact']
  },
  
  // Network & API Errors
  [ErrorType.NETWORK_ERROR]: {
    title: 'Network Connection Error',
    description: 'Unable to connect to the server. Please check your internet connection and try again.',
    icon: XCircleIcon,
    variant: 'error' as const,
    actions: ['retry', 'refresh', 'home']
  },
  [ErrorType.API_ERROR]: {
    title: 'Service Unavailable',
    description: 'The role management service is temporarily unavailable. Please try again in a few moments.',
    icon: ExclamationTriangleIcon,
    variant: 'warning' as const,
    actions: ['retry', 'refresh', 'home']
  },
  [ErrorType.TIMEOUT_ERROR]: {
    title: 'Request Timeout',
    description: 'The server took too long to respond. This might be due to heavy load or network issues.',
    icon: ClockIcon,
    variant: 'warning' as const,
    actions: ['retry', 'refresh']
  },
  
  // Validation & Data Errors
  [ErrorType.VALIDATION_ERROR]: {
    title: 'Data Validation Error',
    description: 'The role data contains invalid information. Please review your input and try again.',
    icon: ExclamationTriangleIcon,
    variant: 'error' as const,
    actions: ['refresh', 'home']
  },
  [ErrorType.DATABASE_ERROR]: {
    title: 'Database Error',
    description: 'Unable to access role data. The database may be temporarily unavailable.',
    icon: ExclamationTriangleIcon,
    variant: 'error' as const,
    actions: ['retry', 'refresh', 'home']
  },
  
  // Default fallback
  [ErrorType.UNKNOWN_ERROR]: {
    title: 'Unexpected Error',
    description: 'An unexpected error occurred while loading the role management interface.',
    icon: ExclamationTriangleIcon,
    variant: 'error' as const,
    actions: ['retry', 'refresh', 'home']
  }
} as const;

// ============================================================================
// Main Error Boundary Component
// ============================================================================

export default function RoleErrorBoundary({ error, reset }: RoleErrorBoundaryProps) {
  const router = useRouter();
  const { 
    processError, 
    getRecoveryOptions, 
    executeRecovery, 
    formatUserMessage,
    isRetryableError 
  } = useErrorHandler();

  // Component state
  const [showDetails, setShowDetails] = useState(false);
  const [retryState, setRetryState] = useState<RetryState>({
    attempts: 0,
    lastAttempt: 0,
    isRetrying: false
  });

  // Process the error and determine type and recovery options
  const processedError = useMemo(() => {
    return processError(error, {
      component: 'RoleErrorBoundary',
      route: '/api-security/roles',
      feature: 'role_management',
      action: 'boundary_catch',
      timestamp: new Date().toISOString()
    });
  }, [error, processError]);

  const errorConfig = ERROR_MESSAGES[processedError.type] || ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR];
  const recoveryOptions = getRecoveryOptions(processedError);

  // Error details for technical display
  const errorDetails: ErrorDetails = useMemo(() => ({
    timestamp: new Date().toISOString(),
    errorId: processedError.errorId || 'unknown',
    digest: error.digest,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    componentStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  }), [error, processedError]);

  // Determine if error is retryable
  const canRetry = isRetryableError(processedError);
  const maxRetries = 3;
  const retryDelay = Math.min(1000 * Math.pow(2, retryState.attempts), 10000);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleRetry = useCallback(async () => {
    if (retryState.isRetrying || retryState.attempts >= maxRetries) {
      return;
    }

    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      attempts: prev.attempts + 1,
      lastAttempt: Date.now()
    }));

    try {
      // Wait for the retry delay
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Execute recovery through error handler
      await executeRecovery(processedError, RecoveryStrategy.RETRY);
      
      // Reset the error boundary
      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      // Don't reset the error boundary if retry fails
    } finally {
      setRetryState(prev => ({
        ...prev,
        isRetrying: false
      }));
    }
  }, [processedError, reset, retryState, executeRecovery, retryDelay]);

  const handleRefresh = useCallback(async () => {
    try {
      await executeRecovery(processedError, RecoveryStrategy.REFRESH);
      window.location.reload();
    } catch (refreshError) {
      console.error('Refresh failed:', refreshError);
    }
  }, [processedError, executeRecovery]);

  const handleGoHome = useCallback(async () => {
    try {
      await executeRecovery(processedError, RecoveryStrategy.REDIRECT);
      router.push('/');
    } catch (homeError) {
      console.error('Home navigation failed:', homeError);
      window.location.href = '/';
    }
  }, [processedError, executeRecovery, router]);

  const handleLogin = useCallback(async () => {
    try {
      await executeRecovery(processedError, RecoveryStrategy.LOGOUT);
      router.push('/login');
    } catch (loginError) {
      console.error('Login navigation failed:', loginError);
      window.location.href = '/login';
    }
  }, [processedError, executeRecovery, router]);

  const handleContactSupport = useCallback(() => {
    // Open support contact method - could be email, chat, etc.
    window.open('mailto:support@dreamfactory.com?subject=Role Management Error&body=' + 
      encodeURIComponent(`Error ID: ${errorDetails.errorId}\nTimestamp: ${errorDetails.timestamp}\nDigest: ${errorDetails.digest || 'N/A'}`), 
      '_blank'
    );
  }, [errorDetails]);

  // ============================================================================
  // Accessibility and Keyboard Handling
  // ============================================================================

  useEffect(() => {
    // Focus the error container for screen readers
    const errorContainer = document.getElementById('role-error-container');
    if (errorContainer) {
      errorContainer.focus();
    }

    // Announce error to screen readers
    const announcement = `Error in role management: ${errorConfig.title}. ${errorConfig.description}`;
    const ariaLiveRegion = document.createElement('div');
    ariaLiveRegion.setAttribute('aria-live', 'assertive');
    ariaLiveRegion.setAttribute('aria-atomic', 'true');
    ariaLiveRegion.className = 'sr-only';
    ariaLiveRegion.textContent = announcement;
    document.body.appendChild(ariaLiveRegion);

    return () => {
      if (document.body.contains(ariaLiveRegion)) {
        document.body.removeChild(ariaLiveRegion);
      }
    };
  }, [errorConfig.title, errorConfig.description]);

  // ============================================================================
  // Action Button Mapping
  // ============================================================================

  const actionButtons = {
    retry: canRetry && retryState.attempts < maxRetries ? (
      <Button
        onClick={handleRetry}
        disabled={retryState.isRetrying}
        variant="default"
        size="default"
        className="min-w-[120px]"
        aria-label={`Retry role management operation. Attempt ${retryState.attempts + 1} of ${maxRetries}`}
        data-testid="error-retry-button"
      >
        {retryState.isRetrying ? (
          <>
            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry ({maxRetries - retryState.attempts} left)
          </>
        )}
      </Button>
    ) : null,

    refresh: (
      <Button
        onClick={handleRefresh}
        variant="outline"
        size="default"
        aria-label="Refresh the page to reload role management"
        data-testid="error-refresh-button"
      >
        <ArrowPathIcon className="h-4 w-4 mr-2" />
        Refresh Page
      </Button>
    ),

    home: (
      <Button
        onClick={handleGoHome}
        variant="outline"
        size="default"
        aria-label="Return to dashboard"
        data-testid="error-home-button"
      >
        <HomeIcon className="h-4 w-4 mr-2" />
        Go to Dashboard
      </Button>
    ),

    login: (
      <Button
        onClick={handleLogin}
        variant="default"
        size="default"
        aria-label="Go to login page to re-authenticate"
        data-testid="error-login-button"
      >
        <ShieldExclamationIcon className="h-4 w-4 mr-2" />
        Log In Again
      </Button>
    ),

    contact: (
      <Button
        onClick={handleContactSupport}
        variant="outline"
        size="default"
        aria-label="Contact support for assistance"
        data-testid="error-contact-button"
      >
        <InformationCircleIcon className="h-4 w-4 mr-2" />
        Contact Support
      </Button>
    )
  };

  // ============================================================================
  // Error Severity Styling
  // ============================================================================

  const severityStyles = {
    [ErrorSeverity.LOW]: {
      container: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
      icon: 'text-yellow-500',
      title: 'text-yellow-900 dark:text-yellow-100',
      description: 'text-yellow-700 dark:text-yellow-200'
    },
    [ErrorSeverity.MEDIUM]: {
      container: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
      icon: 'text-orange-500',
      title: 'text-orange-900 dark:text-orange-100',
      description: 'text-orange-700 dark:text-orange-200'
    },
    [ErrorSeverity.HIGH]: {
      container: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
      icon: 'text-red-500',
      title: 'text-red-900 dark:text-red-100',
      description: 'text-red-700 dark:text-red-200'
    },
    [ErrorSeverity.CRITICAL]: {
      container: 'border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/30',
      icon: 'text-red-600',
      title: 'text-red-900 dark:text-red-100',
      description: 'text-red-800 dark:text-red-200'
    }
  };

  const styles = severityStyles[processedError.severity] || severityStyles[ErrorSeverity.MEDIUM];
  const IconComponent = errorConfig.icon;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900"
      data-testid="role-error-boundary"
    >
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Error Display */}
        <div 
          id="role-error-container"
          tabIndex={-1}
          className={cn(
            "rounded-lg border-2 p-8 shadow-lg",
            styles.container
          )}
          role="alert"
          aria-labelledby="error-title"
          aria-describedby="error-description"
          data-testid="error-display-container"
        >
          {/* Error Icon and Title */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <IconComponent 
                className={cn("h-8 w-8", styles.icon)}
                aria-hidden="true"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 
                id="error-title"
                className={cn("text-xl font-semibold", styles.title)}
              >
                {errorConfig.title}
              </h1>
              
              <p 
                id="error-description"
                className={cn("mt-2 text-sm leading-6", styles.description)}
              >
                {errorConfig.description}
              </p>

              {/* User-friendly error message from error handler */}
              {processedError.userMessage && processedError.userMessage !== errorConfig.description && (
                <p className={cn("mt-2 text-sm leading-6 font-medium", styles.description)}>
                  {formatUserMessage(processedError)}
                </p>
              )}

              {/* Retry Information */}
              {retryState.attempts > 0 && (
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  {retryState.attempts} of {maxRetries} retry attempts used
                  {retryState.lastAttempt > 0 && (
                    <span className="ml-2">
                      • Last attempt: {new Date(retryState.lastAttempt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {errorConfig.actions.map(action => actionButtons[action]).filter(Boolean)}
          </div>
        </div>

        {/* Technical Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-expanded={showDetails}
              aria-controls="technical-details"
              data-testid="toggle-details-button"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Technical Details
              </span>
              {showDetails ? (
                <ChevronUpIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
            
            {showDetails && (
              <div 
                id="technical-details"
                className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700"
                data-testid="technical-details-content"
              >
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Error ID
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {errorDetails.errorId}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Timestamp
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(errorDetails.timestamp).toLocaleString()}
                    </dd>
                  </div>
                  
                  {errorDetails.digest && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Digest
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {errorDetails.digest}
                      </dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Error Type
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {processedError.type}
                    </dd>
                  </div>
                </dl>

                {errorDetails.stack && (
                  <div className="mt-4">
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Stack Trace
                    </dt>
                    <dd className="mt-1 text-xs text-gray-600 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded border overflow-x-auto">
                      <pre>{errorDetails.stack}</pre>
                    </dd>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If this problem persists, please contact support with the error ID above.
          </p>
        </div>
      </div>
    </div>
  );
}