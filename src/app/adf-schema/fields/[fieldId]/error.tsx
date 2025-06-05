/**
 * Field Editor Error Boundary - Next.js Error Component
 * 
 * Provides graceful error handling and recovery options for field editing functionality.
 * Implements comprehensive error recovery patterns with user-friendly messaging for database
 * field management workflows including API failures, validation errors, and data loading issues.
 * 
 * Features:
 * - Field-specific error messages and recovery guidance
 * - Retry mechanisms with exponential backoff for transient failures
 * - Comprehensive error logging for debugging and monitoring
 * - Tailwind CSS error state styling for consistent visual feedback
 * - WCAG 2.1 AA compliant error display with proper ARIA attributes
 * - Integration with existing Alert component system
 * - Progressive error recovery suggestions based on error type
 * - Session and authentication error handling
 * 
 * @fileoverview Next.js error boundary for field editing page
 * @version 1.0.0
 * @see Technical Specification Section 4.2 - ERROR HANDLING AND VALIDATION
 * @see Technical Specification Section 7.5.1 - Error boundary implementation
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import {
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  BugAntIcon,
  WifiIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Error boundary props interface for Next.js error page
 * Includes error object and reset function from Next.js app router
 */
interface FieldErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Field-specific error categories for specialized handling
 * Maps common database field management errors to user-friendly messages
 */
type FieldErrorCategory = 
  | 'field_not_found'
  | 'validation_error'
  | 'network_error'
  | 'authentication_error'
  | 'permission_error'
  | 'server_error'
  | 'database_connection_error'
  | 'schema_error'
  | 'data_type_error'
  | 'constraint_error'
  | 'unknown_error';

/**
 * Error recovery action configuration
 * Defines available recovery options with user guidance
 */
interface ErrorRecoveryAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'outline';
  action: () => void | Promise<void>;
  shortcut?: string;
}

/**
 * Field error context information
 * Provides additional context for error categorization
 */
interface FieldErrorContext {
  fieldId?: string;
  tableName?: string;
  serviceId?: string;
  operationType?: 'create' | 'update' | 'delete' | 'view';
  validationErrors?: string[];
}

// =============================================================================
// ERROR CATEGORIZATION SYSTEM
// =============================================================================

/**
 * Categorize error based on error message, status code, and context
 * Provides intelligent error classification for appropriate recovery suggestions
 */
const categorizeFieldError = (
  error: Error,
  context: FieldErrorContext
): FieldErrorCategory => {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  // Check for specific HTTP status codes if available
  const statusCode = (error as any).status || (error as any).statusCode;
  
  // Network-related errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    name.includes('network') ||
    statusCode === 0
  ) {
    return 'network_error';
  }
  
  // Authentication errors
  if (
    statusCode === 401 ||
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('token')
  ) {
    return 'authentication_error';
  }
  
  // Permission errors
  if (
    statusCode === 403 ||
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('access denied')
  ) {
    return 'permission_error';
  }
  
  // Field not found errors
  if (
    statusCode === 404 ||
    message.includes('not found') ||
    message.includes('field does not exist') ||
    message.includes('invalid field')
  ) {
    return 'field_not_found';
  }
  
  // Validation errors
  if (
    statusCode === 400 ||
    message.includes('validation') ||
    message.includes('invalid data') ||
    message.includes('constraint') ||
    context.validationErrors?.length
  ) {
    return 'validation_error';
  }
  
  // Database connection errors
  if (
    message.includes('database') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    statusCode === 503
  ) {
    return 'database_connection_error';
  }
  
  // Schema-related errors
  if (
    message.includes('schema') ||
    message.includes('table') ||
    message.includes('column') ||
    message.includes('metadata')
  ) {
    return 'schema_error';
  }
  
  // Data type errors
  if (
    message.includes('type') ||
    message.includes('format') ||
    message.includes('conversion')
  ) {
    return 'data_type_error';
  }
  
  // Constraint errors
  if (
    message.includes('constraint') ||
    message.includes('unique') ||
    message.includes('foreign key') ||
    message.includes('check constraint')
  ) {
    return 'constraint_error';
  }
  
  // Server errors
  if (statusCode >= 500) {
    return 'server_error';
  }
  
  // Default to unknown error
  return 'unknown_error';
};

/**
 * Get error configuration based on category
 * Provides user-friendly messages and recovery suggestions
 */
const getErrorConfig = (category: FieldErrorCategory, context: FieldErrorContext) => {
  const configs = {
    field_not_found: {
      title: 'Field Not Found',
      description: context.fieldId 
        ? `The field "${context.fieldId}" could not be found. It may have been deleted or moved.`
        : 'The requested field could not be found in the database schema.',
      icon: DocumentTextIcon,
      severity: 'warning' as const,
      category: 'Resource Not Found',
      suggestions: [
        'Verify the field still exists in the database schema',
        'Check if the field was recently deleted or renamed',
        'Refresh the schema discovery to get the latest field information',
        'Navigate back to the field list to select a different field',
      ],
    },
    validation_error: {
      title: 'Field Configuration Error',
      description: 'The field configuration contains invalid or conflicting settings that need to be corrected.',
      icon: ExclamationTriangleIcon,
      severity: 'error' as const,
      category: 'Validation Error',
      suggestions: [
        'Review all required fields and ensure they are properly filled',
        'Check for conflicting field constraints or validation rules',
        'Verify data types and length constraints are valid',
        'Ensure function usage configurations are compatible',
      ],
    },
    network_error: {
      title: 'Network Connection Error',
      description: 'Unable to connect to the server. Please check your network connection and try again.',
      icon: WifiIcon,
      severity: 'error' as const,
      category: 'Network Error',
      suggestions: [
        'Check your internet connection',
        'Verify the server is accessible',
        'Try refreshing the page',
        'Contact your administrator if the problem persists',
      ],
    },
    authentication_error: {
      title: 'Authentication Required',
      description: 'Your session has expired or authentication is required to access this field.',
      icon: ShieldExclamationIcon,
      severity: 'warning' as const,
      category: 'Authentication Error',
      suggestions: [
        'Your session may have expired - please log in again',
        'Verify you have the necessary permissions',
        'Contact your administrator for access if needed',
      ],
    },
    permission_error: {
      title: 'Access Denied',
      description: 'You do not have permission to modify this field or access this functionality.',
      icon: ShieldExclamationIcon,
      severity: 'warning' as const,
      category: 'Permission Error',
      suggestions: [
        'Contact your administrator to request field editing permissions',
        'Verify you have the correct role assignments',
        'Check if this field has restricted access controls',
      ],
    },
    server_error: {
      title: 'Server Error',
      description: 'An unexpected server error occurred while processing your request.',
      icon: BugAntIcon,
      severity: 'error' as const,
      category: 'Server Error',
      suggestions: [
        'Try refreshing the page',
        'Wait a few minutes and try again',
        'Contact technical support if the error persists',
        'Check the system status page for known issues',
      ],
    },
    database_connection_error: {
      title: 'Database Connection Error',
      description: 'Unable to connect to the database service. The connection may be unavailable or timing out.',
      icon: WrenchScrewdriverIcon,
      severity: 'error' as const,
      category: 'Database Error',
      suggestions: [
        'Verify the database service is running and accessible',
        'Check if database connection credentials are valid',
        'Test the database connection from the service configuration',
        'Contact your database administrator if issues persist',
      ],
    },
    schema_error: {
      title: 'Schema Discovery Error',
      description: 'Unable to retrieve or process the database schema information for this field.',
      icon: DocumentTextIcon,
      severity: 'error' as const,
      category: 'Schema Error',
      suggestions: [
        'Refresh the schema discovery to get the latest information',
        'Verify database permissions for schema access',
        'Check if the table structure has changed recently',
        'Contact your database administrator for schema issues',
      ],
    },
    data_type_error: {
      title: 'Data Type Configuration Error',
      description: 'There is an issue with the field data type configuration or conversion.',
      icon: ExclamationTriangleIcon,
      severity: 'error' as const,
      category: 'Data Type Error',
      suggestions: [
        'Verify the selected data type is compatible with the database',
        'Check length and precision constraints for the field type',
        'Ensure default values match the specified data type',
        'Review any custom validation rules for type compatibility',
      ],
    },
    constraint_error: {
      title: 'Field Constraint Error',
      description: 'The field configuration violates database constraints or validation rules.',
      icon: ExclamationTriangleIcon,
      severity: 'error' as const,
      category: 'Constraint Error',
      suggestions: [
        'Review unique constraints and ensure values are not duplicated',
        'Check foreign key relationships are properly configured',
        'Verify check constraints are satisfied by default values',
        'Ensure required fields have appropriate NOT NULL constraints',
      ],
    },
    unknown_error: {
      title: 'Unexpected Error',
      description: 'An unexpected error occurred while loading or processing the field information.',
      icon: BugAntIcon,
      severity: 'error' as const,
      category: 'Unknown Error',
      suggestions: [
        'Try refreshing the page',
        'Clear your browser cache and reload',
        'Check browser developer console for additional details',
        'Contact technical support with error details',
      ],
    },
  };
  
  return configs[category];
};

// =============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// =============================================================================

/**
 * Retry hook with exponential backoff for transient failures
 * Implements intelligent retry logic for different error categories
 */
const useRetryWithBackoff = (onRetry: () => void | Promise<void>) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);
  
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries || isRetrying) {
      return;
    }
    
    setIsRetrying(true);
    
    try {
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, retryCount);
      
      // Wait for backoff period
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Attempt retry
      await onRetry();
      
      // Reset retry count on success
      setRetryCount(0);
      setLastRetryTime(new Date());
    } catch (error) {
      // Increment retry count on failure
      setRetryCount(prev => prev + 1);
      console.warn(`Retry attempt ${retryCount + 1} failed:`, error);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retryCount, maxRetries, isRetrying, baseDelay]);
  
  const canRetry = retryCount < maxRetries && !isRetrying;
  const nextRetryIn = retryCount > 0 ? baseDelay * Math.pow(2, retryCount - 1) : 0;
  
  return {
    handleRetry,
    canRetry,
    retryCount,
    maxRetries,
    isRetrying,
    lastRetryTime,
    nextRetryIn,
  };
};

// =============================================================================
// ERROR LOGGING SYSTEM
// =============================================================================

/**
 * Enhanced error logging for debugging and monitoring
 * Captures comprehensive error context for troubleshooting
 */
const logFieldError = (
  error: Error,
  context: FieldErrorContext,
  category: FieldErrorCategory,
  userAgent?: string
) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: (error as any).digest,
    },
    context: {
      ...context,
      url: window.location.href,
      userAgent: userAgent || navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    },
    category,
    sessionId: sessionStorage.getItem('sessionId') || 'anonymous',
    userId: localStorage.getItem('userId') || 'unknown',
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Field Editor Error');
    console.error('Error:', error);
    console.table(errorLog.context);
    console.log('Category:', category);
    console.log('Full Log:', errorLog);
    console.groupEnd();
  }
  
  // Log to monitoring service in production
  // Replace with your monitoring service (e.g., Sentry, LogRocket, DataDog)
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: Send to monitoring service
      // monitoring.captureException(error, { extra: errorLog });
      
      // Fallback: Send to backend logging endpoint
      fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog),
      }).catch(logError => {
        console.warn('Failed to send error log:', logError);
      });
    } catch (logError) {
      console.warn('Error logging failed:', logError);
    }
  }
  
  return errorLog;
};

// =============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * Field Editor Error Boundary Component
 * Next.js error boundary for graceful field editing error handling
 */
export default function FieldEditorError({ error, reset }: FieldErrorProps) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  
  // Extract context from URL and params
  const fieldId = params?.fieldId as string;
  const pathSegments = pathname.split('/');
  const serviceIndex = pathSegments.findIndex(segment => segment === 'database');
  const serviceId = serviceIndex !== -1 ? pathSegments[serviceIndex + 1] : undefined;
  const tableName = sessionStorage.getItem(`currentTable_${serviceId}`) || undefined;
  
  // Build error context
  const errorContext: FieldErrorContext = {
    fieldId,
    tableName,
    serviceId,
    operationType: fieldId === 'new' ? 'create' : 'update',
  };
  
  // Categorize error and get configuration
  const errorCategory = categorizeFieldError(error, errorContext);
  const errorConfig = getErrorConfig(errorCategory, errorContext);
  
  // Initialize retry logic
  const {
    handleRetry,
    canRetry,
    retryCount,
    maxRetries,
    isRetrying,
    lastRetryTime,
  } = useRetryWithBackoff(reset);
  
  // Log error on mount
  useEffect(() => {
    logFieldError(error, errorContext, errorCategory);
  }, [error, errorContext, errorCategory]);
  
  // Navigation handlers
  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/adf-schema/fields`);
    }
  }, [router]);
  
  const handleGoToFieldList = useCallback(() => {
    const baseUrl = serviceId 
      ? `/api-connections/database/${serviceId}/schema`
      : '/adf-schema/fields';
    router.push(baseUrl);
  }, [router, serviceId]);
  
  const handleGoToDashboard = useCallback(() => {
    router.push('/');
  }, [router]);
  
  const handleReportBug = useCallback(() => {
    const bugReportUrl = new URL('mailto:support@dreamfactory.com');
    bugReportUrl.searchParams.set('subject', `Field Editor Error Report - ${errorCategory}`);
    bugReportUrl.searchParams.set('body', 
      `Error Details:\n` +
      `- Category: ${errorCategory}\n` +
      `- Field ID: ${fieldId || 'N/A'}\n` +
      `- Service ID: ${serviceId || 'N/A'}\n` +
      `- Error Message: ${error.message}\n` +
      `- Timestamp: ${new Date().toISOString()}\n` +
      `- Page URL: ${window.location.href}\n\n` +
      `Please describe what you were doing when this error occurred:\n\n`
    );
    window.open(bugReportUrl.toString());
  }, [error, errorCategory, fieldId, serviceId]);
  
  // Define recovery actions based on error category
  const recoveryActions: ErrorRecoveryAction[] = [
    {
      id: 'retry',
      label: isRetrying ? 'Retrying...' : `Try Again${retryCount > 0 ? ` (${retryCount}/${maxRetries})` : ''}`,
      description: 'Attempt to reload the field editor',
      icon: ArrowPathIcon,
      variant: 'primary',
      action: handleRetry,
      shortcut: 'r',
    },
    {
      id: 'go-back',
      label: 'Go Back',
      description: 'Return to the previous page',
      icon: ArrowLeftIcon,
      variant: 'secondary',
      action: handleGoBack,
      shortcut: 'b',
    },
    {
      id: 'field-list',
      label: 'View All Fields',
      description: 'Navigate to the field list',
      icon: DocumentTextIcon,
      variant: 'outline',
      action: handleGoToFieldList,
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Return to the main dashboard',
      icon: HomeIcon,
      variant: 'outline',
      action: handleGoToDashboard,
    },
  ];
  
  // Filter actions based on error category
  const availableActions = recoveryActions.filter(action => {
    if (action.id === 'retry' && !canRetry) return false;
    if (errorCategory === 'permission_error' && action.id === 'retry') return false;
    return true;
  });
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const action = availableActions.find(a => a.shortcut === event.key);
        if (action) {
          event.preventDefault();
          action.action();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [availableActions]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Error Alert */}
        <Alert
          type={errorConfig.severity}
          variant="soft"
          size="lg"
          className="shadow-lg"
          title={errorConfig.title}
          description={errorConfig.description}
          showIcon
          icon={errorConfig.icon}
          priority="high"
          announce
          data-testid="field-error-alert"
        >
          {/* Error Details */}
          <div className="mt-4 space-y-3">
            {/* Error Category */}
            <div className="text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Error Category:
              </span>
              <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-900 dark:text-gray-100">
                {errorConfig.category}
              </span>
            </div>
            
            {/* Field Context */}
            {(fieldId || serviceId || tableName) && (
              <div className="text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Context:
                </span>
                <div className="ml-2 mt-1 space-y-1">
                  {fieldId && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Field ID:</span>
                      <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                        {fieldId}
                      </span>
                    </div>
                  )}
                  {tableName && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Table:</span>
                      <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                        {tableName}
                      </span>
                    </div>
                  )}
                  {serviceId && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Service:</span>
                      <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                        {serviceId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Technical Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Error Name:</span>
                      <span className="ml-2 font-mono">{error.name}</span>
                    </div>
                    <div>
                      <span className="font-medium">Error Message:</span>
                      <pre className="ml-2 mt-1 text-xs whitespace-pre-wrap break-words">
                        {error.message}
                      </pre>
                    </div>
                    {(error as any).digest && (
                      <div>
                        <span className="font-medium">Error Digest:</span>
                        <span className="ml-2 font-mono text-xs">{(error as any).digest}</span>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}
          </div>
        </Alert>
        
        {/* Recovery Suggestions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Suggested Solutions
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {errorConfig.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                  {index + 1}
                </span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Recovery Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recovery Actions
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant}
                size="md"
                onClick={action.action}
                disabled={action.id === 'retry' && isRetrying}
                className={cn(
                  'flex items-center justify-center gap-2 min-h-[44px]',
                  action.id === 'retry' && 'font-medium'
                )}
                title={action.shortcut ? `${action.description} (Ctrl+${action.shortcut})` : action.description}
                data-testid={`error-action-${action.id}`}
              >
                <action.icon className={cn(
                  'h-4 w-4',
                  isRetrying && action.id === 'retry' && 'animate-spin'
                )} />
                {action.label}
              </Button>
            ))}
          </div>
          
          {/* Additional Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReportBug}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              data-testid="error-action-report-bug"
            >
              <BugAntIcon className="h-4 w-4 mr-2" />
              Report Bug
            </Button>
          </div>
          
          {/* Retry Status */}
          {retryCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span>Retry attempts: {retryCount} of {maxRetries}</span>
                {lastRetryTime && (
                  <span className="ml-4">
                    Last attempt: {lastRetryTime.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <div className="text-center">
          <details className="inline-block text-sm text-gray-600 dark:text-gray-400">
            <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
              Keyboard Shortcuts
            </summary>
            <div className="mt-2 space-y-1">
              {availableActions
                .filter(action => action.shortcut)
                .map(action => (
                  <div key={action.id}>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      Ctrl+{action.shortcut}
                    </kbd>
                    <span className="ml-2">{action.label}</span>
                  </div>
                ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}