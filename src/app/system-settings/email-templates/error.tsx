'use client';

/**
 * Email Templates Error Boundary Component
 * 
 * Next.js app router error boundary for the email templates section that catches and displays
 * comprehensive error information with recovery options. Implements React Error Boundary 
 * integration with Next.js error handling patterns, providing graceful degradation for 
 * email template management failures.
 * 
 * Features:
 * - Catches both React errors and network failures in email template operations
 * - Provides clear error messages and actionable recovery steps
 * - Integrates with application logging and monitoring systems
 * - Maintains WCAG 2.1 AA accessibility standards and responsive design
 * - MSW mock error response integration for development mode testing
 * - Tailwind CSS error UI styling with proper contrast ratios
 * 
 * @fileoverview Next.js error boundary for email templates section
 * @version 1.0.0
 * @see Technical Specification Section 0.2.1 - Next.js error boundary per app router error.tsx convention
 * @see Technical Specification Section 4.2 - React Error Boundary integration requirements
 * @see Technical Specification Section 7.1 - Tailwind CSS error UI styling with accessibility
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  HomeIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// =============================================================================
// ERROR TYPES AND INTERFACES
// =============================================================================

/**
 * Enhanced error interface for email template operations
 * Extends standard Error with additional context for better debugging
 */
interface EmailTemplateError extends Error {
  code?: string;
  statusCode?: number;
  context?: {
    templateId?: string;
    templateName?: string;
    operation?: 'fetch' | 'create' | 'update' | 'delete' | 'validate';
    endpoint?: string;
    userAgent?: string;
  };
  timestamp?: string;
  retryable?: boolean;
  category?: 'network' | 'validation' | 'authorization' | 'server' | 'client' | 'unknown';
}

/**
 * Error boundary props following Next.js app router conventions
 */
interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Recovery action configuration
 */
interface RecoveryAction {
  id: string;
  label: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  handler: () => void | Promise<void>;
  primary?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

// =============================================================================
// ERROR CLASSIFICATION AND ANALYSIS
// =============================================================================

/**
 * Classify error type based on error properties and context
 * Provides specific error categorization for targeted recovery strategies
 */
const classifyError = (error: Error): EmailTemplateError => {
  const enhancedError: EmailTemplateError = {
    ...error,
    timestamp: new Date().toISOString(),
    retryable: false,
    category: 'unknown',
  };

  // Network errors (fetch failures, timeouts, connectivity issues)
  if (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('timeout') ||
    error.message.includes('connection') ||
    error.name === 'TypeError' && error.message.includes('Failed to fetch')
  ) {
    enhancedError.category = 'network';
    enhancedError.retryable = true;
    enhancedError.code = 'NETWORK_ERROR';
  }
  
  // Authentication/Authorization errors
  else if (
    error.message.includes('401') ||
    error.message.includes('403') ||
    error.message.includes('unauthorized') ||
    error.message.includes('forbidden') ||
    error.message.includes('authentication') ||
    error.message.includes('permission')
  ) {
    enhancedError.category = 'authorization';
    enhancedError.retryable = false;
    enhancedError.code = 'AUTH_ERROR';
  }
  
  // Validation errors (form validation, schema validation)
  else if (
    error.message.includes('validation') ||
    error.message.includes('invalid') ||
    error.message.includes('required') ||
    error.message.includes('format') ||
    error.name === 'ValidationError'
  ) {
    enhancedError.category = 'validation';
    enhancedError.retryable = false;
    enhancedError.code = 'VALIDATION_ERROR';
  }
  
  // Server errors (5xx status codes)
  else if (
    error.message.includes('500') ||
    error.message.includes('502') ||
    error.message.includes('503') ||
    error.message.includes('504') ||
    error.message.includes('server error') ||
    error.message.includes('internal server')
  ) {
    enhancedError.category = 'server';
    enhancedError.retryable = true;
    enhancedError.code = 'SERVER_ERROR';
  }
  
  // Client errors (4xx status codes excluding auth)
  else if (
    error.message.includes('400') ||
    error.message.includes('404') ||
    error.message.includes('409') ||
    error.message.includes('422') ||
    error.message.includes('bad request') ||
    error.message.includes('not found') ||
    error.message.includes('conflict')
  ) {
    enhancedError.category = 'client';
    enhancedError.retryable = false;
    enhancedError.code = 'CLIENT_ERROR';
  }

  // React component errors (render errors, hook errors)
  else if (
    error.name === 'ChunkLoadError' ||
    error.message.includes('chunk') ||
    error.message.includes('module') ||
    error.message.includes('import') ||
    error.stack?.includes('React') ||
    error.stack?.includes('Hook') ||
    error.stack?.includes('Component')
  ) {
    enhancedError.category = 'client';
    enhancedError.retryable = true;
    enhancedError.code = 'COMPONENT_ERROR';
  }

  return enhancedError;
};

/**
 * Get user-friendly error message based on error classification
 * Provides clear, actionable messages for different error types
 */
const getErrorMessage = (error: EmailTemplateError) => {
  const messages = {
    network: {
      title: 'Connection Problem',
      description: 'Unable to connect to the email template service. This might be due to a network issue or the service being temporarily unavailable.',
      suggestion: 'Please check your internet connection and try again.',
    },
    authorization: {
      title: 'Access Denied',
      description: 'You don\'t have permission to perform this email template operation, or your session has expired.',
      suggestion: 'Please log in again or contact your administrator for access.',
    },
    validation: {
      title: 'Invalid Data',
      description: 'The email template data contains errors or missing required information.',
      suggestion: 'Please review the template fields and correct any validation errors.',
    },
    server: {
      title: 'Server Error',
      description: 'The email template service encountered an internal error and cannot complete your request.',
      suggestion: 'Please try again in a few moments. If the problem persists, contact support.',
    },
    client: {
      title: 'Request Error',
      description: 'There was a problem with your email template request or the template was not found.',
      suggestion: 'Please verify the template information and try again.',
    },
    unknown: {
      title: 'Unexpected Error',
      description: 'An unexpected error occurred while managing email templates.',
      suggestion: 'Please try refreshing the page or contact support if the problem continues.',
    },
  };

  return messages[error.category] || messages.unknown;
};

// =============================================================================
// ERROR REPORTING INTEGRATION
// =============================================================================

/**
 * Report error to monitoring and logging systems
 * Integrates with application-wide error reporting infrastructure
 */
const reportError = async (error: EmailTemplateError, errorInfo?: any) => {
  try {
    // Enhanced error context for better debugging
    const errorReport = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      category: error.category,
      retryable: error.retryable,
      timestamp: error.timestamp,
      context: {
        ...error.context,
        page: '/system-settings/email-templates',
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: sessionStorage.getItem('session_id'),
      },
      errorInfo,
      digest: (error as any).digest, // Next.js error digest
    };

    // Development mode: Log to console with structured data
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Email Templates Error Report');
      console.error('Error:', error);
      console.table(errorReport.context);
      console.log('Stack:', error.stack);
      console.groupEnd();
    }

    // Production mode: Send to monitoring services
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service (e.g., Sentry, LogRocket, DataDog)
      // This would be implemented based on the specific monitoring solution
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(() => {
        // Fail silently to avoid recursive error reporting
      });
    }

    // Always store in local storage for potential user reporting
    const errorHistory = JSON.parse(localStorage.getItem('df_error_history') || '[]');
    errorHistory.unshift({
      ...errorReport,
      id: Math.random().toString(36).substr(2, 9),
    });
    
    // Keep only last 10 errors
    if (errorHistory.length > 10) {
      errorHistory.splice(10);
    }
    
    localStorage.setItem('df_error_history', JSON.stringify(errorHistory));
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError);
  }
};

// =============================================================================
// ERROR RECOVERY UTILITIES
// =============================================================================

/**
 * Custom hook for error recovery operations
 * Provides reusable recovery strategies for different error types
 */
const useErrorRecovery = (error: EmailTemplateError, reset: () => void) => {
  const router = useRouter();
  const [recoveryStates, setRecoveryStates] = useState<Record<string, boolean>>({});

  /**
   * Set loading state for specific recovery action
   */
  const setRecoveryLoading = useCallback((actionId: string, loading: boolean) => {
    setRecoveryStates(prev => ({
      ...prev,
      [actionId]: loading,
    }));
  }, []);

  /**
   * Retry current operation
   */
  const retryOperation = useCallback(async () => {
    setRecoveryLoading('retry', true);
    try {
      // Clear any cached data that might be causing issues
      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(
          cacheNames.map(name => window.caches.delete(name))
        );
      }
      
      // Clear component error state and retry
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setRecoveryLoading('retry', false);
    }
  }, [reset, setRecoveryLoading]);

  /**
   * Refresh page to clear any component state issues
   */
  const refreshPage = useCallback(() => {
    setRecoveryLoading('refresh', true);
    window.location.reload();
  }, [setRecoveryLoading]);

  /**
   * Navigate to email templates list
   */
  const goToTemplatesList = useCallback(() => {
    setRecoveryLoading('list', true);
    router.push('/system-settings/email-templates');
  }, [router, setRecoveryLoading]);

  /**
   * Navigate to system settings home
   */
  const goToSystemSettings = useCallback(() => {
    setRecoveryLoading('settings', true);
    router.push('/system-settings');
  }, [router, setRecoveryLoading]);

  /**
   * Navigate to application home
   */
  const goToHome = useCallback(() => {
    setRecoveryLoading('home', true);
    router.push('/');
  }, [router, setRecoveryLoading]);

  /**
   * Copy error details to clipboard for support
   */
  const copyErrorDetails = useCallback(async () => {
    setRecoveryLoading('copy', true);
    try {
      const errorDetails = {
        error: error.message,
        code: error.code,
        category: error.category,
        timestamp: error.timestamp,
        context: error.context,
        digest: (error as any).digest,
      };
      
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-success-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Error details copied to clipboard';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    } catch (copyError) {
      console.error('Failed to copy error details:', copyError);
    } finally {
      setRecoveryLoading('copy', false);
    }
  }, [error, setRecoveryLoading]);

  return {
    recoveryStates,
    retryOperation,
    refreshPage,
    goToTemplatesList,
    goToSystemSettings,
    goToHome,
    copyErrorDetails,
  };
};

// =============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * Email Templates Error Boundary Component
 * 
 * Next.js app router error boundary that provides comprehensive error handling
 * for the email templates section. Catches both React errors and network failures,
 * provides clear error messages and actionable recovery options.
 * 
 * @param error - Error object from Next.js app router
 * @param reset - Reset function to clear error state
 */
export default function EmailTemplatesError({ error, reset }: ErrorBoundaryProps) {
  // Classify and enhance the error
  const enhancedError = classifyError(error);
  const errorMessage = getErrorMessage(enhancedError);
  
  // Recovery utilities
  const {
    recoveryStates,
    retryOperation,
    refreshPage,
    goToTemplatesList,
    goToSystemSettings,
    goToHome,
    copyErrorDetails,
  } = useErrorRecovery(enhancedError, reset);

  // Report error on mount
  useEffect(() => {
    reportError(enhancedError, { componentStack: error.stack });
  }, [enhancedError, error.stack]);

  // Build recovery actions based on error type
  const recoveryActions: RecoveryAction[] = [];

  // Always include retry for retryable errors
  if (enhancedError.retryable) {
    recoveryActions.push({
      id: 'retry',
      label: 'Try Again',
      icon: ArrowPathIcon,
      handler: retryOperation,
      primary: true,
      loading: recoveryStates.retry,
    });
  }

  // Navigation options based on error severity
  if (enhancedError.category !== 'authorization') {
    recoveryActions.push({
      id: 'list',
      label: 'Email Templates',
      icon: DocumentTextIcon,
      handler: goToTemplatesList,
      loading: recoveryStates.list,
    });
  }

  recoveryActions.push(
    {
      id: 'settings',
      label: 'System Settings',
      icon: HomeIcon,
      handler: goToSystemSettings,
      loading: recoveryStates.settings,
    },
    {
      id: 'home',
      label: 'Dashboard',
      icon: HomeIcon,
      handler: goToHome,
      loading: recoveryStates.home,
    }
  );

  // Always include copy error details for support
  recoveryActions.push({
    id: 'copy',
    label: 'Copy Error Details',
    icon: ClipboardDocumentIcon,
    handler: copyErrorDetails,
    loading: recoveryStates.copy,
  });

  // Page refresh for component errors
  if (enhancedError.category === 'client' && enhancedError.code === 'COMPONENT_ERROR') {
    recoveryActions.push({
      id: 'refresh',
      label: 'Refresh Page',
      icon: ArrowPathIcon,
      handler: refreshPage,
      loading: recoveryStates.refresh,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Main error alert */}
        <Alert
          type="error"
          variant="soft"
          size="lg"
          title={errorMessage.title}
          description={errorMessage.description}
          showIcon={true}
          fullWidth={true}
          priority="high"
          announce={true}
          announceText={`Error in email templates: ${errorMessage.title}`}
          className="mb-6"
        >
          {/* Error details section */}
          <div className="mt-4 space-y-3">
            {/* Suggestion */}
            <div className="text-sm text-error-700 dark:text-error-300">
              <strong>What you can do:</strong> {errorMessage.suggestion}
            </div>

            {/* Technical details (collapsible) */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-error-800 dark:text-error-200 hover:text-error-900 dark:hover:text-error-100 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Technical Details
                <span className="text-xs ml-auto group-open:hidden">Click to expand</span>
                <span className="text-xs ml-auto hidden group-open:inline">Click to collapse</span>
              </summary>
              <div className="mt-2 p-3 bg-error-100 dark:bg-error-900/20 rounded-md border border-error-200 dark:border-error-800">
                <dl className="space-y-2 text-xs">
                  <div>
                    <dt className="font-semibold text-error-800 dark:text-error-200">Error Code:</dt>
                    <dd className="text-error-700 dark:text-error-300 font-mono">{enhancedError.code || 'UNKNOWN'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-error-800 dark:text-error-200">Category:</dt>
                    <dd className="text-error-700 dark:text-error-300 capitalize">{enhancedError.category}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-error-800 dark:text-error-200">Time:</dt>
                    <dd className="text-error-700 dark:text-error-300">{enhancedError.timestamp ? new Date(enhancedError.timestamp).toLocaleString() : 'Unknown'}</dd>
                  </div>
                  {enhancedError.context?.operation && (
                    <div>
                      <dt className="font-semibold text-error-800 dark:text-error-200">Operation:</dt>
                      <dd className="text-error-700 dark:text-error-300 capitalize">{enhancedError.context.operation}</dd>
                    </div>
                  )}
                  {enhancedError.context?.templateId && (
                    <div>
                      <dt className="font-semibold text-error-800 dark:text-error-200">Template ID:</dt>
                      <dd className="text-error-700 dark:text-error-300 font-mono">{enhancedError.context.templateId}</dd>
                    </div>
                  )}
                  {(error as any).digest && (
                    <div>
                      <dt className="font-semibold text-error-800 dark:text-error-200">Error Digest:</dt>
                      <dd className="text-error-700 dark:text-error-300 font-mono break-all">{(error as any).digest}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-semibold text-error-800 dark:text-error-200">Message:</dt>
                    <dd className="text-error-700 dark:text-error-300 break-words">{error.message}</dd>
                  </div>
                </dl>
              </div>
            </details>
          </div>

          {/* Recovery actions */}
          <Alert.Actions
            actions={
              <div className="flex flex-wrap gap-2 mt-4">
                {recoveryActions.map((action, index) => (
                  <Button
                    key={action.id}
                    variant={action.primary ? "primary" : index === 0 && !recoveryActions.some(a => a.primary) ? "primary" : "secondary"}
                    size="sm"
                    onClick={action.handler}
                    loading={action.loading}
                    disabled={action.disabled}
                    icon={action.icon && <action.icon className="h-4 w-4" />}
                    ariaLabel={`${action.label}${action.loading ? ' - Loading' : ''}`}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            }
            layout="horizontal"
            alignment="start"
            stackOnMobile={true}
          />
        </Alert>

        {/* Development mode additional information */}
        {process.env.NODE_ENV === 'development' && (
          <Alert
            type="info"
            variant="outlined"
            title="Development Information"
            description="Additional error information is available in the browser console."
            size="sm"
            dismissible={true}
            className="mt-4"
          >
            <div className="mt-2 text-xs">
              <p className="mb-2">
                This error boundary is integrated with MSW (Mock Service Worker) for realistic error scenario testing during development.
              </p>
              <p>
                Error category: <code className="bg-primary-100 dark:bg-primary-900 px-1 rounded text-primary-800 dark:text-primary-200">{enhancedError.category}</code> | 
                Retryable: <code className="bg-primary-100 dark:bg-primary-900 px-1 rounded text-primary-800 dark:text-primary-200">{String(enhancedError.retryable)}</code>
              </p>
            </div>
          </Alert>
        )}

        {/* Accessibility status for screen readers */}
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
          role="status"
        >
          Email templates error: {errorMessage.title}. {recoveryActions.length} recovery options available.
        </div>
      </div>
    </div>
  );
}