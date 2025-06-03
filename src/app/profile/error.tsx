'use client';

/**
 * @fileoverview Profile Management Error Boundary Component
 * 
 * Implements Next.js error boundary for the profile management route providing
 * comprehensive error handling with user-friendly recovery options. Features
 * React 19 error boundary capabilities, detailed error logging, accessibility
 * compliance (WCAG 2.1 AA), and specific handling for profile-related errors
 * including password changes, security question updates, and network issues.
 * 
 * Key Features:
 * - React 19 error boundary patterns with enhanced error info
 * - User-friendly error UI with contextual recovery options
 * - Comprehensive error logging and monitoring integration
 * - Profile-specific error categorization and messaging
 * - Retry mechanisms for transient profile operation errors
 * - WCAG 2.1 AA accessibility compliance with screen reader support
 * - Tailwind CSS responsive design with theme integration
 * - Error tracking and analytics for production debugging
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon, UserIcon, KeyIcon, ShieldCheckIcon } from 'lucide-react';

// UI Components (will be created by other team members - using assumed interfaces)
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Error utilities (will be created by other team members - using assumed interfaces)
import { logError, type ErrorContext } from '@/lib/error-logger';
import { 
  shouldRetryError, 
  getRetryDelay, 
  type ErrorRecoveryOptions 
} from '@/lib/error-recovery';

// Type definitions for profile-specific errors
import type { 
  AuthErrorCode, 
  AUTH_ERROR_CODES,
  UserProfile 
} from '@/types/user';

/**
 * Enhanced error interface with profile-specific context
 */
interface ProfileError extends Error {
  code?: string;
  statusCode?: number;
  context?: 'profile_update' | 'password_change' | 'security_question' | 'network' | 'authentication' | 'validation';
  field?: string;
  retryable?: boolean;
  userMessage?: string;
  originalError?: Error;
}

/**
 * Error boundary state interface
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: ProfileError | null;
  errorId: string | null;
  retryCount: number;
  isRetrying: boolean;
  lastRetryAt: number | null;
}

/**
 * Props interface for the error boundary component
 */
interface ProfileErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

/**
 * Maximum number of retry attempts for transient errors
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay for exponential backoff retry logic (in milliseconds)
 */
const BASE_RETRY_DELAY = 1000;

/**
 * Profile-specific error categorization and user messaging
 */
const PROFILE_ERROR_CATEGORIES = {
  PROFILE_UPDATE_FAILED: {
    title: 'Profile Update Failed',
    description: 'We encountered an issue while updating your profile information.',
    icon: UserIcon,
    severity: 'error' as const,
    retryable: true,
    recoveryActions: ['retry', 'refresh', 'contact_support']
  },
  PASSWORD_CHANGE_FAILED: {
    title: 'Password Change Failed',
    description: 'Your password could not be updated. Please check your current password and try again.',
    icon: KeyIcon,
    severity: 'error' as const,
    retryable: true,
    recoveryActions: ['retry', 'reset_form', 'contact_support']
  },
  SECURITY_QUESTION_FAILED: {
    title: 'Security Question Update Failed',
    description: 'Unable to update your security question. Please verify your information and try again.',
    icon: ShieldCheckIcon,
    severity: 'error' as const,
    retryable: true,
    recoveryActions: ['retry', 'reset_form', 'contact_support']
  },
  NETWORK_ERROR: {
    title: 'Connection Problem',
    description: 'Unable to connect to the server. Please check your internet connection and try again.',
    icon: AlertTriangleIcon,
    severity: 'warning' as const,
    retryable: true,
    recoveryActions: ['retry', 'refresh', 'check_connection']
  },
  AUTHENTICATION_ERROR: {
    title: 'Session Expired',
    description: 'Your session has expired. Please log in again to continue managing your profile.',
    icon: ShieldCheckIcon,
    severity: 'error' as const,
    retryable: false,
    recoveryActions: ['login', 'contact_support']
  },
  VALIDATION_ERROR: {
    title: 'Invalid Information',
    description: 'Please check the information you entered and correct any errors before continuing.',
    icon: AlertTriangleIcon,
    severity: 'warning' as const,
    retryable: false,
    recoveryActions: ['reset_form', 'contact_support']
  },
  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    description: 'An unexpected error occurred while processing your request. Our team has been notified.',
    icon: AlertTriangleIcon,
    severity: 'error' as const,
    retryable: true,
    recoveryActions: ['retry', 'refresh', 'go_home', 'contact_support']
  }
} as const;

/**
 * Categorize error based on its properties and context
 */
function categorizeError(error: Error): keyof typeof PROFILE_ERROR_CATEGORIES {
  const profileError = error as ProfileError;
  
  // Check for authentication errors
  if (profileError.code && Object.values(AUTH_ERROR_CODES).includes(profileError.code as AuthErrorCode)) {
    return 'AUTHENTICATION_ERROR';
  }
  
  // Check for network errors
  if (profileError.code === 'NETWORK_ERROR' || profileError.message.toLowerCase().includes('network')) {
    return 'NETWORK_ERROR';
  }
  
  // Check for validation errors
  if (profileError.statusCode === 400 || profileError.message.toLowerCase().includes('validation')) {
    return 'VALIDATION_ERROR';
  }
  
  // Check for context-specific errors
  switch (profileError.context) {
    case 'password_change':
      return 'PASSWORD_CHANGE_FAILED';
    case 'security_question':
      return 'SECURITY_QUESTION_FAILED';
    case 'profile_update':
      return 'PROFILE_UPDATE_FAILED';
    case 'network':
      return 'NETWORK_ERROR';
    case 'authentication':
      return 'AUTHENTICATION_ERROR';
    case 'validation':
      return 'VALIDATION_ERROR';
    default:
      return 'UNKNOWN_ERROR';
  }
}

/**
 * Generate contextual user message based on error category and details
 */
function getContextualMessage(error: ProfileError, category: keyof typeof PROFILE_ERROR_CATEGORIES): string {
  const baseMessage = PROFILE_ERROR_CATEGORIES[category].description;
  
  // Add field-specific context if available
  if (error.field) {
    const fieldMessages: Record<string, string> = {
      email: 'There was an issue with the email address you provided.',
      password: 'The password you entered is not valid.',
      security_question: 'Please check your security question and answer.',
      first_name: 'Please check the first name field.',
      last_name: 'Please check the last name field.',
      phone: 'Please verify the phone number format.',
    };
    
    if (fieldMessages[error.field]) {
      return `${baseMessage} ${fieldMessages[error.field]}`;
    }
  }
  
  // Use custom user message if available
  if (error.userMessage) {
    return error.userMessage;
  }
  
  return baseMessage;
}

/**
 * Recovery action handlers
 */
function useRecoveryActions(
  error: ProfileError | null,
  reset: () => void,
  onRetry: () => void
) {
  const handleRefreshPage = useCallback(() => {
    window.location.reload();
  }, []);
  
  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);
  
  const handleGoToLogin = useCallback(() => {
    window.location.href = '/login';
  }, []);
  
  const handleContactSupport = useCallback(() => {
    // In a real implementation, this would open a support modal or redirect to support
    console.log('Contact support requested for error:', error);
    alert('Please contact support at support@dreamfactory.com or through the help section.');
  }, [error]);
  
  const handleResetForm = useCallback(() => {
    // Reset the form and clear error state
    reset();
  }, [reset]);
  
  const handleCheckConnection = useCallback(() => {
    // Simple connectivity check
    if (navigator.onLine) {
      alert('Your internet connection appears to be working. Please try again.');
    } else {
      alert('Please check your internet connection and try again.');
    }
  }, []);
  
  return {
    retry: onRetry,
    refresh: handleRefreshPage,
    go_home: handleGoHome,
    login: handleGoToLogin,
    contact_support: handleContactSupport,
    reset_form: handleResetForm,
    check_connection: handleCheckConnection,
  };
}

/**
 * Recovery Action Button Component
 */
function RecoveryActionButton({ 
  action, 
  handler, 
  isPrimary = false,
  isLoading = false,
  disabled = false 
}: {
  action: string;
  handler: () => void;
  isPrimary?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  const actionLabels: Record<string, string> = {
    retry: 'Try Again',
    refresh: 'Refresh Page',
    go_home: 'Go to Dashboard',
    login: 'Log In Again',
    contact_support: 'Contact Support',
    reset_form: 'Reset Form',
    check_connection: 'Check Connection',
  };
  
  const actionIcons: Record<string, React.ReactNode> = {
    retry: <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />,
    refresh: <RefreshCwIcon className="h-4 w-4" aria-hidden="true" />,
    go_home: <HomeIcon className="h-4 w-4" aria-hidden="true" />,
    login: <UserIcon className="h-4 w-4" aria-hidden="true" />,
    contact_support: null,
    reset_form: null,
    check_connection: null,
  };
  
  return (
    <Button
      onClick={handler}
      variant={isPrimary ? 'primary' : 'secondary'}
      size="md"
      disabled={disabled || isLoading}
      className="inline-flex items-center gap-2"
      aria-describedby={action === 'retry' ? 'retry-description' : undefined}
    >
      {isLoading && action === 'retry' ? (
        <RefreshCwIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        actionIcons[action]
      )}
      {actionLabels[action] || action}
    </Button>
  );
}

/**
 * Error Details Component for development and debugging
 */
function ErrorDetails({ error, errorId }: { error: ProfileError; errorId: string }) {
  const [showDetails, setShowDetails] = useState(false);
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
        aria-expanded={showDetails}
        aria-controls="error-details"
      >
        {showDetails ? 'Hide' : 'Show'} Technical Details
      </button>
      
      {showDetails && (
        <div id="error-details" className="mt-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Error ID</p>
            <code className="mt-1 block text-xs text-gray-900 dark:text-gray-100">{errorId}</code>
          </div>
          
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Error Message</p>
            <code className="mt-1 block text-xs text-gray-900 dark:text-gray-100">{error.message}</code>
          </div>
          
          {error.code && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Error Code</p>
              <code className="mt-1 block text-xs text-gray-900 dark:text-gray-100">{error.code}</code>
            </div>
          )}
          
          {error.context && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Context</p>
              <code className="mt-1 block text-xs text-gray-900 dark:text-gray-100">{error.context}</code>
            </div>
          )}
          
          {error.stack && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Stack Trace</p>
              <pre className="mt-1 max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {error.stack}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Profile Error Boundary Component
 * 
 * Provides comprehensive error handling for the profile management route with
 * user-friendly recovery options and accessibility compliance. Implements
 * React 19 error boundary patterns with enhanced error categorization,
 * contextual messaging, and intelligent retry mechanisms for profile operations.
 * 
 * @param error - Error object from Next.js error boundary
 * @param reset - Reset function to retry the operation
 * @returns JSX element representing the error boundary UI
 */
export default function ProfileError({ error, reset }: ProfileErrorBoundaryProps) {
  // State management for error boundary
  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: true,
    error: error as ProfileError,
    errorId: `profile-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    retryCount: 0,
    isRetrying: false,
    lastRetryAt: null,
  });
  
  // Categorize the error for appropriate handling
  const errorCategory = categorizeError(state.error!);
  const categoryInfo = PROFILE_ERROR_CATEGORIES[errorCategory];
  const IconComponent = categoryInfo.icon;
  
  // Get contextual error message
  const contextualMessage = getContextualMessage(state.error!, errorCategory);
  
  // Log error for monitoring and debugging
  useEffect(() => {
    if (state.error && state.errorId) {
      const errorContext: ErrorContext = {
        errorId: state.errorId,
        component: 'ProfileErrorBoundary',
        route: '/profile',
        category: errorCategory,
        context: state.error.context || 'unknown',
        userId: null, // Would be populated from auth context
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        retryCount: state.retryCount,
      };
      
      logError(state.error, errorContext);
    }
  }, [state.error, state.errorId, errorCategory, state.retryCount]);
  
  // Retry handler with exponential backoff
  const handleRetry = useCallback(async () => {
    if (!state.error || state.isRetrying || state.retryCount >= MAX_RETRY_ATTEMPTS) {
      return;
    }
    
    // Check if error is retryable
    if (!shouldRetryError(state.error)) {
      return;
    }
    
    setState(prev => ({ ...prev, isRetrying: true }));
    
    try {
      // Calculate delay with exponential backoff
      const delay = getRetryDelay(state.retryCount, BASE_RETRY_DELAY);
      
      // Wait for the calculated delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Update state and attempt retry
      setState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        lastRetryAt: Date.now(),
        isRetrying: false,
      }));
      
      // Call the reset function to retry the operation
      reset();
      
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      setState(prev => ({ ...prev, isRetrying: false }));
    }
  }, [state.error, state.isRetrying, state.retryCount, reset]);
  
  // Recovery action handlers
  const recoveryActions = useRecoveryActions(state.error, reset, handleRetry);
  
  // Determine if retry is available
  const canRetry = categoryInfo.retryable && 
                   state.retryCount < MAX_RETRY_ATTEMPTS && 
                   !state.isRetrying;
  
  // Get available recovery actions for this error category
  const availableActions = categoryInfo.recoveryActions;
  
  // Announce error to screen readers
  useEffect(() => {
    const announcement = `Error occurred: ${categoryInfo.title}. ${contextualMessage}`;
    const srElement = document.getElementById('sr-announcements');
    if (srElement) {
      srElement.textContent = announcement;
    }
  }, [categoryInfo.title, contextualMessage]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Main Error Card */}
        <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          {/* Error Icon and Title */}
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 rounded-full p-2 ${
              categoryInfo.severity === 'error' 
                ? 'bg-red-100 dark:bg-red-900/20' 
                : 'bg-yellow-100 dark:bg-yellow-900/20'
            }`}>
              <IconComponent 
                className={`h-6 w-6 ${
                  categoryInfo.severity === 'error'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {categoryInfo.title}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Profile Management Error
              </p>
            </div>
          </div>
          
          {/* Error Description */}
          <div className="mt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {contextualMessage}
            </p>
            
            {/* Retry Information */}
            {state.retryCount > 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Retry attempts: {state.retryCount} of {MAX_RETRY_ATTEMPTS}
              </p>
            )}
            
            {state.lastRetryAt && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Last retry: {new Date(state.lastRetryAt).toLocaleTimeString()}
              </p>
            )}
          </div>
          
          {/* Recovery Actions */}
          <div className="mt-6 space-y-3">
            {/* Primary Action (Retry if available) */}
            {availableActions.includes('retry') && canRetry && (
              <div className="flex flex-col">
                <RecoveryActionButton
                  action="retry"
                  handler={recoveryActions.retry}
                  isPrimary={true}
                  isLoading={state.isRetrying}
                  disabled={!canRetry}
                />
                {canRetry && (
                  <p 
                    id="retry-description" 
                    className="mt-1 text-xs text-gray-500 dark:text-gray-400"
                  >
                    Automatically retries with increasing delays
                  </p>
                )}
              </div>
            )}
            
            {/* Secondary Actions */}
            <div className="flex flex-wrap gap-2">
              {availableActions
                .filter(action => action !== 'retry')
                .slice(0, 3) // Limit to 3 secondary actions to avoid clutter
                .map(action => (
                  <RecoveryActionButton
                    key={action}
                    action={action}
                    handler={recoveryActions[action as keyof typeof recoveryActions]}
                    isPrimary={false}
                  />
                ))}
            </div>
          </div>
          
          {/* Additional Help */}
          <Alert 
            variant={categoryInfo.severity === 'error' ? 'error' : 'warning'}
            className="mt-6"
          >
            <AlertTriangleIcon className="h-4 w-4" />
            <div>
              <p className="text-sm font-medium">
                Need additional help?
              </p>
              <p className="mt-1 text-sm">
                If this problem persists, please contact our support team with 
                error ID: <code className="font-mono text-xs">{state.errorId}</code>
              </p>
            </div>
          </Alert>
          
          {/* Development Error Details */}
          {state.error && state.errorId && (
            <ErrorDetails error={state.error} errorId={state.errorId} />
          )}
        </div>
        
        {/* Quick Navigation */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Having trouble with your profile?{' '}
            <button
              onClick={recoveryActions.go_home}
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Return to Dashboard
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Export error boundary configuration for Next.js
 */
export { ProfileError as default };

/**
 * Re-export types for use by other components
 */
export type { ProfileError, ErrorBoundaryState, ProfileErrorBoundaryProps };