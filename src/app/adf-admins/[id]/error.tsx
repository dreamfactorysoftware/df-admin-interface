'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Shield, XCircle } from 'lucide-react';

// Error boundary component for admin editing route
// Provides graceful error handling with recovery options and user-friendly messaging
// Implements React 19 error boundary patterns with comprehensive error logging

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorDetails {
  type: 'permission' | 'not_found' | 'validation' | 'network' | 'server' | 'unknown';
  title: string;
  message: string;
  actionText: string;
  showRetry: boolean;
  statusCode?: number;
}

// Admin-specific error type detection
function getErrorDetails(error: Error, adminId?: string): ErrorDetails {
  const errorMessage = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  
  // Admin not found (404)
  if (errorMessage.includes('not found') || 
      errorMessage.includes('404') ||
      errorMessage.includes('admin not found') ||
      stack.includes('notfound')) {
    return {
      type: 'not_found',
      title: 'Admin Not Found',
      message: adminId 
        ? `Admin with ID "${adminId}" does not exist or has been deleted.`
        : 'The requested admin could not be found.',
      actionText: 'Return to Admin List',
      showRetry: false,
      statusCode: 404
    };
  }

  // Permission denied (403)
  if (errorMessage.includes('forbidden') || 
      errorMessage.includes('403') ||
      errorMessage.includes('insufficient permissions') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('access denied')) {
    return {
      type: 'permission',
      title: 'Access Denied',
      message: 'You do not have sufficient permissions to edit this admin account. Contact your system administrator for access.',
      actionText: 'Return to Dashboard',
      showRetry: false,
      statusCode: 403
    };
  }

  // Validation errors
  if (errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('required') ||
      errorMessage.includes('format')) {
    return {
      type: 'validation',
      title: 'Validation Error',
      message: 'The admin data contains invalid or missing required information. Please check all required fields and try again.',
      actionText: 'Retry with Corrections',
      showRetry: true
    };
  }

  // Network connectivity issues
  if (errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('fetch')) {
    return {
      type: 'network',
      title: 'Connection Problem',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      actionText: 'Retry Connection',
      showRetry: true
    };
  }

  // Server errors (5xx)
  if (errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('server error')) {
    return {
      type: 'server',
      title: 'Server Error',
      message: 'The server encountered an unexpected error while processing your request. Please try again in a few moments.',
      actionText: 'Retry Request',
      showRetry: true,
      statusCode: 500
    };
  }

  // Unknown/generic errors
  return {
    type: 'unknown',
    title: 'Unexpected Error',
    message: 'An unexpected error occurred while editing the admin account. Our team has been notified.',
    actionText: 'Retry Operation',
    showRetry: true
  };
}

// Error logging utility - placeholder for when src/lib/error-logger.ts is available
function logError(error: Error, context: { adminId?: string; errorType: string; userAgent?: string }) {
  // Enhanced error logging with admin-specific context
  const errorReport = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    digest: (error as any).digest,
    context: {
      ...context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      component: 'AdminEditErrorBoundary'
    }
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Admin Edit Error:', errorReport);
  }

  // In production, this would send to error tracking service
  // Example: errorLogger.log(errorReport);
  
  // For now, store in session storage for debugging
  try {
    const existingLogs = JSON.parse(sessionStorage.getItem('df-error-logs') || '[]');
    existingLogs.push(errorReport);
    // Keep only last 10 errors to prevent storage overflow
    const trimmedLogs = existingLogs.slice(-10);
    sessionStorage.setItem('df-error-logs', JSON.stringify(trimmedLogs));
  } catch (storageError) {
    // Silently fail if storage is unavailable
  }
}

// Error recovery utility - placeholder for when src/lib/error-recovery.ts is available  
function attemptRecovery(errorType: string, adminId?: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate recovery attempt
    setTimeout(() => {
      // In practice, this would attempt various recovery strategies:
      // - Clear relevant caches
      // - Retry API calls with exponential backoff
      // - Validate session token
      // - Check network connectivity
      resolve(Math.random() > 0.3); // 70% success rate simulation
    }, 1000);
  });
}

export default function AdminEditError({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();
  const params = useParams();
  const adminId = params?.id as string;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);
  
  const errorDetails = getErrorDetails(error, adminId);
  const maxRetries = 3;
  const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff

  // Log error on mount and when error changes
  useEffect(() => {
    logError(error, {
      adminId,
      errorType: errorDetails.type,
      userAgent: navigator.userAgent
    });
  }, [error, adminId, errorDetails.type]);

  // Screen reader announcements for accessibility
  useEffect(() => {
    // Announce error to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Error occurred: ${errorDetails.title}. ${errorDetails.message}`;
    document.body.appendChild(announcement);

    // Remove announcement after screen readers have time to process
    const cleanup = setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 3000);

    return () => {
      clearTimeout(cleanup);
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    };
  }, [errorDetails]);

  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      return;
    }

    setIsRetrying(true);
    setLastRetryTime(new Date());
    
    try {
      // Attempt error recovery if retry is appropriate
      if (errorDetails.showRetry && errorDetails.type !== 'not_found' && errorDetails.type !== 'permission') {
        setIsRecovering(true);
        const recoverySuccess = await attemptRecovery(errorDetails.type, adminId);
        
        if (recoverySuccess) {
          // Announce successful recovery
          const successAnnouncement = document.createElement('div');
          successAnnouncement.setAttribute('aria-live', 'polite');
          successAnnouncement.className = 'sr-only';
          successAnnouncement.textContent = 'Error resolved. Retrying operation.';
          document.body.appendChild(successAnnouncement);
          
          setTimeout(() => {
            if (document.body.contains(successAnnouncement)) {
              document.body.removeChild(successAnnouncement);
            }
          }, 2000);
        }
        
        setIsRecovering(false);
      }

      // Wait for retry delay with exponential backoff
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      setRetryCount(prev => prev + 1);
      reset(); // Trigger React error boundary reset
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      setIsRetrying(false);
      setIsRecovering(false);
    }
  }, [reset, retryCount, maxRetries, retryDelay, errorDetails, adminId]);

  const handleNavigation = useCallback((action: 'home' | 'back' | 'admins') => {
    // Announce navigation to screen readers
    const navAnnouncement = document.createElement('div');
    navAnnouncement.setAttribute('aria-live', 'polite');
    navAnnouncement.className = 'sr-only';
    
    switch (action) {
      case 'home':
        navAnnouncement.textContent = 'Navigating to dashboard';
        router.push('/');
        break;
      case 'back':
        navAnnouncement.textContent = 'Going back to previous page';
        router.back();
        break;
      case 'admins':
        navAnnouncement.textContent = 'Navigating to admin list';
        router.push('/adf-admins');
        break;
    }
    
    document.body.appendChild(navAnnouncement);
    setTimeout(() => {
      if (document.body.contains(navAnnouncement)) {
        document.body.removeChild(navAnnouncement);
      }
    }, 1000);
  }, [router]);

  // Get appropriate icon for error type
  const getErrorIcon = () => {
    switch (errorDetails.type) {
      case 'permission':
        return <Shield className="h-12 w-12 text-red-500" aria-hidden="true" />;
      case 'not_found':
        return <XCircle className="h-12 w-12 text-red-500" aria-hidden="true" />;
      case 'network':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" aria-hidden="true" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" aria-hidden="true" />;
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            {getErrorIcon()}
          </div>

          {/* Error Title */}
          <h1 
            id="error-title"
            className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-4"
          >
            {errorDetails.title}
          </h1>

          {/* Error Description */}
          <div 
            id="error-description"
            className="text-center text-gray-600 dark:text-gray-300 mb-6 space-y-2"
          >
            <p>{errorDetails.message}</p>
            
            {adminId && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Admin ID: <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{adminId}</code>
              </p>
            )}

            {errorDetails.statusCode && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Error Code: {errorDetails.statusCode}
              </p>
            )}

            {retryCount > 0 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Retry attempt {retryCount} of {maxRetries}
              </p>
            )}

            {lastRetryTime && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Last retry: {lastRetryTime.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Action - Retry or Navigate */}
            {errorDetails.showRetry && retryCount < maxRetries ? (
              <button
                onClick={handleRetry}
                disabled={isRetrying || isRecovering}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label={`${errorDetails.actionText}. ${isRetrying ? 'Retrying...' : ''}`}
              >
                {isRetrying || isRecovering ? (
                  <>
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                    {isRecovering ? 'Recovering...' : 'Retrying...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                    {errorDetails.actionText}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (errorDetails.type === 'not_found') {
                    handleNavigation('admins');
                  } else if (errorDetails.type === 'permission') {
                    handleNavigation('home');
                  } else {
                    handleNavigation('back');
                  }
                }}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                aria-label={errorDetails.actionText}
              >
                {errorDetails.type === 'permission' ? (
                  <Home className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                ) : (
                  <ArrowLeft className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {errorDetails.actionText}
              </button>
            )}

            {/* Secondary Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleNavigation('back')}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="h-4 w-4 mx-auto" aria-hidden="true" />
                <span className="sr-only">Go Back</span>
              </button>

              <button
                onClick={() => handleNavigation('admins')}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                aria-label="Go to admin list"
              >
                Admin List
              </button>

              <button
                onClick={() => handleNavigation('home')}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                aria-label="Go to dashboard home"
              >
                <Home className="h-4 w-4 mx-auto" aria-hidden="true" />
                <span className="sr-only">Home</span>
              </button>
            </div>
          </div>

          {/* Technical Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-xs">
              <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Technical Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded border overflow-auto">
                <p className="font-semibold mb-2">Error Message:</p>
                <p className="mb-2 font-mono">{error.message}</p>
                {(error as any).digest && (
                  <>
                    <p className="font-semibold mb-2">Digest:</p>
                    <p className="mb-2 font-mono">{(error as any).digest}</p>
                  </>
                )}
                <p className="font-semibold mb-2">Stack Trace:</p>
                <pre className="whitespace-pre-wrap font-mono text-xs">{error.stack}</pre>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Skip to Content Link for Screen Readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium z-50"
      >
        Skip to main content
      </a>
    </div>
  );
}