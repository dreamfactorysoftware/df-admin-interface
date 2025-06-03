'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Error boundary component for the profile management section providing graceful error handling
 * with recovery options and user-friendly messaging. Implements React 19 error boundary patterns
 * with comprehensive error logging, retry mechanisms, and accessible error UI for robust user
 * experience during profile updates, security question changes, and password modifications.
 */

// Profile-specific error types for contextual handling
type ProfileErrorType = 
  | 'PROFILE_UPDATE_FAILED'
  | 'PASSWORD_CHANGE_ERROR'
  | 'SECURITY_QUESTION_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'UNKNOWN_ERROR';

interface ProfileError {
  type: ProfileErrorType;
  message: string;
  cause?: Error;
  retryable: boolean;
  timestamp: Date;
}

interface ProfileErrorInfo {
  error: Error;
  errorInfo: {
    componentStack: string;
    errorBoundary?: string;
  };
}

// Enhanced error logger utility for production error analysis
const logError = (error: ProfileError, errorInfo?: ProfileErrorInfo) => {
  const errorReport = {
    ...error,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    componentStack: errorInfo?.errorInfo.componentStack,
    stack: error.cause?.stack,
    sessionId: typeof window !== 'undefined' ? window.sessionStorage.getItem('session_id') : null,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Profile Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Full Report:', errorReport);
    console.groupEnd();
  }

  // In production, this would send to monitoring service
  // TODO: Integrate with error tracking service (e.g., Sentry, Bugsnag)
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorTracking(errorReport);
  }
};

// Error classification utility
const classifyError = (error: Error): ProfileError => {
  const message = error.message.toLowerCase();
  const timestamp = new Date();

  // Profile-specific error classification
  if (message.includes('profile') && message.includes('update')) {
    return {
      type: 'PROFILE_UPDATE_FAILED',
      message: 'Failed to update profile information. Please verify your details and try again.',
      cause: error,
      retryable: true,
      timestamp,
    };
  }

  if (message.includes('password')) {
    return {
      type: 'PASSWORD_CHANGE_ERROR',
      message: 'Password update failed. Please verify your current password and try again.',
      cause: error,
      retryable: true,
      timestamp,
    };
  }

  if (message.includes('security') && message.includes('question')) {
    return {
      type: 'SECURITY_QUESTION_ERROR',
      message: 'Failed to update security question. Please try again later.',
      cause: error,
      retryable: true,
      timestamp,
    };
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connection error. Please check your internet connection and try again.',
      cause: error,
      retryable: true,
      timestamp,
    };
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return {
      type: 'VALIDATION_ERROR',
      message: 'Please check your input and ensure all required fields are completed correctly.',
      cause: error,
      retryable: false,
      timestamp,
    };
  }

  if (message.includes('unauthorized') || message.includes('authentication')) {
    return {
      type: 'AUTHENTICATION_ERROR',
      message: 'Your session has expired. Please log in again to continue.',
      cause: error,
      retryable: false,
      timestamp,
    };
  }

  if (message.includes('forbidden') || message.includes('permission')) {
    return {
      type: 'PERMISSION_ERROR',
      message: 'You do not have permission to perform this action. Please contact your administrator.',
      cause: error,
      retryable: false,
      timestamp,
    };
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    cause: error,
    retryable: true,
    timestamp,
  };
};

// Error recovery utilities
const getRecoveryActions = (errorType: ProfileErrorType) => {
  switch (errorType) {
    case 'PROFILE_UPDATE_FAILED':
      return [
        'Verify all required fields are completed',
        'Check your internet connection',
        'Try refreshing the page',
        'Contact support if the issue persists',
      ];
    
    case 'PASSWORD_CHANGE_ERROR':
      return [
        'Ensure your current password is correct',
        'Verify the new password meets requirements',
        'Check that password confirmation matches',
        'Try logging out and back in',
      ];
    
    case 'SECURITY_QUESTION_ERROR':
      return [
        'Ensure the security question is selected',
        'Verify the answer is provided',
        'Try refreshing the page',
        'Contact support if needed',
      ];
    
    case 'NETWORK_ERROR':
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'Disable VPN if active',
        'Contact IT support if connectivity issues persist',
      ];
    
    case 'VALIDATION_ERROR':
      return [
        'Review all form fields for errors',
        'Ensure required fields are completed',
        'Check data format (email, phone, etc.)',
        'Clear form and start over if needed',
      ];
    
    case 'AUTHENTICATION_ERROR':
      return [
        'Log out and log back in',
        'Clear browser cache and cookies',
        'Try using an incognito/private browser window',
        'Contact administrator for account assistance',
      ];
    
    case 'PERMISSION_ERROR':
      return [
        'Contact your system administrator',
        'Verify you have the necessary permissions',
        'Check if your role allows profile editing',
        'Request access from the appropriate authority',
      ];
    
    default:
      return [
        'Try refreshing the page',
        'Clear browser cache and cookies',
        'Try using a different browser',
        'Contact technical support for assistance',
      ];
  }
};

// Retry utility with exponential backoff
const createRetryHandler = (onRetry: () => void, maxRetries: number = 3) => {
  let retryCount = 0;
  
  return () => {
    if (retryCount < maxRetries) {
      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000); // Max 10 second delay
      
      setTimeout(() => {
        onRetry();
      }, delay);
    }
  };
};

interface ProfileErrorPageProps {
  error: Error;
  reset: () => void;
}

/**
 * Next.js Error Boundary component for profile management section
 * Implements app router conventions with comprehensive error handling
 */
export default function ProfileError({ error, reset }: ProfileErrorPageProps) {
  const router = useRouter();
  const [profileError, setProfileError] = useState<ProfileError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Initialize error classification and logging
  useEffect(() => {
    const classifiedError = classifyError(error);
    setProfileError(classifiedError);
    
    // Log error for monitoring and debugging
    logError(classifiedError, {
      error,
      errorInfo: {
        componentStack: 'ProfileErrorBoundary',
        errorBoundary: 'src/app/adf-profile/error.tsx',
      },
    });

    // Announce error to screen readers
    const announcement = `Error occurred: ${classifiedError.message}`;
    const ariaLiveRegion = document.createElement('div');
    ariaLiveRegion.setAttribute('aria-live', 'assertive');
    ariaLiveRegion.setAttribute('aria-atomic', 'true');
    ariaLiveRegion.className = 'sr-only';
    ariaLiveRegion.textContent = announcement;
    document.body.appendChild(ariaLiveRegion);

    // Clean up announcement after screen readers have processed it
    setTimeout(() => {
      document.body.removeChild(ariaLiveRegion);
    }, 1000);
  }, [error]);

  // Enhanced retry handler with loading state
  const handleRetry = () => {
    if (!profileError?.retryable || retryCount >= 3) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
    
    setTimeout(() => {
      setIsRetrying(false);
      reset();
    }, delay);
  };

  // Navigate to different sections
  const handleNavigateHome = () => {
    router.push('/adf-home');
  };

  const handleNavigateToLogin = () => {
    router.push('/login');
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  if (!profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading error information...</p>
        </div>
      </div>
    );
  }

  const recoveryActions = getRecoveryActions(profileError.type);
  const maxRetriesReached = retryCount >= 3;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Error announcement for screen readers */}
      <div 
        role="alert" 
        aria-live="assertive" 
        className="sr-only"
      >
        Profile management error: {profileError.message}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Error icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <svg 
              className="h-12 w-12 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth="1.5" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
              />
            </svg>
          </div>
        </div>

        {/* Error title */}
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Profile Management Error
        </h1>

        {/* Error type badge */}
        <div className="mt-4 flex justify-center">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            profileError.type === 'NETWORK_ERROR' ? 'bg-orange-100 text-orange-800' :
            profileError.type === 'AUTHENTICATION_ERROR' ? 'bg-red-100 text-red-800' :
            profileError.type === 'PERMISSION_ERROR' ? 'bg-red-100 text-red-800' :
            profileError.type === 'VALIDATION_ERROR' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {profileError.type.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Error message */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              {profileError.message}
            </p>
          </div>

          {/* Recovery actions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Suggested actions:
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              {recoveryActions.map((action, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 mr-3" aria-hidden="true"></span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Retry button - only show for retryable errors */}
            {profileError.retryable && !maxRetriesReached && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isRetrying 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                } transition-colors duration-200`}
                aria-describedby="retry-description"
              >
                {isRetrying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Retrying...
                  </>
                ) : (
                  `Try Again ${retryCount > 0 ? `(${3 - retryCount} attempts left)` : ''}`
                )}
              </button>
            )}
            
            {/* Retry exhausted message */}
            {maxRetriesReached && (
              <div className="text-sm text-orange-600 text-center p-3 bg-orange-50 rounded-md">
                Maximum retry attempts reached. Please try one of the other options below.
              </div>
            )}

            {/* Refresh page button */}
            <button
              onClick={handleRefreshPage}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Refresh Page
            </button>

            {/* Navigation buttons */}
            {profileError.type === 'AUTHENTICATION_ERROR' ? (
              <button
                onClick={handleNavigateToLogin}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Go to Login
              </button>
            ) : (
              <button
                onClick={handleNavigateHome}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Return to Dashboard
              </button>
            )}
          </div>

          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                <p><strong>Type:</strong> {profileError.type}</p>
                <p><strong>Timestamp:</strong> {profileError.timestamp.toISOString()}</p>
                <p><strong>Retryable:</strong> {profileError.retryable ? 'Yes' : 'No'}</p>
                <p><strong>Retry Count:</strong> {retryCount}</p>
                {profileError.cause && (
                  <>
                    <p><strong>Original Error:</strong> {profileError.cause.message}</p>
                    {profileError.cause.stack && (
                      <pre className="mt-2 text-xs overflow-auto max-h-32 bg-white p-2 rounded border">
                        {profileError.cause.stack}
                      </pre>
                    )}
                  </>
                )}
              </div>
            </details>
          )}

          {/* Hidden description for screen readers */}
          <div id="retry-description" className="sr-only">
            {profileError.retryable && !maxRetriesReached && 
              `This will attempt to recover from the ${profileError.type.replace(/_/g, ' ').toLowerCase()} error. You have ${3 - retryCount} attempts remaining.`
            }
          </div>
        </div>
      </div>

      {/* Footer with additional help */}
      <div className="mt-8 text-center text-xs text-gray-500">
        <p>If this error persists, please contact technical support with the error type: <code className="bg-gray-100 px-1 py-0.5 rounded">{profileError.type}</code></p>
      </div>
    </div>
  );
}