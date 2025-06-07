/**
 * API Security Section Error Boundary Component
 * 
 * Next.js error boundary component for the API security section that handles and displays
 * errors in limits and roles management workflows. Provides user-friendly error messages
 * and recovery actions while maintaining application stability and WCAG 2.1 AA compliance.
 * 
 * Features:
 * - Next.js app router error boundary following Next.js 15.1+ conventions
 * - Error recovery actions and retry mechanisms per Section 4.2 error handling requirements
 * - User-friendly error messages with internationalization support
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Tailwind CSS styling per React/Next.js Integration Requirements
 * - Integration with existing Alert and Button UI components
 * - Comprehensive error categorization for security-specific errors
 * - Error reporting and monitoring integration
 * - Graceful degradation and fallback UI patterns
 * 
 * Error Types Handled:
 * - Role management authorization errors
 * - API limits configuration validation errors
 * - Security policy enforcement failures
 * - Network connectivity issues during security operations
 * - Server-side security validation errors
 * - Authentication token expiration in security context
 * 
 * @fileoverview Next.js error boundary for API security section
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 4.2 - ERROR HANDLING AND VALIDATION
 * @see Technical Specification Section 7.6 - USER INTERACTIONS
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  ChevronRightIcon,
  ShieldExclamationIcon,
  KeyIcon,
  UserIcon,
  CogIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useErrorHandler } from '@/hooks/use-error-handling';
import { cn } from '@/lib/utils';
import {
  ErrorType,
  ErrorSeverity,
  ErrorCategory,
  BaseError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
} from '@/types/error';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Next.js error boundary props interface
 * Follows Next.js 15.1+ error boundary conventions
 */
interface ErrorBoundaryProps {
  /** Error object from Next.js error boundary */
  error: Error & { digest?: string };
  /** Reset function to retry the failed operation */
  reset: () => void;
}

/**
 * Security-specific error classification
 */
interface SecurityError extends BaseError {
  /** Security domain where error occurred */
  securityDomain: 'roles' | 'limits' | 'policies' | 'authentication' | 'authorization';
  /** Resource that was being accessed when error occurred */
  affectedResource?: string;
  /** User action that triggered the error */
  userAction?: string;
  /** Whether this error affects system security posture */
  securityImpact: boolean;
}

/**
 * Error recovery action interface
 */
interface RecoveryAction {
  /** Unique identifier for the action */
  id: string;
  /** User-visible label for the action */
  label: string;
  /** Description of what the action does */
  description: string;
  /** Action handler function */
  handler: () => void | Promise<void>;
  /** Whether this is the primary recovery action */
  primary?: boolean;
  /** Icon for the action button */
  icon?: React.ComponentType<any>;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * Error message template interface
 */
interface ErrorMessageTemplate {
  /** Error title for display */
  title: string;
  /** Detailed error description */
  description: string;
  /** Additional context or troubleshooting information */
  context?: string;
  /** Available recovery actions */
  actions: RecoveryAction[];
  /** Error severity for styling */
  severity: ErrorSeverity;
  /** Whether to show technical details */
  showTechnicalDetails?: boolean;
}

// =============================================================================
// ERROR CLASSIFICATION AND MESSAGING
// =============================================================================

/**
 * Security-specific error classifier
 * Analyzes errors to determine appropriate user messaging and recovery actions
 */
class SecurityErrorClassifier {
  /**
   * Classify an error and generate appropriate messaging
   */
  static classifyError(error: Error, reset: () => void): ErrorMessageTemplate {
    // Analyze error characteristics
    const errorString = error.message.toLowerCase();
    const stackTrace = error.stack || '';
    
    // Network errors
    if (this.isNetworkError(error, errorString)) {
      return this.createNetworkErrorTemplate(error, reset);
    }
    
    // Authentication errors
    if (this.isAuthenticationError(error, errorString)) {
      return this.createAuthenticationErrorTemplate(error, reset);
    }
    
    // Authorization errors
    if (this.isAuthorizationError(error, errorString)) {
      return this.createAuthorizationErrorTemplate(error, reset);
    }
    
    // Validation errors
    if (this.isValidationError(error, errorString)) {
      return this.createValidationErrorTemplate(error, reset);
    }
    
    // Role management specific errors
    if (this.isRoleManagementError(error, errorString)) {
      return this.createRoleManagementErrorTemplate(error, reset);
    }
    
    // Limits configuration specific errors
    if (this.isLimitsConfigurationError(error, errorString)) {
      return this.createLimitsConfigurationErrorTemplate(error, reset);
    }
    
    // Server errors
    if (this.isServerError(error, errorString)) {
      return this.createServerErrorTemplate(error, reset);
    }
    
    // Generic fallback
    return this.createGenericErrorTemplate(error, reset);
  }
  
  // Error type detection methods
  private static isNetworkError(error: Error, errorString: string): boolean {
    return errorString.includes('fetch') || 
           errorString.includes('network') || 
           errorString.includes('connection') ||
           errorString.includes('timeout') ||
           error.name === 'NetworkError';
  }
  
  private static isAuthenticationError(error: Error, errorString: string): boolean {
    return errorString.includes('unauthorized') ||
           errorString.includes('401') ||
           errorString.includes('token') ||
           errorString.includes('session expired') ||
           errorString.includes('authentication');
  }
  
  private static isAuthorizationError(error: Error, errorString: string): boolean {
    return errorString.includes('forbidden') ||
           errorString.includes('403') ||
           errorString.includes('access denied') ||
           errorString.includes('permission') ||
           errorString.includes('insufficient privileges');
  }
  
  private static isValidationError(error: Error, errorString: string): boolean {
    return errorString.includes('validation') ||
           errorString.includes('invalid') ||
           errorString.includes('required') ||
           errorString.includes('format') ||
           error.name === 'ValidationError';
  }
  
  private static isRoleManagementError(error: Error, errorString: string): boolean {
    return errorString.includes('role') ||
           errorString.includes('user role') ||
           errorString.includes('role assignment') ||
           errorString.includes('role permission');
  }
  
  private static isLimitsConfigurationError(error: Error, errorString: string): boolean {
    return errorString.includes('limit') ||
           errorString.includes('quota') ||
           errorString.includes('rate limit') ||
           errorString.includes('api limit');
  }
  
  private static isServerError(error: Error, errorString: string): boolean {
    return errorString.includes('500') ||
           errorString.includes('internal server') ||
           errorString.includes('server error') ||
           errorString.includes('service unavailable');
  }
  
  // Error template creation methods
  private static createNetworkErrorTemplate(error: Error, reset: () => void): ErrorMessageTemplate {
    return {
      title: 'Connection Problem',
      description: 'Unable to connect to the DreamFactory server. Please check your network connection and try again.',
      context: 'This error typically occurs when there are network connectivity issues or the server is temporarily unavailable.',
      severity: ErrorSeverity.HIGH,
      actions: [
        {
          id: 'retry',
          label: 'Retry Connection',
          description: 'Attempt to reconnect to the server',
          handler: reset,
          primary: true,
          icon: ArrowPathIcon,
          ariaLabel: 'Retry connection to DreamFactory server'
        },
        {
          id: 'check-status',
          label: 'Check Server Status',
          description: 'View server status and diagnostics',
          handler: () => window.open('/system-settings/system-info', '_blank'),
          icon: CogIcon,
          ariaLabel: 'Open server status page in new tab'
        }
      ]
    };
  }
  
  private static createAuthenticationErrorTemplate(error: Error, reset: () => void): ErrorMessageTemplate {
    return {
      title: 'Authentication Required',
      description: 'Your session has expired or you need to log in again to access API security settings.',
      context: 'Security operations require valid authentication credentials. Please log in with an account that has administrative privileges.',
      severity: ErrorSeverity.HIGH,
      actions: [
        {
          id: 'login',
          label: 'Log In Again',
          description: 'Redirect to login page to re-authenticate',
          handler: () => window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname),
          primary: true,
          icon: KeyIcon,
          ariaLabel: 'Redirect to login page for re-authentication'
        },
        {
          id: 'retry',
          label: 'Retry Operation',
          description: 'Try the operation again if you believe you are authenticated',
          handler: reset,
          icon: ArrowPathIcon,
          ariaLabel: 'Retry the failed security operation'
        }
      ]
    };
  }
  
  private static createAuthorizationErrorTemplate(error: Error, reset: () => void): ErrorMessageTemplate {
    return {
      title: 'Access Denied',
      description: 'You do not have sufficient permissions to perform this security operation.',
      context: 'API security configuration requires administrator-level permissions. Contact your system administrator to request access.',
      severity: ErrorSeverity.MEDIUM,
      actions: [
        {
          id: 'contact-admin',
          label: 'Contact Administrator',
          description: 'Get help from your system administrator',
          handler: () => window.location.href = 'mailto:admin@dreamfactory.com?subject=Access Request for API Security',
          primary: true,
          icon: UserIcon,
          ariaLabel: 'Open email to contact system administrator'
        },
        {
          id: 'dashboard',
          label: 'Return to Dashboard',
          description: 'Go back to the main dashboard',
          handler: () => window.location.href = '/',
          icon: HomeIcon,
          ariaLabel: 'Navigate to main dashboard'
        }
      ]
    };
  }
  
  private static createValidationErrorTemplate(error: Error, reset: () => void): ErrorMessageTemplate {
    return {
      title: 'Invalid Configuration',
      description: 'The security configuration contains invalid or missing information that must be corrected.',
      context: 'Please review your input and ensure all required fields are properly filled with valid values.',
      severity: ErrorSeverity.MEDIUM,
      actions: [
        {
          id: 'retry',
          label: 'Review Configuration',
          description: 'Go back to review and correct the configuration',
          handler: reset,
          primary: true,
          icon: ArrowPathIcon,
          ariaLabel: 'Return to configuration form to correct validation errors'
        }
      ],
      showTechnicalDetails: true
    };
  }
  
  private static createRoleManagementErrorTemplate(error: Error, reset: () => void): ErrorMessageTemplate {
    return {
      title: 'Role Management Error',
      description: 'An error occurred while managing user roles or permissions.',
      context: 'This could be due to conflicting role assignments, invalid permission combinations, or system constraints.',
      severity: ErrorSeverity.MEDIUM,
      actions: [
        {
          id: 'retry',
          label: 'Retry Operation',
          description: 'Attempt the role operation again',
          handler: reset,
          primary: true,
          icon: ArrowPathIcon,
          ariaLabel: 'Retry the role management operation'
        },
        {
          id: 'roles-list',
          label: 'View All Roles',
          description: 'Return to the roles management page',
          handler: () => window.location.href = '/api-security/roles',
          icon: UserIcon,
          ariaLabel: 'Navigate to roles management page'
        }
      ]
    };
  }
  
  private static createLimitsConfigurationErrorTemplate(error: Error, reset: () => void): ErrorMessageTemplate {
    return {
      title: 'API Limits Configuration Error',
      description: 'An error occurred while configuring API rate limits or quotas.',
      context: 'This could be due to invalid limit values, conflicting configurations, or system capacity constraints.',
      severity: ErrorSeverity.MEDIUM,
      actions: [
        {
          id: 'retry',
          label: 'Retry Configuration',
          description: 'Attempt to save the limits configuration again',
          handler: reset,
          primary: true,
          icon: ArrowPathIcon,
          ariaLabel: 'Retry the API limits configuration operation'
        },
        {
          id: 'limits-list',
          label: 'View All Limits',
          description: 'Return to the API limits management page',
          handler: () => window.location.href = '/api-security/limits',
          icon: ShieldExclamationIcon,
          ariaLabel: 'Navigate to API limits management page'
        }
      ]
    };
  }
  
  private static createServerErrorTemplate(error: Error, reset: () => void): ErrorMessageTemplate {
    return {
      title: 'Server Error',
      description: 'The DreamFactory server encountered an internal error while processing your security operation.',
      context: 'This is typically a temporary issue. If the problem persists, please contact technical support.',
      severity: ErrorSeverity.HIGH,
      actions: [
        {
          id: 'retry',
          label: 'Try Again',
          description: 'Retry the operation after a brief delay',
          handler: () => setTimeout(reset, 2000),
          primary: true,
          icon: ArrowPathIcon,
          ariaLabel: 'Retry the operation after a 2 second delay'
        },
        {
          id: 'support',
          label: 'Contact Support',
          description: 'Get help from technical support',
          handler: () => window.open('https://support.dreamfactory.com', '_blank'),
          icon: CogIcon,
          ariaLabel: 'Open technical support page in new tab'
        }
      ],
      showTechnicalDetails: true
    };
  }
  
  private static createGenericErrorTemplate(error: Error, reset: () => void): ErrorMessageTemplate {
    return {
      title: 'Unexpected Error',
      description: 'An unexpected error occurred in the API security section. The application will attempt to recover automatically.',
      context: 'If this error continues to occur, please try refreshing the page or contact support.',
      severity: ErrorSeverity.MEDIUM,
      actions: [
        {
          id: 'retry',
          label: 'Try Again',
          description: 'Attempt to recover from the error',
          handler: reset,
          primary: true,
          icon: ArrowPathIcon,
          ariaLabel: 'Attempt to recover from the unexpected error'
        },
        {
          id: 'refresh',
          label: 'Refresh Page',
          description: 'Reload the entire page to reset the application state',
          handler: () => window.location.reload(),
          icon: ArrowPathIcon,
          ariaLabel: 'Reload the entire page to reset application state'
        },
        {
          id: 'dashboard',
          label: 'Return to Dashboard',
          description: 'Go back to the main dashboard',
          handler: () => window.location.href = '/',
          icon: HomeIcon,
          ariaLabel: 'Navigate to main dashboard'
        }
      ],
      showTechnicalDetails: true
    };
  }
}

// =============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * API Security Error Boundary Component
 * 
 * Next.js error boundary specifically designed for the API security section.
 * Provides contextual error handling for roles and limits management workflows
 * with comprehensive recovery options and accessibility features.
 */
export default function ApiSecurityError({ error, reset }: ErrorBoundaryProps) {
  // State for error reporting and UI management
  const [isReporting, setIsReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  
  // Hooks and utilities
  const router = useRouter();
  const { handleError, reportError } = useErrorHandler();
  const errorReportedRef = useRef(false);
  
  // Classify the error and generate messaging
  const errorTemplate = SecurityErrorClassifier.classifyError(error, reset);
  
  // Error reporting effect
  useEffect(() => {
    if (!errorReportedRef.current) {
      // Create structured error object for reporting
      const structuredError: SecurityError = {
        type: ErrorType.SYSTEM,
        severity: errorTemplate.severity,
        category: ErrorCategory.SECURITY,
        code: 'API_SECURITY_ERROR',
        message: error.message,
        originalError: error,
        isRetryable: true,
        timestamp: new Date().toISOString(),
        userFacing: true,
        securityDomain: determineSecurityDomain(error),
        affectedResource: extractAffectedResource(error),
        userAction: extractUserAction(),
        securityImpact: assessSecurityImpact(error),
        context: {
          page: 'api-security',
          route: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }
      };
      
      // Report error to monitoring system
      handleError(structuredError);
      errorReportedRef.current = true;
    }
  }, [error, handleError, errorTemplate.severity]);
  
  // Enhanced retry function with counter
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    
    // Add delay for repeated retries to avoid rapid succession
    if (retryCount > 0) {
      setTimeout(() => {
        reset();
      }, Math.min(retryCount * 1000, 5000)); // Max 5 second delay
    } else {
      reset();
    }
  }, [reset, retryCount]);
  
  // Error report submission
  const handleSendReport = useCallback(async () => {
    setIsReporting(true);
    
    try {
      await reportError({
        error,
        context: {
          section: 'api-security',
          userDescription: 'Error in API security management',
          retryCount,
          timestamp: new Date().toISOString(),
        }
      });
      
      setReportSent(true);
    } catch (reportingError) {
      console.error('Failed to send error report:', reportingError);
    } finally {
      setIsReporting(false);
    }
  }, [error, reportError, retryCount]);
  
  // Enhanced action handlers that include analytics
  const createActionHandler = useCallback((action: RecoveryAction) => {
    return async () => {
      try {
        // Track action usage for UX improvements
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'error_recovery_action', {
            action_id: action.id,
            error_type: errorTemplate.title,
            section: 'api-security'
          });
        }
        
        await action.handler();
      } catch (actionError) {
        console.error(`Error recovery action failed: ${action.id}`, actionError);
        
        // Fallback to simple retry if action fails
        if (action.id !== 'retry') {
          handleRetry();
        }
      }
    };
  }, [errorTemplate.title, handleRetry]);
  
  // Determine alert type based on error severity
  const alertType = errorTemplate.severity === ErrorSeverity.CRITICAL ? 'error' :
                   errorTemplate.severity === ErrorSeverity.HIGH ? 'error' :
                   errorTemplate.severity === ErrorSeverity.MEDIUM ? 'warning' : 'info';
  
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4"
      role="main"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="w-full max-w-2xl space-y-6">
        {/* Primary Error Alert */}
        <Alert
          type={alertType}
          variant="soft"
          size="lg"
          title={errorTemplate.title}
          description={errorTemplate.description}
          announceText={`Error in API security: ${errorTemplate.title}`}
          priority="high"
          className="shadow-lg"
          aria-live="assertive"
        >
          {/* Error Context */}
          {errorTemplate.context && (
            <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Additional Information:</strong> {errorTemplate.context}
              </p>
            </div>
          )}
          
          {/* Retry Information */}
          {retryCount > 0 && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Retry Attempts:</strong> {retryCount} 
                {retryCount >= 3 && " (Consider refreshing the page if the issue persists)"}
              </p>
            </div>
          )}
        </Alert>
        
        {/* Recovery Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2" aria-hidden="true" />
            <h2 
              id="recovery-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Recovery Options
            </h2>
          </div>
          
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
            {errorTemplate.actions.map((action, index) => {
              const IconComponent = action.icon || ArrowPathIcon;
              const isPrimary = action.primary || index === 0;
              
              return (
                <Button
                  key={action.id}
                  variant={isPrimary ? "primary" : "outline"}
                  size="md"
                  onClick={createActionHandler(action)}
                  className={cn(
                    "flex items-center justify-center gap-2 p-4 h-auto",
                    "text-left hover:shadow-md transition-shadow"
                  )}
                  aria-label={action.ariaLabel || action.label}
                  aria-describedby={`action-desc-${action.id}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <IconComponent className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{action.label}</div>
                      <div 
                        id={`action-desc-${action.id}`}
                        className="text-xs opacity-80 mt-1"
                      >
                        {action.description}
                      </div>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 flex-shrink-0 opacity-50" aria-hidden="true" />
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Technical Details (Collapsible) */}
        {errorTemplate.showTechnicalDetails && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-expanded={showTechnicalDetails}
              aria-controls="technical-details"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Technical Details
              </span>
              <ChevronRightIcon 
                className={cn(
                  "h-4 w-4 transition-transform",
                  showTechnicalDetails && "rotate-90"
                )}
                aria-hidden="true"
              />
            </button>
            
            {showTechnicalDetails && (
              <div 
                id="technical-details"
                className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 mt-3">
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="font-medium text-gray-900 dark:text-gray-100">Error Type:</dt>
                      <dd className="text-gray-600 dark:text-gray-400 font-mono">{error.name}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900 dark:text-gray-100">Message:</dt>
                      <dd className="text-gray-600 dark:text-gray-400 font-mono break-all">{error.message}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900 dark:text-gray-100">Timestamp:</dt>
                      <dd className="text-gray-600 dark:text-gray-400 font-mono">{new Date().toISOString()}</dd>
                    </div>
                    {(error as any).digest && (
                      <div>
                        <dt className="font-medium text-gray-900 dark:text-gray-100">Error ID:</dt>
                        <dd className="text-gray-600 dark:text-gray-400 font-mono">{(error as any).digest}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Error Reporting */}
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Having trouble? You can send an error report to help us improve the system.
          </div>
          
          {!reportSent ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendReport}
              loading={isReporting}
              disabled={isReporting}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isReporting ? 'Sending Report...' : 'Send Error Report'}
            </Button>
          ) : (
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ Error report sent successfully
            </div>
          )}
        </div>
        
        {/* Footer Information */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
          <p>
            DreamFactory Admin Interface • API Security Section
            {process.env.NODE_ENV === 'development' && (
              <span className="ml-2 text-blue-500">Development Mode</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine the security domain from error analysis
 */
function determineSecurityDomain(error: Error): 'roles' | 'limits' | 'policies' | 'authentication' | 'authorization' {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  
  if (message.includes('role') || stack.includes('/roles/')) {
    return 'roles';
  } else if (message.includes('limit') || stack.includes('/limits/')) {
    return 'limits';
  } else if (message.includes('unauthorized') || message.includes('401')) {
    return 'authentication';
  } else if (message.includes('forbidden') || message.includes('403')) {
    return 'authorization';
  } else {
    return 'policies';
  }
}

/**
 * Extract affected resource from error context
 */
function extractAffectedResource(error: Error): string | undefined {
  const message = error.message;
  
  // Extract resource IDs or names from error messages
  const resourceMatch = message.match(/resource[:\s]+([a-zA-Z0-9-_]+)/i) ||
                       message.match(/id[:\s]+([a-zA-Z0-9-_]+)/i) ||
                       message.match(/name[:\s]+([a-zA-Z0-9-_]+)/i);
  
  return resourceMatch ? resourceMatch[1] : undefined;
}

/**
 * Extract user action from current URL and error context
 */
function extractUserAction(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  
  const pathname = window.location.pathname;
  
  if (pathname.includes('/create')) return 'create';
  if (pathname.includes('/edit')) return 'edit';
  if (pathname.includes('/delete')) return 'delete';
  if (pathname.includes('/roles')) return 'role_management';
  if (pathname.includes('/limits')) return 'limits_configuration';
  
  return 'view';
}

/**
 * Assess security impact of the error
 */
function assessSecurityImpact(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // High security impact indicators
  const highImpactKeywords = [
    'security',
    'permission',
    'authorization',
    'authentication',
    'role',
    'access',
    'privilege',
    'token',
    'credential'
  ];
  
  return highImpactKeywords.some(keyword => message.includes(keyword));
}