'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Types for error handling
interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface AdminCreationError extends Error {
  code?: string;
  field?: string;
  context?: {
    resource?: Array<{ message: string }>;
  };
  response?: {
    status: number;
    data?: {
      error?: {
        message: string;
        context?: {
          resource?: Array<{ message: string }>;
        };
      };
    };
  };
}

interface ErrorBoundaryProps {
  error: AdminCreationError;
  reset: () => void;
}

// Error parsing utility equivalent to Angular parseError
const parseAdminError = (errorString: string | null): string => {
  if (!errorString) {
    return 'An unexpected error occurred during admin creation';
  }

  const errorPatterns = [
    {
      regex: /Duplicate entry '([^']+)' for key 'user_email_unique'/,
      message: 'An admin with this email address already exists',
    },
    {
      regex: /Duplicate entry '([^']+)' for key 'user_username_unique'/,
      message: 'An admin with this username already exists',
    },
    {
      regex: /Password must be at least (\d+) characters/,
      message: 'Password must be at least 16 characters long',
    },
    {
      regex: /Email format is invalid/,
      message: 'Please enter a valid email address',
    },
    {
      regex: /Access denied|Permission denied|Unauthorized/i,
      message: 'You do not have permission to create administrators',
    },
    {
      regex: /Network error|Failed to fetch/i,
      message: 'Network connection error. Please check your connection and try again',
    },
    {
      regex: /Validation failed/i,
      message: 'Please check your form inputs and correct any errors',
    },
    {
      regex: /Rate limit exceeded/i,
      message: 'Too many requests. Please wait a moment before trying again',
    },
    {
      regex: /Server error|Internal server error/i,
      message: 'Server error occurred. Please try again later',
    },
  ];

  const matchedError = errorPatterns.find(pattern => 
    pattern.regex.test(errorString)
  );

  return matchedError ? matchedError.message : errorString;
};

// Error logging utility
const logError = async (error: AdminCreationError, errorInfo?: ErrorInfo) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    code: error.code,
    field: error.field,
    context: error.context,
    response: error.response,
    timestamp: new Date().toISOString(),
    route: '/adf-admins/create',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  // In production, this would send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    try {
      await fetch('/api/error-reporting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  } else {
    console.error('Admin Creation Error:', errorData);
  }
};

// Error recovery utility
const getRecoveryActions = (error: AdminCreationError) => {
  const actions = [];

  // Network errors - retry action
  if (error.message.includes('Network') || error.message.includes('fetch')) {
    actions.push({
      type: 'retry',
      label: 'Try Again',
      description: 'Retry the admin creation process',
    });
  }

  // Validation errors - edit action
  if (error.message.includes('Validation') || error.message.includes('required')) {
    actions.push({
      type: 'edit',
      label: 'Edit Form',
      description: 'Go back to review and correct the form',
    });
  }

  // Permission errors - contact admin action
  if (error.message.includes('permission') || error.message.includes('Unauthorized')) {
    actions.push({
      type: 'contact',
      label: 'Contact Administrator',
      description: 'Request admin creation permissions',
    });
  }

  // Duplicate entry errors - suggest alternatives
  if (error.message.includes('already exists')) {
    actions.push({
      type: 'edit',
      label: 'Use Different Details',
      description: 'Try with a different email or username',
    });
  }

  // Default fallback actions
  actions.push({
    type: 'navigate',
    label: 'Return to Admin List',
    description: 'Go back to the administrators list',
  });

  return actions;
};

// Error message component
const ErrorMessage = ({ error, onRetry, onEdit, onNavigate }: {
  error: AdminCreationError;
  onRetry: () => void;
  onEdit: () => void;
  onNavigate: () => void;
}) => {
  const parsedMessage = parseAdminError(error.message);
  const recoveryActions = getRecoveryActions(error);

  return (
    <div 
      className="rounded-md bg-red-50 p-4 border border-red-200"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-400" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Admin Creation Failed
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{parsedMessage}</p>
          </div>
          {recoveryActions.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                {recoveryActions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      switch (action.type) {
                        case 'retry':
                          onRetry();
                          break;
                        case 'edit':
                          onEdit();
                          break;
                        case 'navigate':
                          onNavigate();
                          break;
                        case 'contact':
                          // In a real app, this might open a contact form or email
                          alert('Please contact your system administrator for assistance.');
                          break;
                      }
                    }}
                    className={`
                      inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm
                      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${index === 0 
                        ? 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500' 
                        : 'bg-white text-red-600 border border-red-300 hover:bg-red-50 focus:ring-red-500'
                      }
                    `}
                    aria-label={`${action.label}: ${action.description}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading spinner component for retry operations
const LoadingSpinner = () => (
  <div 
    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
    role="status"
    aria-label="Loading"
  >
    <span className="sr-only">Loading...</span>
  </div>
);

// Main error boundary component
export default function AdminCreateError({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Log error on mount and when error changes
  useEffect(() => {
    logError(error);
  }, [error]);

  // Handle retry with exponential backoff for transient errors
  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      alert('Maximum retry attempts reached. Please try again later or contact support.');
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;
    
    setTimeout(() => {
      setIsRetrying(false);
      reset();
    }, delay);
  };

  // Handle editing - reload the page to reset form state
  const handleEdit = () => {
    window.location.reload();
  };

  // Handle navigation to admin list
  const handleNavigate = () => {
    router.push('/adf-admins');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <div className="text-center mb-8">
          <svg 
            className="mx-auto h-12 w-12 text-red-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-base text-gray-500">
            An error occurred while creating the administrator account.
          </p>
        </div>

        {isRetrying ? (
          <div 
            className="text-center"
            role="status"
            aria-live="polite"
          >
            <LoadingSpinner />
            <p className="mt-2 text-sm text-gray-600">
              Retrying... (Attempt {retryCount + 1} of {maxRetries})
            </p>
          </div>
        ) : (
          <ErrorMessage
            error={error}
            onRetry={handleRetry}
            onEdit={handleEdit}
            onNavigate={handleNavigate}
          />
        )}

        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 p-4 bg-gray-100 rounded-md">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Error Details (Development)
            </summary>
            <div className="mt-2 text-xs text-gray-600 font-mono">
              <p><strong>Message:</strong> {error.message}</p>
              {error.code && <p><strong>Code:</strong> {error.code}</p>}
              {error.field && <p><strong>Field:</strong> {error.field}</p>}
              {error.stack && (
                <div className="mt-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Accessibility announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {error.message && `Error: ${parseAdminError(error.message)}`}
        </div>
      </div>
    </div>
  );
}

// Error boundary hook for additional error handling
export const useAdminErrorHandler = () => {
  const router = useRouter();

  const handleError = (error: AdminCreationError) => {
    // Log error
    logError(error);

    // Navigate to error page if not in error boundary
    if (error.response?.status === 403) {
      router.push('/unauthorized');
    } else if (error.response?.status === 404) {
      router.push('/not-found');
    }
  };

  return { handleError };
};