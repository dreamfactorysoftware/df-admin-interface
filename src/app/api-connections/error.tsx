'use client';

import { useEffect, useState, useCallback } from 'react';
import { Database, AlertTriangle, RefreshCw, Home, ArrowLeft, Wifi, Server, Shield } from 'lucide-react';

/**
 * Error boundary component for the API connections route segment that handles and displays
 * error states for connection failures, network issues, and API service errors. Provides
 * user-friendly error messages with recovery actions and fallback UI when database services
 * or API documentation cannot be loaded.
 * 
 * This component implements Next.js error boundaries per app router error handling patterns
 * from Section 7.5.1, with comprehensive error handling and validation per Section 4.2,
 * while maintaining WCAG 2.1 AA accessibility compliance.
 */

interface APIConnectionsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * API connection specific error types for targeted error messaging and recovery
 */
enum APIConnectionErrorType {
  DATABASE_CONNECTION = 'database_connection',
  DATABASE_AUTHENTICATION = 'database_authentication',
  DATABASE_TIMEOUT = 'database_timeout',
  SCHEMA_DISCOVERY = 'schema_discovery',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  NETWORK_ERROR = 'network_error',
  CONFIGURATION_ERROR = 'configuration_error',
  PERMISSION_ERROR = 'permission_error',
  API_GENERATION = 'api_generation',
  UNKNOWN = 'unknown'
}

/**
 * Error logging service interface for API connection specific errors
 */
interface APIConnectionErrorLogger {
  logConnectionError: (error: Error, context?: Record<string, any>) => void;
  logRetryAttempt: (attempt: number, errorType: APIConnectionErrorType) => void;
  logRecoveryAction: (action: string, context?: Record<string, any>) => void;
}

/**
 * Basic error logger implementation for API connection errors
 */
const apiConnectionErrorLogger: APIConnectionErrorLogger = {
  logConnectionError: (error: Error, context?: Record<string, any>) => {
    const logData = {
      component: 'APIConnectionsError',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('API Connections Error:', logData);
    }

    if (process.env.NODE_ENV === 'production') {
      try {
        fetch('/api/errors/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData),
        }).catch(() => {
          // Silently fail if error reporting fails
        });
      } catch (reportingError) {
        // Prevent error reporting from causing additional errors
      }
    }
  },

  logRetryAttempt: (attempt: number, errorType: APIConnectionErrorType) => {
    const logData = {
      action: 'retry_attempt',
      attempt,
      errorType,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('API Connection Retry:', logData);
    }
  },

  logRecoveryAction: (action: string, context?: Record<string, any>) => {
    const logData = {
      action,
      context,
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('API Connection Recovery Action:', logData);
    }
  }
};

/**
 * Classify API connection error type based on error properties and context
 */
function classifyAPIConnectionError(error: Error): APIConnectionErrorType {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Database connection errors
  if (message.includes('connection refused') ||
      message.includes('connection timeout') ||
      message.includes('connection failed') ||
      message.includes('database connection') ||
      name.includes('connection')) {
    return APIConnectionErrorType.DATABASE_CONNECTION;
  }

  // Database authentication errors
  if (message.includes('access denied') ||
      message.includes('authentication failed') ||
      message.includes('invalid credentials') ||
      message.includes('login failed') ||
      message.includes('unauthorized')) {
    return APIConnectionErrorType.DATABASE_AUTHENTICATION;
  }

  // Database timeout errors
  if (message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('connection timeout')) {
    return APIConnectionErrorType.DATABASE_TIMEOUT;
  }

  // Schema discovery errors
  if (message.includes('schema') ||
      message.includes('table discovery') ||
      message.includes('metadata') ||
      message.includes('describe tables')) {
    return APIConnectionErrorType.SCHEMA_DISCOVERY;
  }

  // Service unavailable errors
  if (message.includes('service unavailable') ||
      message.includes('503') ||
      message.includes('service down') ||
      message.includes('maintenance')) {
    return APIConnectionErrorType.SERVICE_UNAVAILABLE;
  }

  // Network errors
  if (message.includes('network') ||
      message.includes('fetch') ||
      message.includes('cors') ||
      name.includes('network')) {
    return APIConnectionErrorType.NETWORK_ERROR;
  }

  // Configuration errors
  if (message.includes('configuration') ||
      message.includes('config') ||
      message.includes('invalid settings') ||
      message.includes('missing parameter')) {
    return APIConnectionErrorType.CONFIGURATION_ERROR;
  }

  // Permission errors
  if (message.includes('forbidden') ||
      message.includes('permission denied') ||
      message.includes('403') ||
      message.includes('not authorized')) {
    return APIConnectionErrorType.PERMISSION_ERROR;
  }

  // API generation errors
  if (message.includes('api generation') ||
      message.includes('endpoint creation') ||
      message.includes('openapi') ||
      message.includes('swagger')) {
    return APIConnectionErrorType.API_GENERATION;
  }

  return APIConnectionErrorType.UNKNOWN;
}

/**
 * Get appropriate icon for API connection error type
 */
function getErrorIcon(errorType: APIConnectionErrorType) {
  switch (errorType) {
    case APIConnectionErrorType.DATABASE_CONNECTION:
    case APIConnectionErrorType.DATABASE_AUTHENTICATION:
    case APIConnectionErrorType.DATABASE_TIMEOUT:
    case APIConnectionErrorType.SCHEMA_DISCOVERY:
      return Database;
    case APIConnectionErrorType.SERVICE_UNAVAILABLE:
      return Server;
    case APIConnectionErrorType.NETWORK_ERROR:
      return Wifi;
    case APIConnectionErrorType.PERMISSION_ERROR:
      return Shield;
    case APIConnectionErrorType.API_GENERATION:
      return Database;
    default:
      return AlertTriangle;
  }
}

/**
 * Get user-friendly error message for API connection errors
 */
function getAPIConnectionErrorMessage(errorType: APIConnectionErrorType, originalError: Error): { title: string; description: string; suggestions: string[] } {
  switch (errorType) {
    case APIConnectionErrorType.DATABASE_CONNECTION:
      return {
        title: 'Database Connection Failed',
        description: 'Unable to establish a connection to your database. This could be due to network issues, incorrect connection settings, or the database server being unavailable.',
        suggestions: [
          'Verify your database server is running and accessible',
          'Check your connection settings (host, port, database name)',
          'Ensure your network allows connections to the database',
          'Verify firewall settings are not blocking the connection'
        ]
      };

    case APIConnectionErrorType.DATABASE_AUTHENTICATION:
      return {
        title: 'Database Authentication Failed',
        description: 'The database rejected the login credentials. Please verify your username and password are correct.',
        suggestions: [
          'Double-check your username and password',
          'Verify the database user has the necessary permissions',
          'Check if the database user account is locked or expired',
          'Ensure the user has access to the specified database'
        ]
      };

    case APIConnectionErrorType.DATABASE_TIMEOUT:
      return {
        title: 'Database Connection Timeout',
        description: 'The connection to your database timed out. This usually indicates network latency or database performance issues.',
        suggestions: [
          'Check your network connection speed and stability',
          'Verify the database server is not overloaded',
          'Consider increasing the connection timeout setting',
          'Check for any network proxies or firewalls causing delays'
        ]
      };

    case APIConnectionErrorType.SCHEMA_DISCOVERY:
      return {
        title: 'Schema Discovery Failed',
        description: 'Unable to retrieve the database schema structure. This could be due to permission issues or database-specific limitations.',
        suggestions: [
          'Verify the database user has schema read permissions',
          'Check if the database contains accessible tables or views',
          'Ensure the database supports metadata queries',
          'Try connecting with a database administrator account'
        ]
      };

    case APIConnectionErrorType.SERVICE_UNAVAILABLE:
      return {
        title: 'API Service Unavailable',
        description: 'The DreamFactory API service is currently unavailable or undergoing maintenance.',
        suggestions: [
          'Wait a few minutes and try again',
          'Check the DreamFactory service status',
          'Verify the DreamFactory server is running',
          'Contact your system administrator if the issue persists'
        ]
      };

    case APIConnectionErrorType.NETWORK_ERROR:
      return {
        title: 'Network Connection Error',
        description: 'Unable to reach the API service due to network connectivity issues.',
        suggestions: [
          'Check your internet connection',
          'Verify the API service URL is correct',
          'Check for firewall or proxy issues',
          'Try refreshing the page'
        ]
      };

    case APIConnectionErrorType.CONFIGURATION_ERROR:
      return {
        title: 'Configuration Error',
        description: 'There\'s an issue with the connection configuration settings.',
        suggestions: [
          'Review all connection parameters for accuracy',
          'Check required fields are properly filled',
          'Verify the database type matches your actual database',
          'Ensure all settings follow the expected format'
        ]
      };

    case APIConnectionErrorType.PERMISSION_ERROR:
      return {
        title: 'Permission Denied',
        description: 'You don\'t have the necessary permissions to perform this action.',
        suggestions: [
          'Contact your administrator for access',
          'Verify your user account has the required permissions',
          'Check if your session has expired',
          'Ensure you\'re accessing the correct resource'
        ]
      };

    case APIConnectionErrorType.API_GENERATION:
      return {
        title: 'API Generation Failed',
        description: 'Failed to generate API endpoints from your database schema.',
        suggestions: [
          'Verify the database schema is valid and accessible',
          'Check that tables have proper primary keys',
          'Ensure the database user has necessary permissions',
          'Try generating APIs for specific tables instead of all at once'
        ]
      };

    default:
      return {
        title: 'API Connection Error',
        description: 'An unexpected error occurred while managing your API connections.',
        suggestions: [
          'Try refreshing the page',
          'Check your network connection',
          'Verify your session hasn\'t expired',
          'Contact support if the problem persists'
        ]
      };
  }
}

/**
 * API connections error boundary component implementing React error boundary
 * with retry functionality, replacing Angular global error handlers
 */
export default function APIConnectionsError({ error, reset }: APIConnectionsErrorProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [errorLogged, setErrorLogged] = useState(false);
  
  const maxRetries = 3;
  const errorType = classifyAPIConnectionError(error);
  const errorMessage = getAPIConnectionErrorMessage(errorType, error);
  const ErrorIcon = getErrorIcon(errorType);

  /**
   * Log error with API connection specific context
   */
  useEffect(() => {
    if (!errorLogged) {
      const errorContext = {
        errorType,
        retryCount,
        digest: (error as any).digest,
        route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
        timestamp: new Date().toISOString(),
      };

      apiConnectionErrorLogger.logConnectionError(error, errorContext);
      setErrorLogged(true);
    }
  }, [error, errorType, retryCount, errorLogged]);

  /**
   * Enhanced retry mechanism with exponential backoff for API connection errors
   */
  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries || isRetrying) {
      return;
    }

    setIsRetrying(true);
    
    apiConnectionErrorLogger.logRetryAttempt(retryCount + 1, errorType);

    try {
      // Implement exponential backoff for database connections
      const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 8000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));

      setRetryCount(prev => prev + 1);
      reset();
    } catch (retryError) {
      apiConnectionErrorLogger.logConnectionError(retryError as Error, {
        context: 'retry_failed',
        retryCount: retryCount + 1,
      });
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, isRetrying, maxRetries, reset, errorType]);

  /**
   * Navigate to API connections dashboard
   */
  const handleGoToConnections = useCallback(() => {
    apiConnectionErrorLogger.logRecoveryAction('navigate_to_connections', { errorType });
    window.location.href = '/api-connections';
  }, [errorType]);

  /**
   * Navigate back to previous page
   */
  const handleGoBack = useCallback(() => {
    apiConnectionErrorLogger.logRecoveryAction('navigate_back', { errorType });
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/api-connections';
    }
  }, [errorType]);

  /**
   * Navigate to dashboard home
   */
  const handleGoHome = useCallback(() => {
    apiConnectionErrorLogger.logRecoveryAction('navigate_home', { errorType });
    window.location.href = '/';
  }, [errorType]);

  /**
   * Toggle error details visibility
   */
  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
    apiConnectionErrorLogger.logRecoveryAction(showDetails ? 'hide_error_details' : 'show_error_details', { errorType });
  }, [showDetails, errorType]);

  const canRetry = retryCount < maxRetries && !isRetrying;
  const shouldShowRetry = [
    APIConnectionErrorType.DATABASE_CONNECTION,
    APIConnectionErrorType.DATABASE_TIMEOUT,
    APIConnectionErrorType.SERVICE_UNAVAILABLE,
    APIConnectionErrorType.NETWORK_ERROR,
    APIConnectionErrorType.SCHEMA_DISCOVERY,
    APIConnectionErrorType.UNKNOWN
  ].includes(errorType);

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="max-w-lg w-full space-y-8">
        {/* Error Icon and Title */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
            <ErrorIcon 
              className="h-8 w-8 text-red-600 dark:text-red-400" 
              aria-hidden="true" 
            />
          </div>
          <h1 
            id="error-title"
            className="mt-4 text-3xl font-bold text-gray-900 dark:text-white"
          >
            {errorMessage.title}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {errorMessage.description}
          </p>
        </div>

        {/* Error Suggestions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
            Troubleshooting Steps:
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            {errorMessage.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>

        {/* Retry Information */}
        {retryCount > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Retry attempt {retryCount} of {maxRetries}
            </p>
          </div>
        )}

        {/* Error Details Toggle */}
        <div className="text-center">
          <button
            onClick={toggleDetails}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
            aria-expanded={showDetails}
            aria-controls="error-details"
          >
            {showDetails ? 'Hide' : 'Show'} Error Details
          </button>
        </div>

        {/* Error Details */}
        {showDetails && (
          <div 
            id="error-details"
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
              Technical Details:
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
              <div>
                <strong>Error Type:</strong> {errorType}
              </div>
              <div>
                <strong>Message:</strong> {error.message}
              </div>
              {(error as any).digest && (
                <div>
                  <strong>Error ID:</strong> {(error as any).digest}
                </div>
              )}
              <div>
                <strong>Timestamp:</strong> {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Retry Button */}
          {shouldShowRetry && canRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 dark:bg-blue-700 dark:hover:bg-blue-600"
              aria-describedby={isRetrying ? "retry-status" : undefined}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                  Retrying Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                  Retry Connection
                </>
              )}
            </button>
          )}

          {/* Go to API Connections Button */}
          <button
            onClick={handleGoToConnections}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Database className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
            View All Connections
          </button>

          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowLeft className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
            Go Back
          </button>

          {/* Go Home Button */}
          <button
            onClick={handleGoHome}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Home className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
            Go to Dashboard
          </button>
        </div>

        {/* Accessibility Status */}
        <div className="sr-only" role="status" aria-live="polite" id="retry-status">
          {isRetrying && "Attempting to reconnect to the API service"}
          {retryCount >= maxRetries && shouldShowRetry && "Maximum retry attempts reached. Please try manual troubleshooting steps."}
        </div>

        {/* Screen Reader Summary */}
        <div className="sr-only">
          API connections error occurred. Error type: {errorType}. 
          {shouldShowRetry && canRetry ? "Retry option available." : "No retry available."}
          Multiple recovery options provided including navigation back to connections or dashboard.
        </div>
      </div>
    </div>
  );
}