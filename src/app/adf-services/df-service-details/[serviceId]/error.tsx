'use client'

/**
 * Error boundary component for the service editing page
 * 
 * Handles and displays user-friendly error messages when service modification workflows fail.
 * Provides retry mechanisms, navigation options, and proper error logging for editing operations.
 * Implements React 19 error boundary patterns with fallback UI and recovery actions for common
 * failure scenarios including network errors, validation failures, authentication issues, and
 * service not found errors.
 * 
 * Features:
 * - React 19 error boundary implementation with Next.js app router integration
 * - Contextual recovery actions based on error types and service editing workflows
 * - Comprehensive error logging and monitoring integration for debugging and system health
 * - Tailwind CSS styling with dark mode support and WCAG 2.1 AA accessibility compliance
 * - Dynamic route parameter validation with proper serviceId handling and fallback navigation
 * - Integration with error handling hook for centralized error management
 * 
 * @fileoverview Service editing error boundary for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Home, 
  Database, 
  Shield, 
  Wifi, 
  Settings,
  AlertCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useLogger } from '@/hooks/use-logger';
import {
  ErrorType,
  ErrorSeverity,
  ErrorCategory,
  RecoveryAction
} from '@/types/error';

/**
 * Props interface for the service editing error boundary
 */
interface ServiceEditingErrorProps {
  /** The error object that was caught */
  error: Error & { digest?: string };
  /** Function to retry the failed operation */
  reset: () => void;
}

/**
 * Error classification for service editing context
 */
interface ServiceEditingErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  category: ErrorCategory;
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  recoveryActions: RecoveryAction[];
  contextualHelp?: string;
}

/**
 * Service editing error boundary component
 * 
 * Provides comprehensive error handling for the service editing page with contextual
 * recovery actions, user-friendly error messages, and proper accessibility support.
 * Integrates with the centralized error handling system and logging infrastructure.
 */
export default function ServiceEditingError({
  error,
  reset
}: ServiceEditingErrorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { handleError, recoverFromError } = useErrorHandler();
  const logger = useLogger();

  // Extract serviceId from pathname for context-specific error handling
  const serviceId = useMemo(() => {
    const pathSegments = pathname.split('/');
    const serviceIndex = pathSegments.findIndex(segment => segment === 'df-service-details');
    return serviceIndex !== -1 && pathSegments[serviceIndex + 1] ? pathSegments[serviceIndex + 1] : null;
  }, [pathname]);

  /**
   * Classify the error and provide appropriate context for service editing
   */
  const errorInfo = useMemo((): ServiceEditingErrorInfo => {
    const errorMessage = error.message || '';
    const errorDigest = error.digest || '';

    // Service not found error
    if (errorMessage.includes('not found') || errorMessage.includes('404') || errorDigest.includes('NOTFOUND')) {
      return {
        type: ErrorType.CLIENT,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.APPLICATION,
        title: 'Service Not Found',
        message: `The database service ${serviceId ? `"${serviceId}"` : 'you requested'} could not be found. It may have been deleted or you may not have permission to access it.`,
        icon: Database,
        recoveryActions: [
          {
            type: 'navigate',
            label: 'Browse Services',
            primary: true,
            accessibility: {
              ariaLabel: 'Navigate to database services list',
              keyboardShortcut: 'Enter',
            },
          },
          {
            type: 'retry',
            label: 'Retry Loading',
            primary: false,
            accessibility: {
              ariaLabel: 'Retry loading the service',
              keyboardShortcut: 'R',
            },
          },
        ],
        contextualHelp: 'If you believe this service should exist, check with your administrator or try refreshing your browser.',
      };
    }

    // Authentication error
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401') || errorDigest.includes('UNAUTHENTICATED')) {
      return {
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.SECURITY,
        title: 'Authentication Required',
        message: 'Your session has expired or you are not authorized to edit this service. Please log in again to continue.',
        icon: Shield,
        recoveryActions: [
          {
            type: 'login',
            label: 'Login',
            primary: true,
            accessibility: {
              ariaLabel: 'Navigate to login page',
              keyboardShortcut: 'Enter',
            },
          },
          {
            type: 'refresh',
            label: 'Refresh Page',
            primary: false,
            accessibility: {
              ariaLabel: 'Refresh the current page',
              keyboardShortcut: 'F5',
            },
          },
        ],
        contextualHelp: 'Your authentication session may have expired while editing the service.',
      };
    }

    // Authorization/Permission error
    if (errorMessage.includes('forbidden') || errorMessage.includes('403') || errorDigest.includes('FORBIDDEN')) {
      return {
        type: ErrorType.AUTHORIZATION,
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.SECURITY,
        title: 'Access Denied',
        message: 'You do not have permission to edit this database service. Contact your administrator if you need access.',
        icon: Shield,
        recoveryActions: [
          {
            type: 'navigate',
            label: 'Back to Services',
            primary: true,
            accessibility: {
              ariaLabel: 'Navigate back to services list',
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
        ],
        contextualHelp: 'Service editing may require special permissions in your organization.',
      };
    }

    // Network connectivity error
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || !navigator.onLine) {
      return {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.INFRASTRUCTURE,
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        icon: Wifi,
        recoveryActions: [
          {
            type: 'retry',
            label: 'Try Again',
            primary: true,
            accessibility: {
              ariaLabel: 'Retry the failed operation',
              keyboardShortcut: 'Enter',
            },
          },
          {
            type: 'refresh',
            label: 'Refresh Page',
            primary: false,
            accessibility: {
              ariaLabel: 'Refresh the current page',
              keyboardShortcut: 'F5',
            },
          },
        ],
        contextualHelp: 'Check your internet connection and ensure the DreamFactory server is accessible.',
      };
    }

    // Service configuration/validation error
    if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorDigest.includes('VALIDATION')) {
      return {
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.USER_INPUT,
        title: 'Configuration Error',
        message: 'There was a problem with the service configuration. Please check your settings and try again.',
        icon: Settings,
        recoveryActions: [
          {
            type: 'retry',
            label: 'Try Again',
            primary: true,
            accessibility: {
              ariaLabel: 'Retry with current configuration',
              keyboardShortcut: 'Enter',
            },
          },
          {
            type: 'navigate',
            label: 'Start Over',
            primary: false,
            accessibility: {
              ariaLabel: 'Start service configuration from beginning',
            },
          },
        ],
        contextualHelp: 'Review your database connection parameters and ensure all required fields are completed.',
      };
    }

    // Server error
    if (errorMessage.includes('500') || errorMessage.includes('server') || errorDigest.includes('INTERNAL_ERROR')) {
      return {
        type: ErrorType.SERVER,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.INFRASTRUCTURE,
        title: 'Server Error',
        message: 'The server encountered an error while processing your request. Our team has been notified.',
        icon: AlertTriangle,
        recoveryActions: [
          {
            type: 'retry',
            label: 'Try Again',
            primary: true,
            accessibility: {
              ariaLabel: 'Retry the service editing operation',
              keyboardShortcut: 'Enter',
            },
          },
          {
            type: 'navigate',
            label: 'Back to Services',
            primary: false,
            accessibility: {
              ariaLabel: 'Navigate back to services list',
            },
          },
        ],
        contextualHelp: 'Server errors are usually temporary. Please try again in a few moments.',
      };
    }

    // Generic/Unknown error
    return {
      type: ErrorType.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.APPLICATION,
      title: 'Unexpected Error',
      message: 'An unexpected error occurred while editing the service. Please try again or contact support if the problem persists.',
      icon: AlertCircle,
      recoveryActions: [
        {
          type: 'retry',
          label: 'Try Again',
          primary: true,
          accessibility: {
            ariaLabel: 'Retry the failed operation',
            keyboardShortcut: 'Enter',
          },
        },
        {
          type: 'refresh',
          label: 'Refresh Page',
          primary: false,
          accessibility: {
            ariaLabel: 'Refresh the current page',
            keyboardShortcut: 'F5',
          },
        },
        {
          type: 'navigate',
          label: 'Back to Services',
          primary: false,
          accessibility: {
            ariaLabel: 'Navigate back to services list',
          },
        },
      ],
      contextualHelp: 'If this error continues to occur, please contact technical support with the error details.',
    };
  }, [error, serviceId]);

  /**
   * Log error on mount with service editing context
   */
  useEffect(() => {
    const logError = async () => {
      try {
        await handleError(error, {
          component: 'ServiceEditingError',
          route: pathname,
          serviceId,
          operation: 'service-editing',
        });
      } catch (logError) {
        console.error('Failed to log service editing error:', logError);
      }
    };

    logError();
  }, [error, handleError, pathname, serviceId]);

  /**
   * Handle recovery action execution
   */
  const handleRecoveryAction = async (action: RecoveryAction) => {
    try {
      logger.info('Service editing error recovery action initiated', {
        action: action.type,
        errorType: errorInfo.type,
        serviceId,
      });

      switch (action.type) {
        case 'retry':
          // Reset the error boundary to retry the operation
          reset();
          break;

        case 'refresh':
          // Refresh the entire page
          window.location.reload();
          break;

        case 'login':
          // Navigate to login page
          router.push('/login');
          break;

        case 'navigate':
          // Navigate back to services list
          router.push('/adf-services');
          break;

        case 'contact':
          // Open support contact
          window.open('mailto:support@dreamfactory.com?subject=Service%20Editing%20Error', '_blank');
          break;

        case 'dismiss':
          // Navigate back to services (same as navigate for this context)
          router.push('/adf-services');
          break;

        default:
          console.warn('Unknown recovery action:', action.type);
      }

      // Track recovery action for metrics
      await recoverFromError(`service-editing-${Date.now()}`, action);
    } catch (recoveryError) {
      logger.error('Service editing error recovery failed', recoveryError, {
        originalError: error.message,
        actionType: action.type,
        serviceId,
      });
    }
  };

  /**
   * Handle keyboard navigation for accessibility
   */
  const handleKeyDown = (event: React.KeyboardEvent, action: RecoveryAction) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRecoveryAction(action);
    }
  };

  const IconComponent = errorInfo.icon;

  return (
    <div 
      className="min-h-[600px] flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900"
      data-testid="service-editing-error"
    >
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Error Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <IconComponent 
                className={`h-12 w-12 ${
                  errorInfo.severity === ErrorSeverity.CRITICAL ? 'text-red-500' :
                  errorInfo.severity === ErrorSeverity.HIGH ? 'text-red-400' :
                  errorInfo.severity === ErrorSeverity.MEDIUM ? 'text-yellow-500' :
                  'text-blue-500'
                }`}
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <h1 
                className="text-2xl font-bold text-gray-900 dark:text-white"
                id="error-title"
              >
                {errorInfo.title}
              </h1>
              {serviceId && (
                <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <Database className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span>Service: {serviceId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          <div
            role="alert"
            aria-labelledby="error-title"
            aria-describedby="error-description"
          >
            <p 
              id="error-description"
              className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {errorInfo.message}
            </p>
          </div>

          {/* Contextual Help */}
          {errorInfo.contextualHelp && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Helpful Information
                  </h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    {errorInfo.contextualHelp}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recovery Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              What would you like to do?
            </h2>
            
            <div className="grid gap-3">
              {errorInfo.recoveryActions.map((action, index) => (
                <button
                  key={action.type}
                  onClick={() => handleRecoveryAction(action)}
                  onKeyDown={(event) => handleKeyDown(event, action)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${
                    action.primary
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 focus:ring-blue-500'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  aria-label={action.accessibility?.ariaLabel}
                  title={action.accessibility?.keyboardShortcut ? `Keyboard shortcut: ${action.accessibility.keyboardShortcut}` : undefined}
                >
                  <div className="flex items-center space-x-3">
                    {action.type === 'retry' && <RefreshCw className="h-5 w-5" aria-hidden="true" />}
                    {action.type === 'refresh' && <RefreshCw className="h-5 w-5" aria-hidden="true" />}
                    {action.type === 'navigate' && <ArrowLeft className="h-5 w-5" aria-hidden="true" />}
                    {action.type === 'login' && <Shield className="h-5 w-5" aria-hidden="true" />}
                    {action.type === 'contact' && <HelpCircle className="h-5 w-5" aria-hidden="true" />}
                    {action.type === 'dismiss' && <Home className="h-5 w-5" aria-hidden="true" />}
                    
                    <div className="text-left">
                      <div className="font-medium">{action.label}</div>
                      {action.accessibility?.keyboardShortcut && (
                        <div className={`text-sm ${action.primary ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          Press {action.accessibility.keyboardShortcut}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          {/* Technical Details (Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                Technical Details (Development Mode)
              </summary>
              <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="space-y-2 text-sm font-mono">
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Error Type:</span>{' '}
                    <span className="text-gray-800 dark:text-gray-200">{errorInfo.type}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Severity:</span>{' '}
                    <span className="text-gray-800 dark:text-gray-200">{errorInfo.severity}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Category:</span>{' '}
                    <span className="text-gray-800 dark:text-gray-200">{errorInfo.category}</span>
                  </div>
                  {error.digest && (
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Digest:</span>{' '}
                      <span className="text-gray-800 dark:text-gray-200">{error.digest}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Message:</span>{' '}
                    <span className="text-gray-800 dark:text-gray-200">{error.message}</span>
                  </div>
                  {serviceId && (
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Service ID:</span>{' '}
                      <span className="text-gray-800 dark:text-gray-200">{serviceId}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-600 dark:text-gray-400">Pathname:</span>{' '}
                    <span className="text-gray-800 dark:text-gray-200">{pathname}</span>
                  </div>
                </div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}