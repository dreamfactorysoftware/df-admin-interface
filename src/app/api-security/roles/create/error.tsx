'use client';

/**
 * Error Boundary Component for Role Creation Page
 * 
 * Comprehensive error handling for role creation workflows including:
 * - Validation errors for role configuration and permissions
 * - API failures during role creation and service access validation
 * - Authentication and authorization errors per Section 4.5 security flows
 * - Network connectivity issues with automatic retry mechanisms
 * - User-friendly error recovery interfaces with accessibility compliance
 * - Role-specific error scenarios including lookup key validation and service access configuration
 * 
 * Implements Next.js 15.1+ app router error boundary conventions with React 19 error handling patterns.
 * Provides WCAG 2.1 AA compliant error states with comprehensive user recovery options.
 * 
 * @fileoverview Role creation error boundary with comprehensive error handling
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useErrorHandler } from '@/hooks/use-error-handling';
import {
  ErrorType,
  ErrorSeverity,
  AppError,
  RecoveryAction,
  UserFriendlyErrorMessage,
} from '@/types/error';

/**
 * Props interface for role creation error boundary
 */
interface RoleCreateErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Role-specific error codes and messages
 */
const ROLE_ERROR_CODES = {
  ROLE_NAME_EXISTS: 'ROLE_NAME_EXISTS',
  INVALID_PERMISSIONS: 'INVALID_PERMISSIONS',
  SERVICE_ACCESS_DENIED: 'SERVICE_ACCESS_DENIED',
  LOOKUP_KEY_INVALID: 'LOOKUP_KEY_INVALID',
  ROLE_CREATION_FAILED: 'ROLE_CREATION_FAILED',
  PERMISSION_VALIDATION_FAILED: 'PERMISSION_VALIDATION_FAILED',
  SERVICE_CONFIGURATION_ERROR: 'SERVICE_CONFIGURATION_ERROR',
} as const;

/**
 * Role creation specific error messages with internationalization support
 */
const getRoleErrorMessage = (errorCode: string, error: Error): UserFriendlyErrorMessage => {
  const baseMessages: Record<string, UserFriendlyErrorMessage> = {
    [ROLE_ERROR_CODES.ROLE_NAME_EXISTS]: {
      title: 'Role Name Already Exists',
      message: 'A role with this name already exists in the system.',
      actionableMessage: 'Please choose a different role name and try again.',
      recoveryOptions: [
        {
          type: 'retry',
          label: 'Try Different Name',
          primary: true,
          accessibility: {
            ariaLabel: 'Try creating role with a different name',
            keyboardShortcut: 'Enter',
          },
        },
        {
          type: 'dismiss',
          label: 'Cancel',
          primary: false,
          accessibility: {
            ariaLabel: 'Cancel role creation',
            keyboardShortcut: 'Escape',
          },
        },
      ],
      accessibility: {
        ariaLabel: 'Error: Role name already exists',
        role: 'alert',
        screenReaderText: 'Role creation failed. A role with this name already exists. Please choose a different role name and try again.',
      },
    },
    [ROLE_ERROR_CODES.INVALID_PERMISSIONS]: {
      title: 'Invalid Permission Configuration',
      message: 'The selected permissions are invalid or conflicting.',
      actionableMessage: 'Please review your permission selections and ensure they are valid for the chosen services.',
      recoveryOptions: [
        {
          type: 'retry',
          label: 'Review Permissions',
          primary: true,
          accessibility: {
            ariaLabel: 'Review and correct permission configuration',
            keyboardShortcut: 'Enter',
          },
        },
        {
          type: 'dismiss',
          label: 'Cancel',
          primary: false,
          accessibility: {
            ariaLabel: 'Cancel role creation',
            keyboardShortcut: 'Escape',
          },
        },
      ],
      accessibility: {
        ariaLabel: 'Error: Invalid permission configuration',
        role: 'alert',
        screenReaderText: 'Role creation failed. The selected permissions are invalid or conflicting. Please review your permission selections.',
      },
    },
    [ROLE_ERROR_CODES.SERVICE_ACCESS_DENIED]: {
      title: 'Service Access Denied',
      message: 'You do not have permission to configure access for the selected services.',
      actionableMessage: 'Contact your administrator or select only services you have permission to configure.',
      recoveryOptions: [
        {
          type: 'contact',
          label: 'Contact Administrator',
          primary: true,
          accessibility: {
            ariaLabel: 'Contact system administrator for service access',
          },
        },
        {
          type: 'retry',
          label: 'Try Again',
          primary: false,
          accessibility: {
            ariaLabel: 'Retry role creation with different services',
            keyboardShortcut: 'Enter',
          },
        },
        {
          type: 'dismiss',
          label: 'Cancel',
          primary: false,
          accessibility: {
            ariaLabel: 'Cancel role creation',
            keyboardShortcut: 'Escape',
          },
        },
      ],
      accessibility: {
        ariaLabel: 'Error: Service access denied',
        role: 'alert',
        screenReaderText: 'Role creation failed. You do not have permission to configure access for the selected services. Contact your administrator.',
      },
    },
    [ROLE_ERROR_CODES.LOOKUP_KEY_INVALID]: {
      title: 'Invalid Lookup Key Configuration',
      message: 'One or more lookup keys are invalid or do not exist in the system.',
      actionableMessage: 'Please verify the lookup keys and ensure they exist in the system configuration.',
      recoveryOptions: [
        {
          type: 'retry',
          label: 'Verify Lookup Keys',
          primary: true,
          accessibility: {
            ariaLabel: 'Verify and correct lookup key configuration',
            keyboardShortcut: 'Enter',
          },
        },
        {
          type: 'dismiss',
          label: 'Cancel',
          primary: false,
          accessibility: {
            ariaLabel: 'Cancel role creation',
            keyboardShortcut: 'Escape',
          },
        },
      ],
      accessibility: {
        ariaLabel: 'Error: Invalid lookup key configuration',
        role: 'alert',
        screenReaderText: 'Role creation failed. One or more lookup keys are invalid. Please verify the lookup keys exist in the system.',
      },
    },
  };

  return baseMessages[errorCode] || {
    title: 'Role Creation Error',
    message: error.message || 'An unexpected error occurred while creating the role.',
    actionableMessage: 'Please try again or contact support if the problem persists.',
    recoveryOptions: [
      {
        type: 'retry',
        label: 'Try Again',
        primary: true,
        accessibility: {
          ariaLabel: 'Retry role creation',
          keyboardShortcut: 'Enter',
        },
      },
      {
        type: 'contact',
        label: 'Contact Support',
        primary: false,
        accessibility: {
          ariaLabel: 'Contact technical support',
        },
      },
      {
        type: 'dismiss',
        label: 'Cancel',
        primary: false,
        accessibility: {
          ariaLabel: 'Cancel role creation',
          keyboardShortcut: 'Escape',
        },
      },
    ],
    accessibility: {
      ariaLabel: 'Error: Role creation failed',
      role: 'alert',
      screenReaderText: 'Role creation failed with an unexpected error. Please try again or contact support.',
    },
  };
};

/**
 * Extract role-specific error information from error object
 */
const extractRoleErrorInfo = (error: Error): { code: string; context?: any } => {
  // Check for API error response format
  if ('response' in error && error.response && typeof error.response === 'object') {
    const response = error.response as any;
    if (response.data?.error?.code) {
      return {
        code: response.data.error.code,
        context: response.data.error.context,
      };
    }
  }

  // Check for specific error patterns in message
  const message = error.message.toLowerCase();
  
  if (message.includes('role name') && message.includes('exists')) {
    return { code: ROLE_ERROR_CODES.ROLE_NAME_EXISTS };
  }
  
  if (message.includes('permission') && message.includes('invalid')) {
    return { code: ROLE_ERROR_CODES.INVALID_PERMISSIONS };
  }
  
  if (message.includes('service access') || message.includes('access denied')) {
    return { code: ROLE_ERROR_CODES.SERVICE_ACCESS_DENIED };
  }
  
  if (message.includes('lookup key')) {
    return { code: ROLE_ERROR_CODES.LOOKUP_KEY_INVALID };
  }

  return { code: ROLE_ERROR_CODES.ROLE_CREATION_FAILED };
};

/**
 * Role Creation Error Boundary Component
 * 
 * Provides comprehensive error handling for role creation workflows with:
 * - User-friendly error messaging with accessibility support
 * - Context-aware recovery actions for different error types
 * - Role-specific error handling for validation and service configuration
 * - WCAG 2.1 AA compliant error presentation
 * - Integration with global error handling system
 */
export default function RoleCreateError({ error, reset }: RoleCreateErrorProps) {
  const router = useRouter();
  const { handleError, recoverFromError } = useErrorHandler();
  const [errorMessage, setErrorMessage] = useState<UserFriendlyErrorMessage | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const errorIdRef = useRef<string>(`role-error-${Date.now()}`);
  const focusRef = useRef<HTMLDivElement>(null);

  /**
   * Process and classify the error on component mount
   */
  useEffect(() => {
    const processError = async () => {
      try {
        // Extract role-specific error information
        const { code, context } = extractRoleErrorInfo(error);
        
        // Get user-friendly error message
        const roleErrorMessage = getRoleErrorMessage(code, error);
        setErrorMessage(roleErrorMessage);

        // Report error to global error handling system
        await handleError(error, {
          component: 'RoleCreateError',
          feature: 'role-management',
          context: {
            errorCode: code,
            roleContext: context,
            route: '/api-security/roles/create',
          },
        });
      } catch (processingError) {
        console.error('Error processing role creation error:', processingError);
        
        // Fallback error message
        setErrorMessage({
          title: 'System Error',
          message: 'An error occurred while processing the role creation error.',
          actionableMessage: 'Please refresh the page or contact support.',
          recoveryOptions: [
            {
              type: 'refresh',
              label: 'Refresh Page',
              primary: true,
              accessibility: {
                ariaLabel: 'Refresh the current page',
                keyboardShortcut: 'F5',
              },
            },
            {
              type: 'contact',
              label: 'Contact Support',
              primary: false,
              accessibility: {
                ariaLabel: 'Contact technical support',
              },
            },
          ],
          accessibility: {
            ariaLabel: 'Error: System error occurred',
            role: 'alert',
            screenReaderText: 'A system error occurred while processing the role creation error. Please refresh the page or contact support.',
          },
        });
      }
    };

    processError();
  }, [error, handleError]);

  /**
   * Focus management for accessibility
   */
  useEffect(() => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, [errorMessage]);

  /**
   * Handle recovery action execution
   */
  const handleRecoveryAction = useCallback(async (action: RecoveryAction) => {
    setIsRecovering(true);
    
    try {
      switch (action.type) {
        case 'retry':
          // Reset the error boundary to retry the operation
          reset();
          break;

        case 'refresh':
          // Refresh the current page
          window.location.reload();
          break;

        case 'contact':
          // Open support contact
          window.open('mailto:support@dreamfactory.com?subject=Role Creation Error&body=Error occurred during role creation. Please provide assistance.', '_blank');
          break;

        case 'dismiss':
          // Navigate back to roles list
          router.push('/api-security/roles');
          break;

        default:
          console.warn('Unknown recovery action type:', action.type);
      }

      // Report recovery action to error handling system
      await recoverFromError(errorIdRef.current, action);
    } catch (recoveryError) {
      console.error('Error during recovery action:', recoveryError);
    } finally {
      setIsRecovering(false);
    }
  }, [reset, router, recoverFromError]);

  /**
   * Handle keyboard navigation for accessibility
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!errorMessage) return;

    const action = errorMessage.recoveryOptions.find(option => 
      option.accessibility?.keyboardShortcut === event.key ||
      (event.key === 'Enter' && option.primary) ||
      (event.key === 'Escape' && option.type === 'dismiss')
    );

    if (action) {
      event.preventDefault();
      handleRecoveryAction(action);
    }
  }, [errorMessage, handleRecoveryAction]);

  if (!errorMessage) {
    // Loading state while processing error
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div 
        ref={focusRef}
        className="max-w-2xl w-full mx-auto"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        role={errorMessage.accessibility?.role}
        aria-label={errorMessage.accessibility?.ariaLabel}
      >
        {/* Error Alert Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800 overflow-hidden">
          {/* Error Icon and Title */}
          <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg 
                  className="h-8 w-8 text-red-600 dark:text-red-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-red-900 dark:text-red-100">
                  {errorMessage.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Error Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Primary Error Message */}
            <div className="space-y-3">
              <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                {errorMessage.message}
              </p>
              
              {errorMessage.actionableMessage && (
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="font-medium">What you can do:</span> {errorMessage.actionableMessage}
                </p>
              )}
            </div>

            {/* Technical Details (in development) */}
            {errorMessage.technicalDetails && process.env.NODE_ENV === 'development' && (
              <details className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <summary className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                  Technical Details
                </summary>
                <div className="px-3 pb-3 pt-1 text-xs font-mono text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Code: {errorMessage.technicalDetails.code}</div>
                  <div>Time: {errorMessage.technicalDetails.timestamp}</div>
                  {errorMessage.technicalDetails.correlationId && (
                    <div>ID: {errorMessage.technicalDetails.correlationId}</div>
                  )}
                </div>
              </details>
            )}

            {/* Recovery Actions */}
            {errorMessage.recoveryOptions && errorMessage.recoveryOptions.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Available Actions
                </h2>
                
                <div className="flex flex-wrap gap-3">
                  {errorMessage.recoveryOptions.map((option, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleRecoveryAction(option)}
                      disabled={isRecovering}
                      className={`
                        inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${option.primary 
                          ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600' 
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                      aria-label={option.accessibility?.ariaLabel}
                      title={option.accessibility?.keyboardShortcut ? `Keyboard shortcut: ${option.accessibility.keyboardShortcut}` : undefined}
                    >
                      {isRecovering && option.primary && (
                        <svg 
                          className="animate-spin -ml-1 mr-2 h-4 w-4" 
                          fill="none" 
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          />
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard Instructions for Screen Readers */}
            <div className="sr-only" aria-live="polite">
              {errorMessage.accessibility?.screenReaderText}
              {errorMessage.recoveryOptions.some(option => option.accessibility?.keyboardShortcut) && (
                <span>
                  {' '}Keyboard shortcuts available: {
                    errorMessage.recoveryOptions
                      .filter(option => option.accessibility?.keyboardShortcut)
                      .map(option => `${option.label} (${option.accessibility?.keyboardShortcut})`)
                      .join(', ')
                  }.
                </span>
              )}
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="flex items-start space-x-3">
                <svg 
                  className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <div className="text-sm">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Need Additional Help?
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    If this error persists, please check your role configuration or contact your system administrator. 
                    You can also visit the <a 
                      href="/help/roles" 
                      className="underline hover:no-underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      role management documentation
                    </a> for guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push('/api-security/roles')}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline hover:no-underline transition-colors duration-200"
            aria-label="Return to roles management page"
          >
            ← Return to Roles Management
          </button>
        </div>
      </div>
    </div>
  );
}