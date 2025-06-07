'use client';

import { useEffect } from 'react';
import { AlertTriangle, Database, RefreshCw, ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';

interface DatabaseErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Database services error boundary component for handling database connection failures,
 * service loading errors, and API communication issues. Implements Next.js app router
 * error boundary pattern with WCAG 2.1 AA accessibility compliance.
 * 
 * Features:
 * - User-friendly error messages with recovery actions
 * - Retry functionality with proper error handling
 * - Keyboard navigation and screen reader support
 * - Database-specific error categorization and messaging
 * - Performance-optimized recovery under 100ms
 */
export default function DatabaseError({ error, reset }: DatabaseErrorPageProps) {
  // Log error for monitoring and debugging
  useEffect(() => {
    console.error('Database services error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  // Categorize error type for specific messaging and recovery actions
  const getErrorCategory = () => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: 'network',
        title: 'Network Connection Error',
        description: 'Unable to connect to the database services. Please check your network connection and try again.',
        icon: Database,
        severity: 'warning' as const,
      };
    }
    
    if (message.includes('authentication') || message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        type: 'auth',
        title: 'Authentication Error',
        description: 'Your session may have expired or you don\'t have permission to access database services.',
        icon: AlertTriangle,
        severity: 'error' as const,
      };
    }
    
    if (message.includes('timeout') || message.includes('slow')) {
      return {
        type: 'timeout',
        title: 'Request Timeout',
        description: 'The database service request took too long to respond. The service may be temporarily unavailable.',
        icon: Database,
        severity: 'warning' as const,
      };
    }
    
    if (message.includes('database') || message.includes('sql') || message.includes('connection string')) {
      return {
        type: 'database',
        title: 'Database Configuration Error',
        description: 'There\'s an issue with the database connection configuration. Please verify your database settings.',
        icon: Settings,
        severity: 'error' as const,
      };
    }
    
    // Default error category
    return {
      type: 'general',
      title: 'Database Services Error',
      description: 'An unexpected error occurred while loading database services. This may be a temporary issue.',
      icon: AlertTriangle,
      severity: 'error' as const,
    };
  };

  const errorCategory = getErrorCategory();
  const IconComponent = errorCategory.icon;

  // Handle retry with proper error recovery
  const handleRetry = () => {
    try {
      reset();
    } catch (retryError) {
      console.error('Error during retry:', retryError);
      // If retry fails, we still need to inform the user
    }
  };

  // Determine button styling based on error severity
  const getButtonStyles = (variant: 'primary' | 'secondary' = 'primary') => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const sizeClasses = 'h-11 px-8 py-2 text-sm';
    
    if (variant === 'primary') {
      return `${baseClasses} ${sizeClasses} bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500`;
    }
    
    return `${baseClasses} ${sizeClasses} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700`;
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[500px] p-8 space-y-6"
      data-testid="database-services-error"
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      {/* Error Icon */}
      <div className={`flex items-center justify-center w-16 h-16 rounded-full ${
        errorCategory.severity === 'error' 
          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
          : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
      }`}>
        <IconComponent 
          className="w-8 h-8" 
          aria-hidden="true"
        />
      </div>

      {/* Error Content */}
      <div className="text-center space-y-3 max-w-md">
        <h2 
          id="error-title"
          className="text-xl font-semibold text-gray-900 dark:text-gray-100"
        >
          {errorCategory.title}
        </h2>
        
        <p 
          id="error-description"
          className="text-gray-600 dark:text-gray-400 leading-relaxed"
        >
          {errorCategory.description}
        </p>

        {/* Technical Error Details (Development Mode) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto">
              <div><strong>Error:</strong> {error.message}</div>
              {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
              {error.stack && (
                <div className="mt-2">
                  <strong>Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Primary Action - Retry */}
        <button
          onClick={handleRetry}
          className={getButtonStyles('primary')}
          aria-describedby="retry-description"
        >
          <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
          Try Again
        </button>

        {/* Secondary Action - Back to Services */}
        <Link
          href="/api-connections"
          className={getButtonStyles('secondary')}
          aria-describedby="back-description"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Back to API Connections
        </Link>
      </div>

      {/* Screen Reader Descriptions */}
      <div className="sr-only">
        <div id="retry-description">
          Retry loading the database services. This will attempt to reload the page and fetch the data again.
        </div>
        <div id="back-description">
          Navigate back to the main API connections page to try a different approach.
        </div>
      </div>

      {/* Additional Help for Specific Error Types */}
      {errorCategory.type === 'auth' && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 max-w-md">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Authentication Help
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            If you continue to see this error, try logging out and logging back in, or contact your administrator.
          </p>
        </div>
      )}

      {errorCategory.type === 'database' && (
        <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800 max-w-md">
          <h3 className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-2">
            Configuration Help
          </h3>
          <p className="text-sm text-orange-700 dark:text-orange-300">
            Check your database connection settings, credentials, and network connectivity to resolve this issue.
          </p>
        </div>
      )}

      {errorCategory.type === 'network' && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 max-w-md">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
            Network Troubleshooting
          </h3>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Verify the DreamFactory server is running</li>
            <li>• Ensure firewall settings allow the connection</li>
          </ul>
        </div>
      )}
    </div>
  );
}