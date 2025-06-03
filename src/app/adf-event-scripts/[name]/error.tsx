'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, AlertTriangle, Home, FileText, Shield, Database, ChevronRight } from 'lucide-react';

// Types for error scenarios specific to script editing
interface ScriptEditError {
  type: 'script_load' | 'validation' | 'update_conflict' | 'storage_service' | 'api_communication' | 'authentication' | 'permission' | 'network' | 'unknown';
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: number;
  scriptName?: string;
  retryable: boolean;
}

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Error classification utility
function classifyError(error: Error): ScriptEditError {
  const errorMessage = error.message.toLowerCase();
  const timestamp = Date.now();
  
  // Extract script name from URL if available
  let scriptName: string | undefined;
  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/');
    const nameIndex = pathParts.indexOf('adf-event-scripts') + 1;
    scriptName = pathParts[nameIndex] ? decodeURIComponent(pathParts[nameIndex]) : undefined;
  }

  // Script loading failures
  if (errorMessage.includes('script not found') || errorMessage.includes('404') || error.name === 'NotFoundError') {
    return {
      type: 'script_load',
      message: `The event script "${scriptName}" could not be found. It may have been deleted or renamed.`,
      retryable: false,
      timestamp,
      scriptName,
    };
  }

  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || error.name === 'ValidationError') {
    return {
      type: 'validation',
      message: 'The script contains validation errors. Please check your script content and try again.',
      retryable: true,
      timestamp,
      scriptName,
    };
  }

  // Update conflicts
  if (errorMessage.includes('conflict') || errorMessage.includes('version') || error.name === 'ConflictError') {
    return {
      type: 'update_conflict',
      message: 'The script has been modified by another user. Please refresh and try your changes again.',
      retryable: true,
      timestamp,
      scriptName,
    };
  }

  // Storage service communication
  if (errorMessage.includes('storage') || errorMessage.includes('service') || error.name === 'ServiceError') {
    return {
      type: 'storage_service',
      message: 'Unable to communicate with the storage service. Please check your service configuration.',
      retryable: true,
      timestamp,
      scriptName,
    };
  }

  // Authentication errors
  if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') || error.name === 'AuthenticationError') {
    return {
      type: 'authentication',
      message: 'Your session has expired. Please log in again to continue editing the script.',
      retryable: false,
      timestamp,
      scriptName,
    };
  }

  // Permission errors
  if (errorMessage.includes('forbidden') || errorMessage.includes('permission') || error.name === 'PermissionError') {
    return {
      type: 'permission',
      message: 'You do not have permission to edit this script. Please contact your administrator.',
      retryable: false,
      timestamp,
      scriptName,
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || error.name === 'NetworkError') {
    return {
      type: 'network',
      message: 'Network connection issue. Please check your internet connection and try again.',
      retryable: true,
      timestamp,
      scriptName,
    };
  }

  // API communication errors
  if (errorMessage.includes('api') || errorMessage.includes('server') || error.name === 'APIError') {
    return {
      type: 'api_communication',
      message: 'Unable to communicate with the server. The service may be temporarily unavailable.',
      retryable: true,
      timestamp,
      scriptName,
    };
  }

  // Default unknown error
  return {
    type: 'unknown',
    message: 'An unexpected error occurred while editing the script. Please try again or contact support if the problem persists.',
    retryable: true,
    timestamp,
    scriptName,
    details: {
      originalMessage: error.message,
      stack: error.stack,
    },
  };
}

// Error logging utility
function logError(error: Error, errorInfo: ScriptEditError, digest?: string) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    category: 'script_edit_error_boundary',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest,
    },
    classification: errorInfo,
    context: {
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: Date.now(),
    },
  };

  // Console logging with structured format
  console.error('[SCRIPT_EDIT_ERROR]', JSON.stringify(logEntry, null, 2));

  // Send to monitoring service if available
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true') {
    fetch('/api/analytics/server', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'error_boundary',
        data: logEntry,
        source: 'client',
        timestamp: Date.now(),
      }),
    }).catch((err) => {
      console.warn('Failed to send error to monitoring service:', err);
    });
  }
}

// Error recovery utility functions
function getRecoveryActions(errorType: ScriptEditError['type']) {
  switch (errorType) {
    case 'script_load':
      return [
        { label: 'Return to Scripts List', action: 'navigate_list', primary: true },
        { label: 'Check Script Name', action: 'verify_name', primary: false },
      ];
    
    case 'validation':
      return [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Review Script', action: 'review', primary: false },
      ];
    
    case 'update_conflict':
      return [
        { label: 'Refresh and Retry', action: 'refresh_retry', primary: true },
        { label: 'View Current Version', action: 'view_current', primary: false },
      ];
    
    case 'storage_service':
      return [
        { label: 'Retry Connection', action: 'retry', primary: true },
        { label: 'Check Service Settings', action: 'check_settings', primary: false },
      ];
    
    case 'authentication':
      return [
        { label: 'Log In Again', action: 'login', primary: true },
        { label: 'Return to Home', action: 'navigate_home', primary: false },
      ];
    
    case 'permission':
      return [
        { label: 'Return to Scripts List', action: 'navigate_list', primary: true },
        { label: 'Contact Administrator', action: 'contact_admin', primary: false },
      ];
    
    case 'network':
    case 'api_communication':
      return [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Check Connection', action: 'check_connection', primary: false },
      ];
    
    default:
      return [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Return to Scripts List', action: 'navigate_list', primary: false },
      ];
  }
}

// Error icon mapping
function getErrorIcon(errorType: ScriptEditError['type']) {
  switch (errorType) {
    case 'script_load':
      return FileText;
    case 'validation':
      return AlertTriangle;
    case 'update_conflict':
      return RefreshCw;
    case 'storage_service':
      return Database;
    case 'authentication':
    case 'permission':
      return Shield;
    default:
      return AlertTriangle;
  }
}

export default function ScriptEditErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorInfo, setErrorInfo] = useState<ScriptEditError | null>(null);

  // Classify and log error on mount
  useEffect(() => {
    const classifiedError = classifyError(error);
    setErrorInfo(classifiedError);
    logError(error, classifiedError, error.digest);

    // Announce error to screen readers
    const announcement = `Error: ${classifiedError.message}. Recovery options are available.`;
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'assertive');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = announcement;
    document.body.appendChild(liveRegion);

    // Clean up after announcement
    setTimeout(() => {
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion);
      }
    }, 1000);
  }, [error]);

  // Handle recovery actions
  const handleRecoveryAction = async (action: string) => {
    try {
      setIsRetrying(true);

      switch (action) {
        case 'retry':
          setRetryCount(prev => prev + 1);
          reset();
          break;

        case 'refresh_retry':
          window.location.reload();
          break;

        case 'navigate_list':
          router.push('/adf-event-scripts');
          break;

        case 'navigate_home':
          router.push('/');
          break;

        case 'login':
          router.push('/login');
          break;

        case 'verify_name':
        case 'review':
        case 'view_current':
        case 'check_settings':
        case 'check_connection':
        case 'contact_admin':
          // These actions would typically open modals or navigate to specific sections
          // For now, we'll navigate back to the list
          router.push('/adf-event-scripts');
          break;

        default:
          reset();
      }
    } catch (recoveryError) {
      console.error('Recovery action failed:', recoveryError);
      // Fall back to navigating to scripts list
      router.push('/adf-event-scripts');
    } finally {
      setIsRetrying(false);
    }
  };

  if (!errorInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const ErrorIcon = getErrorIcon(errorInfo.type);
  const recoveryActions = getRecoveryActions(errorInfo.type);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <ErrorIcon className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Script Editor Error
              </h1>
              {errorInfo.scriptName && (
                <nav className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mt-1" aria-label="Breadcrumb">
                  <span>Event Scripts</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  <span className="font-medium">{errorInfo.scriptName}</span>
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h2 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {errorInfo.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Error
                </h2>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {errorInfo.message}
                </p>
              </div>
            </div>
          </div>

          {/* Error Details for Development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mb-6">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Technical Details
              </summary>
              <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {JSON.stringify({
                    error: error.message,
                    type: errorInfo.type,
                    retryCount,
                    digest: error.digest,
                    timestamp: new Date(errorInfo.timestamp).toISOString(),
                  }, null, 2)}
                </pre>
              </div>
            </details>
          )}

          {/* Recovery Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              What would you like to do?
            </h3>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {recoveryActions.map((action, index) => (
                <button
                  key={action.action}
                  onClick={() => handleRecoveryAction(action.action)}
                  disabled={isRetrying}
                  className={`
                    w-full px-4 py-3 rounded-lg border font-medium text-sm transition-colors duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800
                    ${action.primary
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent disabled:bg-blue-600'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                    }
                  `}
                  aria-describedby={`action-${index}-description`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isRetrying && action.action === 'retry' && (
                      <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                    )}
                    <span>{action.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Additional actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleRecoveryAction('navigate_home')}
                  disabled={isRetrying}
                  className="flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 disabled:opacity-50"
                >
                  <Home className="w-4 h-4" aria-hidden="true" />
                  <span>Return to Dashboard</span>
                </button>
                
                {retryCount > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    Retry attempts: {retryCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            If this error persists, please contact your system administrator with the error details above.
          </p>
        </div>
      </div>

      {/* Screen reader live region for retry feedback */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {isRetrying && 'Attempting to recover from error...'}
      </div>
    </div>
  );
}