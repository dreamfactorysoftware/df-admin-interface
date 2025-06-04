'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Database, RefreshCw, ArrowLeft, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Error boundary component for the service details route segment that handles and displays 
 * error states for service configuration failures, connection errors, and form validation issues.
 * 
 * Provides user-friendly error messages with recovery actions and retry functionality when 
 * individual database services cannot be loaded or configured.
 * 
 * Features:
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Service-specific error recovery workflows under 100ms
 * - Tailwind CSS styling with consistent theme injection
 * - Multiple recovery actions for different error scenarios
 * - Keyboard navigation support
 * - Screen reader announcements
 */
export default function ServiceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error details for debugging while respecting privacy
    const errorInfo = {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      route: 'service-details',
    };
    
    console.error('Service configuration error:', errorInfo);
    
    // Announce error to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Service error occurred: ${getErrorMessage(error)}`;
    document.body.appendChild(announcement);
    
    // Cleanup announcement after screen readers have processed it
    const cleanup = setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
    
    return () => clearTimeout(cleanup);
  }, [error]);

  /**
   * Categorizes error and returns appropriate user-friendly message
   */
  const getErrorMessage = (error: Error): string => {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('connection') || message.includes('timeout')) {
      return 'Unable to establish connection to the database service. Please check your connection settings and network connectivity.';
    }
    
    if (message.includes('authentication') || message.includes('unauthorized')) {
      return 'Authentication failed for the database service. Please verify your credentials and permissions.';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Service configuration contains invalid settings. Please review your configuration and try again.';
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested database service could not be found. It may have been deleted or moved.';
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      return 'You do not have permission to access this database service. Please contact your administrator.';
    }
    
    // Default message for unclassified errors
    return 'An unexpected error occurred while loading the database service configuration.';
  };

  /**
   * Determines the primary action based on error type
   */
  const getPrimaryAction = (error: Error) => {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('not found') || message.includes('404')) {
      return {
        label: 'Return to Services',
        action: () => router.push('/api-connections/database'),
        icon: ArrowLeft,
      };
    }
    
    return {
      label: 'Try Again',
      action: reset,
      icon: RefreshCw,
    };
  };

  /**
   * Handles keyboard navigation for action buttons
   */
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  const errorMessage = getErrorMessage(error);
  const primaryAction = getPrimaryAction(error);
  const showConnectionTest = error.message?.toLowerCase().includes('connection');

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white dark:bg-gray-900"
      data-testid="service-error"
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon and Visual Indicator */}
      <div className="flex items-center justify-center w-16 h-16 mb-6 bg-red-100 dark:bg-red-900/20 rounded-full">
        <Database 
          className="w-8 h-8 text-red-600 dark:text-red-400" 
          aria-hidden="true"
        />
      </div>

      {/* Error Title */}
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
        Service Configuration Error
      </h1>

      {/* Error Message */}
      <div className="max-w-md text-center mb-8">
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {errorMessage}
        </p>
        
        {/* Technical Details (collapsed by default) */}
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
            Technical Details
          </summary>
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border text-sm font-mono text-gray-700 dark:text-gray-300 break-words">
            <div><strong>Error:</strong> {error.message}</div>
            {error.digest && (
              <div className="mt-1">
                <strong>ID:</strong> {error.digest}
              </div>
            )}
          </div>
        </details>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        {/* Primary Action */}
        <button
          onClick={primaryAction.action}
          onKeyDown={(e) => handleKeyDown(e, primaryAction.action)}
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby="primary-action-description"
        >
          <primaryAction.icon className="w-4 h-4 mr-2" aria-hidden="true" />
          {primaryAction.label}
        </button>
        <div id="primary-action-description" className="sr-only">
          Primary recovery action for service error
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-2">
          {/* Return to Services List */}
          {!error.message?.toLowerCase().includes('not found') && (
            <button
              onClick={() => router.push('/api-connections/database')}
              onKeyDown={(e) => handleKeyDown(e, () => router.push('/api-connections/database'))}
              className="inline-flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 focus:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              aria-label="Return to database services list"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Return to Services</span>
            </button>
          )}

          {/* Connection Test Action */}
          {showConnectionTest && (
            <button
              onClick={() => {
                // For connection errors, try to navigate to connection test
                const currentPath = window.location.pathname;
                const testPath = currentPath.includes('/schema') 
                  ? currentPath.replace('/schema', '') 
                  : currentPath;
                router.push(testPath);
              }}
              onKeyDown={(e) => handleKeyDown(e, () => {
                const currentPath = window.location.pathname;
                const testPath = currentPath.includes('/schema') 
                  ? currentPath.replace('/schema', '') 
                  : currentPath;
                router.push(testPath);
              })}
              className="inline-flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 focus:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              aria-label="Test database connection"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Test Connection</span>
            </button>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-500">
          If this problem persists, please contact your administrator or check the{' '}
          <a 
            href="/help/troubleshooting" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="View troubleshooting documentation"
          >
            troubleshooting guide
          </a>
          .
        </p>
      </div>

      {/* Error Boundary Info for Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg max-w-2xl">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Development Information
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-2">
                This error boundary caught an error in the service details route segment.
              </p>
              <div className="font-mono text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded border break-all">
                {error.stack}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}