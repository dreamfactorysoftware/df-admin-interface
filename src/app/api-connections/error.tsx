'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Database, Wifi, RefreshCw, Home, ExternalLink } from 'lucide-react';

interface APIConnectionsErrorProps {
  error: Error & { digest?: string; code?: string; statusCode?: number };
  reset: () => void;
}

/**
 * Error boundary component for the API connections route segment.
 * Handles and displays error states for connection failures, network issues, 
 * and API service errors with WCAG 2.1 AA compliant accessibility features.
 * 
 * This component follows Next.js app router error boundary patterns and provides:
 * - Categorized error handling with specific messaging
 * - Accessibility support with ARIA live regions and proper focus management
 * - Recovery actions with retry functionality
 * - Fallback UI when database services or API documentation cannot be loaded
 * - Error logging integration for monitoring
 */
export default function APIConnectionsError({ error, reset }: APIConnectionsErrorProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Log error for monitoring and debugging
  useEffect(() => {
    // Log to console for development
    console.error('API Connections Error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
    });

    // In production, this would integrate with monitoring services
    // Example: reportError(error, { context: 'api-connections', digest: error.digest });
  }, [error]);

  /**
   * Categorizes errors based on type and provides appropriate messaging
   */
  const getErrorDetails = () => {
    const statusCode = error.statusCode;
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';

    // Network connectivity errors
    if (code === 'network_error' || message.includes('network') || message.includes('offline')) {
      return {
        type: 'network',
        icon: Wifi,
        title: 'Network Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        canRetry: true,
      };
    }

    // Database connection errors
    if (code === 'connection_failed' || message.includes('connection') || message.includes('database')) {
      return {
        type: 'connection',
        icon: Database,
        title: 'Database Connection Failed',
        description: 'Unable to establish connection to the database service. The service may be unavailable or misconfigured.',
        canRetry: true,
      };
    }

    // Authentication/Authorization errors
    if (statusCode === 401 || statusCode === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        type: 'auth',
        icon: AlertTriangle,
        title: 'Access Denied',
        description: 'You do not have permission to access API connections. Please contact your administrator.',
        canRetry: false,
      };
    }

    // Server errors
    if (statusCode && statusCode >= 500) {
      return {
        type: 'server',
        icon: AlertTriangle,
        title: 'Server Error',
        description: 'The server encountered an error while processing your request. Please try again in a few minutes.',
        canRetry: true,
      };
    }

    // Client errors
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return {
        type: 'client',
        icon: AlertTriangle,
        title: 'Request Error',
        description: 'There was a problem with your request. Please check your input and try again.',
        canRetry: false,
      };
    }

    // Generic application errors
    return {
      type: 'general',
      icon: AlertTriangle,
      title: 'Application Error',
      description: 'An unexpected error occurred while loading API connections. Please try refreshing the page.',
      canRetry: true,
    };
  };

  const errorDetails = getErrorDetails();
  const IconComponent = errorDetails.icon;

  /**
   * Handles retry functionality with exponential backoff
   */
  const handleRetry = async () => {
    if (!errorDetails.canRetry || isRetrying) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Implement exponential backoff for retries
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    
    try {
      // Add delay for exponential backoff
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      reset();
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Navigates back to the dashboard
   */
  const handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * Opens support documentation
   */
  const handleGetHelp = () => {
    window.open('https://wiki.dreamfactory.com/DreamFactory/Troubleshooting', '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[500px] p-8 max-w-2xl mx-auto"
      data-testid="api-connections-error"
      role="alert"
      aria-live="polite"
    >
      {/* Error Icon */}
      <div 
        className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-6"
        aria-hidden="true"
      >
        <IconComponent className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>

      {/* Error Title */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 text-center">
        {errorDetails.title}
      </h1>

      {/* Error Description */}
      <p className="text-gray-600 dark:text-gray-400 text-center mb-8 leading-relaxed">
        {errorDetails.description}
      </p>

      {/* Error Details (Development Mode) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-8 w-full max-w-md">
          <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            Error Details (Development Only)
          </summary>
          <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto">
            <div><strong>Message:</strong> {error.message}</div>
            {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
            {error.code && <div><strong>Code:</strong> {error.code}</div>}
            {error.statusCode && <div><strong>Status:</strong> {error.statusCode}</div>}
          </div>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {/* Primary Action - Retry */}
        {errorDetails.canRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying || retryCount >= 3}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            aria-describedby="retry-help"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying 
              ? 'Retrying...' 
              : retryCount >= 3 
                ? 'Max Retries Reached' 
                : `Retry${retryCount > 0 ? ` (${retryCount}/3)` : ''}`
            }
          </button>
        )}

        {/* Secondary Action - Go Home */}
        <button
          onClick={handleGoHome}
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <Home className="h-4 w-4 mr-2" />
          Go to Dashboard
        </button>
      </div>

      {/* Help Text and Link */}
      <div className="mt-8 text-center">
        <p 
          id="retry-help" 
          className="text-sm text-gray-500 dark:text-gray-400 mb-2"
        >
          If the problem persists, please check the system status or contact support.
        </p>
        
        <button
          onClick={handleGetHelp}
          className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:underline"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View Troubleshooting Guide
        </button>
      </div>

      {/* Screen Reader Status Updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isRetrying && 'Retrying connection...'}
        {retryCount >= 3 && 'Maximum retry attempts reached'}
      </div>
    </div>
  );
}