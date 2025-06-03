'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, User, Shield } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary component for the admin editing route providing graceful error handling
 * with recovery options and user-friendly messaging. Implements React 19 error boundary
 * patterns with comprehensive error logging, retry mechanisms, and accessible error UI.
 */
export default function AdminEditError({ error, reset }: ErrorProps) {
  const router = useRouter();
  const params = useParams();
  const errorAnnouncementRef = useRef<HTMLDivElement>(null);
  const adminId = params?.id as string;

  // Announce error to screen readers
  useEffect(() => {
    if (errorAnnouncementRef.current) {
      errorAnnouncementRef.current.focus();
    }
  }, []);

  // Log error for monitoring and debugging
  useEffect(() => {
    const logError = async () => {
      try {
        // Enhanced error logging with admin context
        const errorDetails = {
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          timestamp: new Date().toISOString(),
          route: `/adf-admins/${adminId}`,
          userAgent: navigator.userAgent,
          url: window.location.href,
          adminId: adminId,
          errorType: getErrorType(error),
          sessionId: getSessionId(),
        };

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Admin Edit Error:', errorDetails);
        }

        // Send to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          await fetch('/api/error-logging', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(errorDetails),
          }).catch(() => {
            // Silently fail if logging service is unavailable
          });
        }
      } catch (logError) {
        // Prevent logging errors from affecting user experience
        console.warn('Failed to log error:', logError);
      }
    };

    logError();
  }, [error, adminId]);

  /**
   * Determines the type of error based on error message and context
   */
  const getErrorType = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('404') || message.includes('not found')) {
      return 'ADMIN_NOT_FOUND';
    }
    if (message.includes('403') || message.includes('forbidden') || message.includes('permission')) {
      return 'PERMISSION_DENIED';
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'AUTHENTICATION_REQUIRED';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    return 'UNKNOWN_ERROR';
  };

  /**
   * Gets session ID for error tracking
   */
  const getSessionId = (): string => {
    try {
      // Try to get session ID from storage or generate a temporary one
      return sessionStorage.getItem('sessionId') || `temp-${Date.now()}`;
    } catch {
      return `temp-${Date.now()}`;
    }
  };

  /**
   * Gets user-friendly error message based on error type
   */
  const getErrorMessage = (): { title: string; description: string; icon: React.ReactNode } => {
    const errorType = getErrorType(error);
    
    switch (errorType) {
      case 'ADMIN_NOT_FOUND':
        return {
          title: 'Administrator Not Found',
          description: `The administrator with ID "${adminId}" could not be found. This admin may have been deleted or the ID may be incorrect.`,
          icon: <User className="h-6 w-6" aria-hidden="true" />,
        };
      
      case 'PERMISSION_DENIED':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to edit this administrator. Please contact your system administrator for access.',
          icon: <Shield className="h-6 w-6" aria-hidden="true" />,
        };
      
      case 'AUTHENTICATION_REQUIRED':
        return {
          title: 'Authentication Required',
          description: 'Your session has expired. Please log in again to continue editing this administrator.',
          icon: <User className="h-6 w-6" aria-hidden="true" />,
        };
      
      case 'VALIDATION_ERROR':
        return {
          title: 'Validation Error',
          description: 'There was an error validating the administrator data. Please check your input and try again.',
          icon: <AlertTriangle className="h-6 w-6" aria-hidden="true" />,
        };
      
      case 'NETWORK_ERROR':
        return {
          title: 'Connection Error',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
          icon: <AlertTriangle className="h-6 w-6" aria-hidden="true" />,
        };
      
      default:
        return {
          title: 'Unexpected Error',
          description: 'An unexpected error occurred while loading the administrator editor. Our team has been notified.',
          icon: <AlertTriangle className="h-6 w-6" aria-hidden="true" />,
        };
    }
  };

  /**
   * Handles retry action with appropriate recovery strategy
   */
  const handleRetry = async () => {
    const errorType = getErrorType(error);
    
    // Different retry strategies based on error type
    switch (errorType) {
      case 'NETWORK_ERROR':
        // For network errors, wait a moment then retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        reset();
        break;
      
      case 'AUTHENTICATION_REQUIRED':
        // Redirect to login
        router.push('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
        break;
      
      case 'PERMISSION_DENIED':
        // Navigate back to admin list
        router.push('/adf-admins');
        break;
      
      case 'ADMIN_NOT_FOUND':
        // Navigate back to admin list
        router.push('/adf-admins');
        break;
      
      default:
        // Standard retry for other errors
        reset();
        break;
    }
  };

  /**
   * Handles navigation back to admin list
   */
  const handleBackToList = () => {
    router.push('/adf-admins');
  };

  /**
   * Handles navigation to dashboard
   */
  const handleGoHome = () => {
    router.push('/');
  };

  const { title, description, icon } = getErrorMessage();
  const errorType = getErrorType(error);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Screen reader announcement */}
      <div
        ref={errorAnnouncementRef}
        className="sr-only"
        tabIndex={-1}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        Error occurred while editing administrator: {title}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Error Icon and Title */}
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              {icon}
            </div>
            <h1 className="mt-4 text-xl font-semibold text-gray-900 text-center">
              {title}
            </h1>
          </div>

          {/* Error Description */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 text-center leading-relaxed">
              {description}
            </p>
          </div>

          {/* Error Details for Development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 p-4 bg-gray-50 rounded-md">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 text-xs text-gray-600 font-mono">
                <p><strong>Type:</strong> {errorType}</p>
                <p><strong>Message:</strong> {error.message}</p>
                <p><strong>Admin ID:</strong> {adminId}</p>
                {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {/* Primary Action Button */}
            {(errorType === 'NETWORK_ERROR' || errorType === 'VALIDATION_ERROR' || errorType === 'UNKNOWN_ERROR') && (
              <button
                onClick={handleRetry}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-describedby="retry-description"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Try Again
              </button>
            )}

            {/* Authentication Action */}
            {errorType === 'AUTHENTICATION_REQUIRED' && (
              <button
                onClick={handleRetry}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <User className="h-4 w-4 mr-2" aria-hidden="true" />
                Log In Again
              </button>
            )}

            {/* Secondary Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleBackToList}
                className="flex-1 flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-describedby="back-description"
              >
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Back to Admins
              </button>
              
              <button
                onClick={handleGoHome}
                className="flex-1 flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-describedby="home-description"
              >
                <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                Dashboard
              </button>
            </div>
          </div>

          {/* Hidden descriptions for screen readers */}
          <div className="sr-only">
            <p id="retry-description">
              Attempt to reload the administrator editor
            </p>
            <p id="back-description">
              Return to the administrator list page
            </p>
            <p id="home-description">
              Navigate to the main dashboard
            </p>
          </div>

          {/* Contact Information for Permission Errors */}
          {errorType === 'PERMISSION_DENIED' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <div className="text-sm text-blue-700">
                <p className="font-medium">Need access?</p>
                <p className="mt-1">
                  Contact your system administrator to request permission to edit administrators.
                </p>
              </div>
            </div>
          )}

          {/* Help Text for 404 Errors */}
          {errorType === 'ADMIN_NOT_FOUND' && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-md">
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Looking for a different administrator?</p>
                <p className="mt-1">
                  Check the administrator list to find the correct admin account.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            If this problem persists, please contact technical support.
          </p>
        </div>
      </div>
    </div>
  );
}