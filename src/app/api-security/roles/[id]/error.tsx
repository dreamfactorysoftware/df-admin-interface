/**
 * Error Boundary Component for Role Editing Page
 * 
 * Comprehensive error handling for role editing workflows including validation errors,
 * API failures, role not found errors, and form submission issues. Provides user-friendly
 * error messages and recovery actions while maintaining application stability during
 * role editing operations.
 * 
 * Features:
 * - Next.js app router error boundary conventions
 * - Role-specific error handling (invalid ID, not found, permissions)
 * - User-friendly error recovery interfaces per Section 7.6 user interactions
 * - WCAG 2.1 AA accessibility compliance for error states
 * - Dynamic route error handling for invalid role ID parameters
 * - Internationalization support for error messages
 * - Integration with global error handling system
 * 
 * @fileoverview Error boundary for role editing page with comprehensive error handling
 * @version 1.0.0
 * @see Technical Specification Section 4.2 - ERROR HANDLING AND VALIDATION
 * @see Technical Specification Section 7.6 - USER INTERACTIONS
 * @see F-005 User and Role Management feature requirements
 */

'use client';

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { 
  ExclamationTriangleIcon, 
  ExclamationCircleIcon,
  ShieldExclamationIcon,
  WifiIcon,
  ArrowPathIcon,
  HomeIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useErrorHandler } from '@/hooks/use-error-handler';

// =============================================================================
// ERROR TYPES AND INTERFACES
// =============================================================================

/**
 * Role editing specific error types
 * Covers all possible error scenarios in role management workflows
 */
type RoleEditingErrorType = 
  | 'role-not-found'
  | 'invalid-role-id'
  | 'permission-denied'
  | 'network-error'
  | 'validation-error'
  | 'server-error'
  | 'service-configuration-error'
  | 'lookup-key-validation-error'
  | 'role-update-conflict'
  | 'role-deletion-error'
  | 'authentication-expired'
  | 'unknown-error';

/**
 * Error boundary props interface following Next.js conventions
 */
interface RoleErrorBoundaryProps {
  /** Error object from Next.js error boundary */
  error: Error & { digest?: string };
  /** Reset function to retry the page */
  reset: () => void;
}

/**
 * Error classification configuration
 * Maps error patterns to specific error types for better user experience
 */
interface ErrorClassification {
  type: RoleEditingErrorType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  requiresAuth: boolean;
  suggestedActions: RecoveryAction[];
}

/**
 * Recovery action configuration
 * Defines available user actions for error recovery
 */
interface RecoveryAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void | Promise<void>;
  primary?: boolean;
  requiresConfirmation?: boolean;
  confirmationText?: string;
  disabled?: boolean;
  loading?: boolean;
}

// =============================================================================
// ERROR CLASSIFICATION SYSTEM
// =============================================================================

/**
 * Classify error based on error message, status code, and context
 * Returns appropriate error type and user-facing configuration
 */
const classifyRoleError = (
  error: Error, 
  roleId?: string
): ErrorClassification => {
  const message = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';
  
  // Role not found errors (404)
  if (
    message.includes('role not found') ||
    message.includes('404') ||
    message.includes('not found') ||
    errorName.includes('notfound')
  ) {
    return {
      type: 'role-not-found',
      title: 'Role Not Found',
      description: `The role with ID "${roleId}" could not be found. It may have been deleted or you may not have permission to access it.`,
      icon: UserGroupIcon,
      severity: 'medium',
      recoverable: true,
      requiresAuth: false,
      suggestedActions: ['back-to-roles', 'try-different-id', 'refresh-page']
    } as ErrorClassification;
  }
  
  // Invalid role ID format
  if (
    message.includes('invalid id') ||
    message.includes('invalid role') ||
    message.includes('malformed') ||
    (roleId && !/^[a-zA-Z0-9_-]+$/.test(roleId))
  ) {
    return {
      type: 'invalid-role-id',
      title: 'Invalid Role ID',
      description: `The role ID "${roleId}" is not valid. Role IDs must contain only letters, numbers, hyphens, and underscores.`,
      icon: ExclamationCircleIcon,
      severity: 'medium',
      recoverable: true,
      requiresAuth: false,
      suggestedActions: ['back-to-roles', 'try-different-id']
    } as ErrorClassification;
  }
  
  // Permission and authorization errors (403)
  if (
    message.includes('permission denied') ||
    message.includes('access denied') ||
    message.includes('forbidden') ||
    message.includes('403') ||
    message.includes('unauthorized') ||
    message.includes('401')
  ) {
    return {
      type: 'permission-denied',
      title: 'Access Denied',
      description: 'You do not have permission to edit this role. Please contact your administrator if you need access to role management.',
      icon: ShieldExclamationIcon,
      severity: 'high',
      recoverable: false,
      requiresAuth: true,
      suggestedActions: ['contact-admin', 'back-to-dashboard', 'logout']
    } as ErrorClassification;
  }
  
  // Authentication expired
  if (
    message.includes('session expired') ||
    message.includes('token expired') ||
    message.includes('authentication') ||
    errorName.includes('authentication')
  ) {
    return {
      type: 'authentication-expired',
      title: 'Session Expired',
      description: 'Your session has expired. Please log in again to continue editing roles.',
      icon: ShieldExclamationIcon,
      severity: 'high',
      recoverable: true,
      requiresAuth: true,
      suggestedActions: ['relogin', 'refresh-page']
    } as ErrorClassification;
  }
  
  // Network and connectivity errors
  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    errorName.includes('network') ||
    errorName.includes('fetch')
  ) {
    return {
      type: 'network-error',
      title: 'Network Error',
      description: 'Unable to connect to the server. Please check your internet connection and try again.',
      icon: WifiIcon,
      severity: 'medium',
      recoverable: true,
      requiresAuth: false,
      suggestedActions: ['retry', 'refresh-page', 'check-connection']
    } as ErrorClassification;
  }
  
  // Validation errors
  if (
    message.includes('validation') ||
    message.includes('invalid data') ||
    message.includes('required field') ||
    message.includes('lookup key') ||
    errorName.includes('validation')
  ) {
    return {
      type: 'validation-error',
      title: 'Validation Error',
      description: 'The role data contains invalid information. Please check the form and correct any errors.',
      icon: ExclamationTriangleIcon,
      severity: 'medium',
      recoverable: true,
      requiresAuth: false,
      suggestedActions: ['retry', 'back-to-roles', 'refresh-page']
    } as ErrorClassification;
  }
  
  // Server errors (500+)
  if (
    message.includes('500') ||
    message.includes('server error') ||
    message.includes('internal error') ||
    errorName.includes('server')
  ) {
    return {
      type: 'server-error',
      title: 'Server Error',
      description: 'The server encountered an error while processing your request. Please try again later.',
      icon: ExclamationCircleIcon,
      severity: 'high',
      recoverable: true,
      requiresAuth: false,
      suggestedActions: ['retry', 'contact-admin', 'back-to-roles']
    } as ErrorClassification;
  }
  
  // Service configuration errors
  if (
    message.includes('service') ||
    message.includes('configuration') ||
    message.includes('setup')
  ) {
    return {
      type: 'service-configuration-error',
      title: 'Service Configuration Error',
      description: 'There is an issue with the role management service configuration. Please contact your administrator.',
      icon: ExclamationTriangleIcon,
      severity: 'high',
      recoverable: false,
      requiresAuth: false,
      suggestedActions: ['contact-admin', 'back-to-dashboard']
    } as ErrorClassification;
  }
  
  // Default unknown error
  return {
    type: 'unknown-error',
    title: 'Unexpected Error',
    description: 'An unexpected error occurred while loading the role. Please try again or contact support if the problem persists.',
    icon: ExclamationCircleIcon,
    severity: 'medium',
    recoverable: true,
    requiresAuth: false,
    suggestedActions: ['retry', 'refresh-page', 'back-to-roles', 'contact-admin']
  } as ErrorClassification;
};

// =============================================================================
// RECOVERY ACTIONS SYSTEM
// =============================================================================

/**
 * Role Error Boundary Component
 * Implements Next.js app router error boundary conventions with comprehensive
 * error handling for role editing workflows
 */
export default function RoleError({ error, reset }: RoleErrorBoundaryProps) {
  const router = useRouter();
  const params = useParams();
  const roleId = params?.id as string;
  
  // Error handling hook integration
  const {
    handleError,
    retryWithBackoff,
    reportError,
    getErrorMetrics,
  } = useErrorHandler();
  
  // Component state
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState<ErrorClassification | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  
  // Classify the error on mount and when error changes
  useEffect(() => {
    const classification = classifyRoleError(error, roleId);
    setErrorDetails(classification);
    
    // Report error to monitoring system
    handleError(error, {
      context: 'role-editing',
      roleId,
      page: 'role-error-boundary',
      classification: classification.type,
      severity: classification.severity,
    });
    
    // Report to external error tracking if critical
    if (classification.severity === 'critical' || classification.severity === 'high') {
      reportError(error, {
        tags: ['role-editing', 'error-boundary'],
        extra: { roleId, errorType: classification.type },
      });
    }
  }, [error, roleId, handleError, reportError]);
  
  // Recovery action implementations
  const recoveryActions = useMemo((): Record<string, RecoveryAction> => ({
    'retry': {
      id: 'retry',
      label: 'Try Again',
      description: 'Retry loading the role',
      icon: ArrowPathIcon,
      action: async () => {
        setIsRetrying(true);
        try {
          await retryWithBackoff(
            () => reset(),
            {
              maxRetries: 3,
              baseDelay: 1000,
              maxDelay: 5000,
            }
          );
          setRetryCount(prev => prev + 1);
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        } finally {
          setIsRetrying(false);
        }
      },
      primary: true,
      loading: isRetrying,
    },
    
    'refresh-page': {
      id: 'refresh-page',
      label: 'Refresh Page',
      description: 'Reload the current page',
      icon: ArrowPathIcon,
      action: () => {
        window.location.reload();
      },
    },
    
    'back-to-roles': {
      id: 'back-to-roles',
      label: 'Back to Roles',
      description: 'Return to the roles list',
      icon: ArrowLeftIcon,
      action: () => {
        router.push('/api-security/roles');
      },
      primary: true,
    },
    
    'back-to-dashboard': {
      id: 'back-to-dashboard',
      label: 'Go to Dashboard',
      description: 'Return to the main dashboard',
      icon: HomeIcon,
      action: () => {
        router.push('/');
      },
    },
    
    'try-different-id': {
      id: 'try-different-id',
      label: 'Try Different Role ID',
      description: 'Enter a different role ID',
      icon: UserGroupIcon,
      action: () => {
        const newRoleId = prompt('Enter role ID:', roleId || '');
        if (newRoleId && newRoleId.trim() && newRoleId !== roleId) {
          router.push(`/api-security/roles/${encodeURIComponent(newRoleId.trim())}`);
        }
      },
      requiresConfirmation: true,
      confirmationText: 'Enter a different role ID to access',
    },
    
    'contact-admin': {
      id: 'contact-admin',
      label: 'Contact Administrator',
      description: 'Get help from your system administrator',
      icon: InformationCircleIcon,
      action: () => {
        // Create mailto link or show contact info
        const subject = `Role Editing Error - ${errorDetails?.type || 'Unknown'}`;
        const body = `Error details:\n\nRole ID: ${roleId}\nError: ${error.message}\nPage: Role Editing\nTime: ${new Date().toISOString()}`;
        const mailtoLink = `mailto:admin@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
      },
    },
    
    'logout': {
      id: 'logout',
      label: 'Log Out',
      description: 'Log out and return to login page',
      icon: ArrowLeftIcon,
      action: () => {
        // Implement logout logic
        router.push('/login');
      },
      requiresConfirmation: true,
      confirmationText: 'Are you sure you want to log out?',
    },
    
    'relogin': {
      id: 'relogin',
      label: 'Log In Again',
      description: 'Redirect to login page',
      icon: ShieldExclamationIcon,
      action: () => {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      },
      primary: true,
    },
    
    'check-connection': {
      id: 'check-connection',
      label: 'Check Connection',
      description: 'Verify your internet connection',
      icon: WifiIcon,
      action: () => {
        // Simple connectivity check
        if (navigator.onLine) {
          alert('Your device appears to be connected to the internet. The issue may be with the server.');
        } else {
          alert('Your device appears to be offline. Please check your internet connection.');
        }
      },
    },
  }), [reset, router, roleId, error.message, errorDetails?.type, retryWithBackoff, isRetrying]);
  
  // Handle recovery action execution
  const executeRecoveryAction = useCallback(async (actionId: string) => {
    const action = recoveryActions[actionId];
    if (!action) return;
    
    // Show confirmation if required
    if (action.requiresConfirmation) {
      const confirmed = window.confirm(
        action.confirmationText || `Are you sure you want to ${action.label.toLowerCase()}?`
      );
      if (!confirmed) return;
    }
    
    try {
      await action.action();
    } catch (actionError) {
      console.error(`Recovery action "${actionId}" failed:`, actionError);
      handleError(actionError as Error, {
        context: 'recovery-action',
        actionId,
        originalError: error.message,
      });
    }
  }, [recoveryActions, handleError, error.message]);
  
  // Get error metrics for display
  const errorMetrics = getErrorMetrics();
  
  if (!errorDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  const IconComponent = errorDetails.icon;
  const suggestedActions = errorDetails.suggestedActions.map(id => recoveryActions[id]).filter(Boolean);
  const primaryActions = suggestedActions.filter(action => action.primary);
  const secondaryActions = suggestedActions.filter(action => !action.primary);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Main Error Alert */}
        <Alert
          type={errorDetails.severity === 'critical' || errorDetails.severity === 'high' ? 'error' : 'warning'}
          variant="soft"
          size="lg"
          className="text-center"
          announcement={`${errorDetails.title}: ${errorDetails.description}`}
          aria-live="assertive"
          role="alert"
        >
          <Alert.Icon>
            <IconComponent className="h-8 w-8 mx-auto" />
          </Alert.Icon>
          
          <Alert.Content
            title={errorDetails.title}
            description={errorDetails.description}
            className="text-center"
          />
        </Alert>
        
        {/* Role ID Display */}
        {roleId && (
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Role ID: <span className="font-mono font-medium">{roleId}</span>
            </div>
          </div>
        )}
        
        {/* Primary Recovery Actions */}
        {primaryActions.length > 0 && (
          <div className="space-y-3">
            {primaryActions.map((action) => (
              <Button
                key={action.id}
                onClick={() => executeRecoveryAction(action.id)}
                disabled={action.disabled}
                loading={action.loading}
                variant="primary"
                size="lg"
                className="w-full"
                icon={<action.icon className="h-5 w-5" />}
                ariaLabel={action.description}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        
        {/* Secondary Recovery Actions */}
        {secondaryActions.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {secondaryActions.map((action) => (
              <Button
                key={action.id}
                onClick={() => executeRecoveryAction(action.id)}
                disabled={action.disabled}
                loading={action.loading}
                variant="outline"
                size="md"
                icon={<action.icon className="h-4 w-4" />}
                ariaLabel={action.description}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        
        {/* Additional Information */}
        <div className="space-y-4">
          {/* Retry Information */}
          {retryCount > 0 && (
            <Alert
              type="info"
              variant="soft"
              size="sm"
              description={`Attempted ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'}`}
            />
          )}
          
          {/* Error Rate Information */}
          {errorMetrics.errorRate > 0.1 && (
            <Alert
              type="warning"
              variant="soft"
              size="sm"
              title="High Error Rate Detected"
              description="The system is experiencing higher than normal error rates. Please try again later."
            />
          )}
          
          {/* Technical Details Toggle */}
          <div className="text-center">
            <Button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400"
            >
              {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
            </Button>
          </div>
          
          {/* Technical Details */}
          {showTechnicalDetails && (
            <Alert
              type="info"
              variant="outlined"
              size="sm"
              className="text-left"
            >
              <Alert.Content>
                <div className="space-y-2 text-xs font-mono">
                  <div><strong>Error Type:</strong> {errorDetails.type}</div>
                  <div><strong>Error Name:</strong> {error.name}</div>
                  <div><strong>Error Message:</strong> {error.message}</div>
                  {error.digest && (
                    <div><strong>Error Digest:</strong> {error.digest}</div>
                  )}
                  <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
                  <div><strong>Page:</strong> /api-security/roles/[id]</div>
                  {roleId && <div><strong>Role ID:</strong> {roleId}</div>}
                </div>
              </Alert.Content>
            </Alert>
          )}
        </div>
        
        {/* Screen Reader Instructions */}
        <div className="sr-only" aria-live="polite">
          Role editing error occurred. Error type: {errorDetails.type}. 
          {suggestedActions.length > 0 && (
            ` Available actions: ${suggestedActions.map(a => a.label).join(', ')}.`
          )}
          Use Tab key to navigate between action buttons and Enter to activate.
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS AND UTILITIES
// =============================================================================

/**
 * Error boundary wrapper for development and testing
 * Provides additional error context and debugging information
 */
export function RoleErrorBoundaryWrapper({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ComponentType<RoleErrorBoundaryProps>;
}) {
  const FallbackComponent = fallback || RoleError;
  
  return (
    <React.Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    }>
      {children}
    </React.Suspense>
  );
}

/**
 * Export error classification utilities for use in other components
 */
export { classifyRoleError, type RoleEditingErrorType, type ErrorClassification };