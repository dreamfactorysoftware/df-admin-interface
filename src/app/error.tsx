'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

/**
 * Route-level error boundary component for Next.js app router that handles and displays
 * error states with user-friendly messaging and recovery options. Implements comprehensive
 * error handling with logging, user feedback, and graceful degradation patterns using
 * React 19 error boundary capabilities.
 * 
 * This component transforms Angular global error handling to Next.js error boundary pattern
 * per Section 4.7.1.2 interceptor to middleware migration, converting Angular error
 * interceptor logic to React error boundary with server-side rendering support.
 */

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorInfo {
  errorBoundary?: boolean;
  componentStack?: string;
  errorInfo?: any;
}

/**
 * Error classification for appropriate user messaging and recovery actions
 */
enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

/**
 * Error logging service interface - will be implemented in src/lib/error-logger.ts
 */
interface ErrorLogger {
  logError: (error: Error, context?: Record<string, any>) => void;
  logUserAction: (action: string, context?: Record<string, any>) => void;
}

/**
 * Basic error logger implementation for when the external service isn't available
 */
const basicErrorLogger: ErrorLogger = {
  logError: (error: Error, context?: Record<string, any>) => {
    // In development, log to console with enhanced detail
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary Caught Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      });
    }
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      try {
        // This would integrate with external error reporting service
        // like Sentry, LogRocket, or custom error tracking endpoint
        const errorData = {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          context,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        };
        
        // Send to error tracking service
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        }).catch(() => {
          // Silently fail if error reporting fails
        });
      } catch (reportingError) {
        // Prevent error reporting from causing additional errors
      }
    }
  },
  
  logUserAction: (action: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('User Action:', { action, context, timestamp: new Date().toISOString() });
    }
  }
};

/**
 * Classify error type based on error properties for appropriate handling
 */
function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();
  
  // Network-related errors
  if (name.includes('network') || 
      message.includes('network') || 
      message.includes('fetch') ||
      message.includes('connection')) {
    return ErrorType.NETWORK;
  }
  
  // Authentication errors
  if (message.includes('unauthorized') || 
      message.includes('authentication') ||
      message.includes('login') ||
      name.includes('auth')) {
    return ErrorType.AUTHENTICATION;
  }
  
  // Authorization errors
  if (message.includes('forbidden') || 
      message.includes('access denied') ||
      message.includes('permission')) {
    return ErrorType.AUTHORIZATION;
  }
  
  // Validation errors
  if (message.includes('validation') || 
      message.includes('invalid') ||
      name.includes('validation')) {
    return ErrorType.VALIDATION;
  }
  
  // Server errors
  if (message.includes('server') || 
      message.includes('500') ||
      message.includes('internal')) {
    return ErrorType.SERVER;
  }
  
  // Client-side errors
  if (name.includes('type') || 
      name.includes('reference') ||
      name.includes('syntax')) {
    return ErrorType.CLIENT;
  }
  
  return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message based on error type
 */
function getErrorMessage(errorType: ErrorType, originalError: Error): { title: string; description: string } {
  switch (errorType) {
    case ErrorType.NETWORK:
      return {
        title: 'Connection Problem',
        description: 'Unable to connect to the server. Please check your internet connection and try again.'
      };
    
    case ErrorType.AUTHENTICATION:
      return {
        title: 'Authentication Required',
        description: 'Your session has expired or you need to log in to access this feature.'
      };
    
    case ErrorType.AUTHORIZATION:
      return {
        title: 'Access Denied',
        description: 'You don\'t have permission to access this resource. Please contact your administrator if you believe this is an error.'
      };
    
    case ErrorType.VALIDATION:
      return {
        title: 'Invalid Input',
        description: 'The information provided is invalid. Please review your input and try again.'
      };
    
    case ErrorType.SERVER:
      return {
        title: 'Server Error',
        description: 'Something went wrong on our end. Our team has been notified and is working to fix the issue.'
      };
    
    case ErrorType.CLIENT:
      return {
        title: 'Application Error',
        description: 'An unexpected error occurred in the application. Please refresh the page and try again.'
      };
    
    default:
      return {
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
      };
  }
}

/**
 * Route-level error boundary component implementing React 19 error boundary capabilities
 * with comprehensive error handling, logging, and user recovery options.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorReported, setErrorReported] = useState(false);
  const maxRetries = 3;
  
  const errorType = classifyError(error);
  const errorMessage = getErrorMessage(errorType, error);
  
  /**
   * Enhanced error logging with context information
   */
  useEffect(() => {
    if (!errorReported) {
      const errorContext = {
        errorType,
        retryCount,
        digest: (error as any).digest,
        route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      };
      
      basicErrorLogger.logError(error, errorContext);
      setErrorReported(true);
    }
  }, [error, errorType, retryCount, errorReported]);
  
  /**
   * Enhanced retry mechanism with exponential backoff and limit
   */
  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries || isRetrying) {
      return;
    }
    
    setIsRetrying(true);
    
    basicErrorLogger.logUserAction('error_retry_attempted', {
      retryCount: retryCount + 1,
      errorType,
      maxRetries,
    });
    
    try {
      // Implement exponential backoff for retries
      const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 5000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      setRetryCount(prev => prev + 1);
      reset();
    } catch (retryError) {
      basicErrorLogger.logError(retryError as Error, {
        context: 'retry_failed',
        retryCount: retryCount + 1,
      });
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, isRetrying, maxRetries, reset, errorType]);
  
  /**
   * Navigate to home page
   */
  const handleGoHome = useCallback(() => {
    basicErrorLogger.logUserAction('error_navigate_home', { errorType });
    window.location.href = '/';
  }, [errorType]);
  
  /**
   * Navigate back to previous page
   */
  const handleGoBack = useCallback(() => {
    basicErrorLogger.logUserAction('error_navigate_back', { errorType });
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }, [errorType]);
  
  /**
   * Report error to support (could open email client or support form)
   */
  const handleReportError = useCallback(() => {
    basicErrorLogger.logUserAction('error_report_requested', { errorType });
    
    const reportData = {
      error: error.message,
      type: errorType,
      time: new Date().toISOString(),
      page: typeof window !== 'undefined' ? window.location.href : 'unknown',
    };
    
    const mailtoLink = `mailto:support@dreamfactory.com?subject=Error Report&body=${encodeURIComponent(
      `Error Report:\n\nType: ${errorType}\nMessage: ${error.message}\nTime: ${reportData.time}\nPage: ${reportData.page}\n\nPlease describe what you were doing when this error occurred:`
    )}`;
    
    window.location.href = mailtoLink;
  }, [error, errorType]);
  
  const canRetry = retryCount < maxRetries && !isRetrying;
  const shouldShowRetry = errorType === ErrorType.NETWORK || 
                         errorType === ErrorType.SERVER || 
                         errorType === ErrorType.UNKNOWN;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Error Icon and Title */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {errorMessage.title}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {errorMessage.description}
          </p>
        </div>
        
        {/* Error Details for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Development Error Details:
            </h3>
            <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {(error as any).digest && (
              <p className="text-xs text-red-600 mt-2">
                Error ID: {(error as any).digest}
              </p>
            )}
          </div>
        )}
        
        {/* Retry Information */}
        {retryCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Retry attempt {retryCount} of {maxRetries}
            </p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Retry Button */}
          {shouldShowRetry && canRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </button>
          )}
          
          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowLeft className="-ml-1 mr-2 h-4 w-4" />
            Go Back
          </button>
          
          {/* Go Home Button */}
          <button
            onClick={handleGoHome}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Home className="-ml-1 mr-2 h-4 w-4" />
            Go to Dashboard
          </button>
        </div>
        
        {/* Additional Help Options */}
        <div className="border-t border-gray-200 pt-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">
              Need additional help?
            </p>
            <button
              onClick={handleReportError}
              className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
            >
              Report this error to support
            </button>
          </div>
        </div>
        
        {/* Accessibility and Status Information */}
        <div className="sr-only" role="status" aria-live="polite">
          {isRetrying && "Retrying the operation"}
          {retryCount >= maxRetries && shouldShowRetry && "Maximum retry attempts reached"}
        </div>
      </div>
    </div>
  );
}