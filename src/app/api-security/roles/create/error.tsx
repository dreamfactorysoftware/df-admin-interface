'use client';

/**
 * Role Creation Error Boundary Component
 * 
 * Next.js error boundary component for the role creation page that handles and displays
 * errors in role creation workflows including validation errors, API failures, and form
 * submission issues. Provides user-friendly error messages and recovery actions while
 * maintaining application stability during role creation operations.
 * 
 * Features:
 * - Comprehensive error handling per Section 4.2 error handling requirements
 * - User-friendly error recovery interfaces per Section 7.6 user interactions
 * - Accessibility compliance for error states per WCAG 2.1 AA requirements
 * - Role creation specific error handling per F-005 User and Role Management
 * - Next.js app router error boundary conventions
 * - Tailwind CSS styling with responsive design
 * - Internationalization support for error messages
 * 
 * Architecture:
 * - React Error Boundary integration with Next.js app router
 * - Mock Service Worker integration for development error testing
 * - Comprehensive error categorization and recovery actions
 * - Performance optimized with React 19 concurrent features
 */

import React, { useEffect, useCallback, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, ArrowLeft, Home, Bug, Network, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// ERROR TYPES AND INTERFACES
// ============================================================================

interface RoleCreationError extends Error {
  code?: string;
  status?: number;
  field?: string;
  details?: Record<string, any>;
  timestamp?: Date;
  context?: 'validation' | 'api' | 'network' | 'authorization' | 'service' | 'lookup';
}

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorDisplayProps {
  error: RoleCreationError;
  onRetry: () => void;
  onGoBack: () => void;
  onGoHome: () => void;
  onToggleDetails: () => void;
  showDetails: boolean;
}

// ============================================================================
// ERROR CATEGORIZATION AND MESSAGES
// ============================================================================

const ERROR_CATEGORIES = {
  VALIDATION: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    title: 'Validation Error',
    description: 'There are issues with the role configuration that need to be corrected.',
    canRetry: true,
    primaryAction: 'Fix Issues'
  },
  API: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    title: 'API Error',
    description: 'The server encountered an error while creating the role.',
    canRetry: true,
    primaryAction: 'Try Again'
  },
  NETWORK: {
    icon: Network,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    title: 'Network Error',
    description: 'Unable to connect to the server. Please check your connection.',
    canRetry: true,
    primaryAction: 'Retry Connection'
  },
  AUTHORIZATION: {
    icon: Shield,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    title: 'Access Denied',
    description: 'You do not have permission to create roles.',
    canRetry: false,
    primaryAction: 'Contact Administrator'
  },
  SERVICE: {
    icon: Bug,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    title: 'Service Access Error',
    description: 'Error configuring service access permissions for the role.',
    canRetry: true,
    primaryAction: 'Retry Configuration'
  },
  LOOKUP: {
    icon: AlertTriangle,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    title: 'Lookup Key Validation Error',
    description: 'Invalid or missing lookup key configuration for the role.',
    canRetry: true,
    primaryAction: 'Check Configuration'
  }
} as const;

const getErrorCategory = (error: RoleCreationError): keyof typeof ERROR_CATEGORIES => {
  // Network errors
  if (!navigator.onLine || error.message.includes('network') || error.message.includes('fetch')) {
    return 'NETWORK';
  }
  
  // Authorization errors (403, 401)
  if (error.status === 401 || error.status === 403 || error.message.includes('unauthorized') || error.message.includes('forbidden')) {
    return 'AUTHORIZATION';
  }
  
  // Validation errors (400, specific validation contexts)
  if (error.status === 400 || error.context === 'validation' || error.field) {
    return 'VALIDATION';
  }
  
  // Service access configuration errors
  if (error.message.includes('service') || error.message.includes('access') || error.context === 'service') {
    return 'SERVICE';
  }
  
  // Lookup key validation errors
  if (error.message.includes('lookup') || error.message.includes('key') || error.context === 'lookup') {
    return 'LOOKUP';
  }
  
  // Default to API error for server errors (500+)
  return 'API';
};

const getErrorMessage = (error: RoleCreationError): string => {
  // Check for specific role creation error messages
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (errorMessage.includes('role name') || errorMessage.includes('name already exists')) {
    return 'A role with this name already exists. Please choose a different name.';
  }
  
  if (errorMessage.includes('invalid service') || errorMessage.includes('service not found')) {
    return 'One or more selected services are invalid or no longer available.';
  }
  
  if (errorMessage.includes('lookup key') || errorMessage.includes('invalid key')) {
    return 'Invalid lookup key configuration. Please verify the lookup key values.';
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('access denied')) {
    return 'You do not have sufficient permissions to create roles with the selected configuration.';
  }
  
  if (errorMessage.includes('validation') || error.field) {
    return `Validation failed${error.field ? ` for field: ${error.field}` : ''}. Please check the form values and try again.`;
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }
  
  if (error.status === 404) {
    return 'The role creation endpoint is not available. Please contact your administrator.';
  }
  
  if (error.status === 409) {
    return 'A role with this configuration already exists or conflicts with existing roles.';
  }
  
  if (error.status === 422) {
    return 'The role configuration is invalid. Please review all fields and try again.';
  }
  
  if (error.status && error.status >= 500) {
    return 'The server encountered an internal error. Please try again later or contact support.';
  }
  
  // Fallback to original error message or generic message
  return error.message || 'An unexpected error occurred while creating the role.';
};

// ============================================================================
// ERROR DISPLAY COMPONENT
// ============================================================================

function ErrorDisplay({ 
  error, 
  onRetry, 
  onGoBack, 
  onGoHome, 
  onToggleDetails, 
  showDetails 
}: ErrorDisplayProps) {
  const category = getErrorCategory(error);
  const categoryConfig = ERROR_CATEGORIES[category];
  const Icon = categoryConfig.icon;
  const errorMessage = getErrorMessage(error);

  return (
    <div 
      className={cn(
        "max-w-2xl mx-auto p-6 rounded-lg border",
        categoryConfig.bgColor,
        categoryConfig.borderColor
      )}
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      {/* Error Header */}
      <div className="flex items-start space-x-4">
        <div className={cn("flex-shrink-0", categoryConfig.color)}>
          <Icon 
            className="h-8 w-8" 
            aria-hidden="true"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 
            id="error-title"
            className={cn(
              "text-xl font-semibold mb-2",
              categoryConfig.color
            )}
          >
            {categoryConfig.title}
          </h2>
          
          <p 
            id="error-description"
            className="text-gray-700 dark:text-gray-300 mb-4"
          >
            {categoryConfig.description}
          </p>
          
          <div className={cn(
            "p-4 rounded-md border-l-4 mb-6",
            "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          )}>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Error Details:
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {errorMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Error Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {categoryConfig.canRetry && (
          <Button
            onClick={onRetry}
            variant="default"
            className="flex items-center justify-center"
            aria-label={`${categoryConfig.primaryAction}: Retry role creation operation`}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {categoryConfig.primaryAction}
          </Button>
        )}
        
        <Button
          onClick={onGoBack}
          variant="outline"
          className="flex items-center justify-center"
          aria-label="Go back to role creation form"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back to Form
        </Button>
        
        <Button
          onClick={onGoHome}
          variant="ghost"
          className="flex items-center justify-center"
          aria-label="Return to dashboard home page"
        >
          <Home className="h-4 w-4 mr-2" />
          Return to Dashboard
        </Button>
      </div>

      {/* Technical Details Toggle */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={onToggleDetails}
          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          aria-expanded={showDetails}
          aria-controls="technical-details"
          aria-label={`${showDetails ? 'Hide' : 'Show'} technical error details`}
        >
          {showDetails ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span>{showDetails ? 'Hide' : 'Show'} Technical Details</span>
        </button>
        
        {showDetails && (
          <div 
            id="technical-details"
            className="mt-3 p-4 bg-gray-100 dark:bg-gray-900 rounded-md border"
            role="region"
            aria-label="Technical error information"
          >
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-gray-900 dark:text-gray-100">Error Code:</dt>
                <dd className="text-gray-700 dark:text-gray-300 font-mono">
                  {error.code || error.status || 'N/A'}
                </dd>
              </div>
              
              <div>
                <dt className="font-medium text-gray-900 dark:text-gray-100">Timestamp:</dt>
                <dd className="text-gray-700 dark:text-gray-300 font-mono">
                  {error.timestamp?.toISOString() || new Date().toISOString()}
                </dd>
              </div>
              
              {error.field && (
                <div>
                  <dt className="font-medium text-gray-900 dark:text-gray-100">Field:</dt>
                  <dd className="text-gray-700 dark:text-gray-300 font-mono">{error.field}</dd>
                </div>
              )}
              
              {error.context && (
                <div>
                  <dt className="font-medium text-gray-900 dark:text-gray-100">Context:</dt>
                  <dd className="text-gray-700 dark:text-gray-300 font-mono">{error.context}</dd>
                </div>
              )}
              
              <div>
                <dt className="font-medium text-gray-900 dark:text-gray-100">Stack Trace:</dt>
                <dd className="text-gray-700 dark:text-gray-300 font-mono text-xs mt-1 max-h-32 overflow-y-auto">
                  {error.stack || 'No stack trace available'}
                </dd>
              </div>
              
              {error.details && Object.keys(error.details).length > 0 && (
                <div>
                  <dt className="font-medium text-gray-900 dark:text-gray-100">Additional Details:</dt>
                  <dd className="text-gray-700 dark:text-gray-300 font-mono text-xs mt-1">
                    <pre className="whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {JSON.stringify(error.details, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Role Creation Error Boundary Component
 * 
 * Next.js error boundary component that handles errors during role creation
 * workflows with comprehensive error categorization and recovery actions.
 */
export default function RoleCreateError({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();
  const [showDetails, setShowDetails] = React.useState(false);

  // Enhanced error object with role creation context
  const roleCreationError: RoleCreationError = {
    ...error,
    timestamp: new Date(),
    context: error.message?.includes('validation') ? 'validation' :
             error.message?.includes('service') ? 'service' :
             error.message?.includes('lookup') ? 'lookup' : 'api'
  };

  // Log error for monitoring and debugging
  useEffect(() => {
    console.error('Role Creation Error:', {
      message: roleCreationError.message,
      code: roleCreationError.code,
      status: roleCreationError.status,
      context: roleCreationError.context,
      field: roleCreationError.field,
      timestamp: roleCreationError.timestamp,
      stack: roleCreationError.stack
    });

    // Report to error monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Integration point for error monitoring services like Sentry
      // window.Sentry?.captureException(roleCreationError);
    }
  }, [roleCreationError]);

  // Error recovery actions
  const handleRetry = useCallback(() => {
    startTransition(() => {
      reset();
    });
  }, [reset]);

  const handleGoBack = useCallback(() => {
    startTransition(() => {
      router.back();
    });
  }, [router]);

  const handleGoHome = useCallback(() => {
    startTransition(() => {
      router.push('/');
    });
  }, [router]);

  const handleToggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Role Creation Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            An error occurred while creating the role. Please review the details below and try again.
          </p>
        </div>

        {/* Error Display */}
        <ErrorDisplay
          error={roleCreationError}
          onRetry={handleRetry}
          onGoBack={handleGoBack}
          onGoHome={handleGoHome}
          onToggleDetails={handleToggleDetails}
          showDetails={showDetails}
        />

        {/* Additional Help */}
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Need Additional Help?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Common Solutions:
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>Ensure the role name is unique and follows naming conventions</li>
                <li>Verify all selected services are still available and accessible</li>
                <li>Check that lookup key values are properly configured</li>
                <li>Confirm you have the necessary permissions to create roles</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                If the problem persists:
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>Contact your system administrator for assistance</li>
                <li>Check the system status and maintenance schedule</li>
                <li>Review the role creation documentation</li>
                <li>Report this error with the technical details shown above</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Accessibility Information */}
        <div className="sr-only">
          <p>
            This page displays an error that occurred during role creation. 
            Use the provided buttons to retry the operation, go back to the form, 
            or return to the dashboard. Technical details can be shown or hidden 
            using the toggle button for debugging purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

// Mock Service Worker integration for development error testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Enable MSW for comprehensive error scenario testing
  import('@/test/mocks/browser').then(({ worker }) => {
    if (!worker.listHandlers().length) {
      worker.start({
        onUnhandledRequest: 'bypass',
        quiet: true,
      });
    }
  }).catch(() => {
    // MSW not available, continue without mocking
  });
}