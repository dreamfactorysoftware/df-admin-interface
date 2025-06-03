'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Database, 
  Settings, 
  Bug,
  ExternalLink 
} from 'lucide-react';

/**
 * Next.js Error Boundary Component for Field Editing Functionality
 * 
 * Provides graceful error handling and recovery options for database field 
 * management workflows. Implements comprehensive error logging, user-friendly 
 * messages, and field-specific recovery guidance following React 19 error 
 * boundary patterns.
 * 
 * Features:
 * - Field-specific error categorization and messaging
 * - Multiple recovery options with contextual guidance
 * - Comprehensive error logging for debugging and monitoring
 * - Tailwind CSS styling with consistent visual feedback
 * - Accessibility-compliant error announcements
 */

interface FieldErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Categorizes error types for field-specific handling
 */
function getErrorCategory(error: Error): {
  category: 'network' | 'validation' | 'permission' | 'data' | 'system';
  title: string;
  description: string;
  icon: typeof AlertTriangle;
  recoveryActions: string[];
} {
  const message = error.message.toLowerCase();
  
  // Network and connectivity errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      category: 'network',
      title: 'Connection Error',
      description: 'Unable to connect to the database service. This may be due to network connectivity issues or the service being temporarily unavailable.',
      icon: Database,
      recoveryActions: [
        'Check your internet connection',
        'Verify the database service is running',
        'Try refreshing the page',
        'Contact your system administrator if the issue persists'
      ]
    };
  }
  
  // Validation and data format errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('format')) {
    return {
      category: 'validation',
      title: 'Field Validation Error',
      description: 'The field configuration contains invalid data or conflicts with database constraints. Please review the field settings and try again.',
      icon: Settings,
      recoveryActions: [
        'Review field type and constraints',
        'Check for conflicting field names',
        'Verify data type compatibility',
        'Ensure required fields are completed'
      ]
    };
  }
  
  // Permission and authorization errors
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
    return {
      category: 'permission',
      title: 'Access Denied',
      description: 'You do not have sufficient permissions to modify this field. Please contact your administrator to request the necessary access rights.',
      icon: AlertTriangle,
      recoveryActions: [
        'Contact your system administrator',
        'Request field editing permissions',
        'Check your role assignments',
        'Verify database service access rights'
      ]
    };
  }
  
  // Data consistency and integrity errors
  if (message.includes('constraint') || message.includes('integrity') || message.includes('reference')) {
    return {
      category: 'data',
      title: 'Data Integrity Error',
      description: 'The field modification conflicts with existing data or database constraints. This may affect related tables or existing records.',
      icon: Database,
      recoveryActions: [
        'Review existing data dependencies',
        'Check foreign key relationships',
        'Backup data before making changes',
        'Consider alternative field configurations'
      ]
    };
  }
  
  // Default system error
  return {
    category: 'system',
    title: 'System Error',
    description: 'An unexpected error occurred while processing the field configuration. This may be a temporary issue with the system.',
    icon: Bug,
    recoveryActions: [
      'Try refreshing the page',
      'Save your work and try again',
      'Check the browser console for details',
      'Report this issue to support if it continues'
    ]
  };
}

/**
 * Main error boundary component for field editing pages
 */
export default function FieldError({ error, reset }: FieldErrorProps) {
  const router = useRouter();
  const errorInfo = getErrorCategory(error);

  // Comprehensive error logging for debugging and monitoring
  useEffect(() => {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      component: 'FieldError',
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        category: errorInfo.category
      },
      context: {
        fieldId: window.location.pathname.split('/').pop(),
        referrer: document.referrer
      }
    };

    // Log to console for development
    console.error('Field Editor Error:', errorDetails);
    
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Replace with your monitoring service (e.g., Sentry, LogRocket, etc.)
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorDetails)
        }).catch(() => {
          // Fail silently if error reporting fails
        });
      } catch {
        // Fail silently if error reporting fails
      }
    }
  }, [error, errorInfo.category]);

  /**
   * Handle navigation back to field listing
   */
  const handleBackToFields = () => {
    const pathSegments = window.location.pathname.split('/');
    const fieldsPath = pathSegments.slice(0, -1).join('/');
    router.push(fieldsPath);
  };

  /**
   * Handle navigation to parent table/schema
   */
  const handleBackToTable = () => {
    const pathSegments = window.location.pathname.split('/');
    const tablePath = pathSegments.slice(0, -2).join('/');
    router.push(tablePath);
  };

  /**
   * Handle retry with page reload
   */
  const handleRetryWithReload = () => {
    window.location.reload();
  };

  const IconComponent = errorInfo.icon;

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gray-50 dark:bg-gray-900"
      data-testid="field-error-boundary"
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon and Status */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
          <IconComponent className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {errorInfo.title}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
          {errorInfo.description}
        </p>
        
        {/* Error Details for Development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 w-full max-w-2xl">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 mb-2">
              <Bug className="inline h-4 w-4 mr-1" />
              Developer Details
            </summary>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-mono text-red-800 dark:text-red-300 mb-2">
                <strong>Error:</strong> {error.name}
              </p>
              <p className="text-sm font-mono text-red-800 dark:text-red-300 mb-2">
                <strong>Message:</strong> {error.message}
              </p>
              {error.digest && (
                <p className="text-sm font-mono text-red-800 dark:text-red-300 mb-2">
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-sm text-red-600 dark:text-red-400 cursor-pointer">
                    Stack Trace
                  </summary>
                  <pre className="text-xs font-mono text-red-700 dark:text-red-300 mt-2 overflow-auto max-h-40 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </details>
        )}
      </div>

      {/* Recovery Actions */}
      <div className="w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recommended Actions
        </h2>
        
        <ul className="space-y-2 mb-8">
          {errorInfo.recoveryActions.map((action, index) => (
            <li key={index} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-block w-4 h-4 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold text-center leading-4 mr-3 mt-0.5 flex-shrink-0">
                {index + 1}
              </span>
              {action}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        {/* Primary Retry Action */}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          data-testid="retry-button"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </button>

        {/* Secondary Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleBackToFields}
            className="inline-flex items-center justify-center flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            data-testid="back-to-fields-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fields
          </button>

          <button
            onClick={handleBackToTable}
            className="inline-flex items-center justify-center flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            data-testid="back-to-table-button"
          >
            <Database className="h-4 w-4 mr-2" />
            Back to Table
          </button>
        </div>
      </div>

      {/* Additional Support Link */}
      <div className="mt-8 text-center">
        <a
          href="/help/troubleshooting"
          className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
          data-testid="support-link"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View Troubleshooting Guide
        </a>
      </div>

      {/* Reload Option for Persistent Issues */}
      {errorInfo.category === 'system' && (
        <div className="mt-4">
          <button
            onClick={handleRetryWithReload}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors duration-200"
            data-testid="reload-button"
          >
            Reload Page
          </button>
        </div>
      )}
    </div>
  );
}