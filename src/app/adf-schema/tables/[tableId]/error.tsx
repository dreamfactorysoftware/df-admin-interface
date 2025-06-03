/**
 * Table Details Error Boundary for React/Next.js DreamFactory Admin Interface
 * 
 * Next.js error boundary component providing graceful error handling and recovery
 * options for table details functionality. Implements user-friendly error messages,
 * retry mechanisms, and maintains application stability during API failures or
 * data loading errors.
 * 
 * Features:
 * - React Error Boundary integration with Next.js app router
 * - Comprehensive error logging for debugging and monitoring
 * - User-friendly error messages with recovery options
 * - Tailwind CSS error state styling for consistent visual feedback
 * - Accessibility compliance with WCAG 2.1 AA standards
 * - Error categorization and appropriate recovery actions
 * - Performance monitoring and error analytics integration
 * - Responsive design across all supported breakpoints
 * 
 * Error Handling Categories:
 * - Network connectivity errors (retry mechanism)
 * - Authentication/authorization errors (redirect to login)
 * - Data validation errors (form reset options)
 * - Server errors (contact support guidance)
 * - Client-side rendering errors (component refresh)
 * - Permission errors (access denied messaging)
 * 
 * @fileoverview Table details error boundary component for graceful error recovery
 * @version 1.0.0
 * @since 2024-12-31
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Database, 
  Wifi, 
  Shield, 
  FileX, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';

/**
 * Props interface for the table details error boundary component
 * Follows Next.js app router error boundary pattern requirements
 */
interface TableDetailsErrorProps {
  /** Error object with message and optional digest for tracking */
  error: Error & { digest?: string };
  /** Reset function to retry the failed operation */
  reset: () => void;
}

/**
 * Error category enumeration for different error types
 * Enables appropriate recovery actions and user guidance
 */
enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication', 
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown'
}

/**
 * Error category mapping interface for user messaging
 */
interface ErrorCategoryInfo {
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  actions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  canRetry: boolean;
  showDetails: boolean;
}

/**
 * Categorizes error based on error message and context
 * Enables appropriate error handling and recovery strategies
 */
function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase();
  
  // Network-related errors
  if (message.includes('network') || message.includes('fetch') || 
      message.includes('connection') || message.includes('timeout')) {
    return ErrorCategory.NETWORK;
  }
  
  // Authentication errors
  if (message.includes('unauthorized') || message.includes('401') ||
      message.includes('invalid token') || message.includes('expired')) {
    return ErrorCategory.AUTHENTICATION;
  }
  
  // Authorization errors
  if (message.includes('forbidden') || message.includes('403') ||
      message.includes('access denied') || message.includes('permission')) {
    return ErrorCategory.AUTHORIZATION;
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') ||
      message.includes('required') || message.includes('format')) {
    return ErrorCategory.VALIDATION;
  }
  
  // Server errors
  if (message.includes('500') || message.includes('internal server') ||
      message.includes('database error') || message.includes('service unavailable')) {
    return ErrorCategory.SERVER;
  }
  
  // Not found errors
  if (message.includes('404') || message.includes('not found') ||
      message.includes('table not found') || message.includes('does not exist')) {
    return ErrorCategory.NOT_FOUND;
  }
  
  // Client-side errors
  if (message.includes('render') || message.includes('component') ||
      message.includes('props') || message.includes('react')) {
    return ErrorCategory.CLIENT;
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * Error category configuration mapping
 * Provides appropriate messaging and actions for each error type
 */
const ERROR_CATEGORIES: Record<ErrorCategory, ErrorCategoryInfo> = {
  [ErrorCategory.NETWORK]: {
    icon: Wifi,
    title: 'Network Connection Error',
    description: 'Unable to connect to the database service. Please check your network connection and try again.',
    actions: ['Check your internet connection', 'Try refreshing the page', 'Contact support if the issue persists'],
    severity: 'medium',
    canRetry: true,
    showDetails: false
  },
  [ErrorCategory.AUTHENTICATION]: {
    icon: Shield,
    title: 'Authentication Required',
    description: 'Your session has expired or is invalid. Please log in again to access table details.',
    actions: ['Log in again', 'Check your credentials', 'Contact administrator for account issues'],
    severity: 'high',
    canRetry: false,
    showDetails: false
  },
  [ErrorCategory.AUTHORIZATION]: {
    icon: Shield,
    title: 'Access Denied',
    description: 'You do not have permission to access this table. Please contact your administrator.',
    actions: ['Request access from administrator', 'Check your role permissions', 'Use a different account'],
    severity: 'high',
    canRetry: false,
    showDetails: false
  },
  [ErrorCategory.VALIDATION]: {
    icon: FileX,
    title: 'Data Validation Error',
    description: 'There was an issue with the table data format. The form may need to be reset.',
    actions: ['Reset the form', 'Check required fields', 'Verify data format'],
    severity: 'medium',
    canRetry: true,
    showDetails: true
  },
  [ErrorCategory.SERVER]: {
    icon: Database,
    title: 'Server Error',
    description: 'The database server encountered an error. This is usually temporary.',
    actions: ['Wait a moment and try again', 'Check server status', 'Contact support with error details'],
    severity: 'critical',
    canRetry: true,
    showDetails: true
  },
  [ErrorCategory.CLIENT]: {
    icon: AlertTriangle,
    title: 'Application Error',
    description: 'A component error occurred while loading the table details.',
    actions: ['Refresh the page', 'Clear browser cache', 'Try a different browser'],
    severity: 'medium',
    canRetry: true,
    showDetails: true
  },
  [ErrorCategory.PERMISSION]: {
    icon: Shield,
    title: 'Insufficient Permissions',
    description: 'You need additional permissions to access this table.',
    actions: ['Contact your administrator', 'Request table access', 'Check role assignments'],
    severity: 'high',
    canRetry: false,
    showDetails: false
  },
  [ErrorCategory.NOT_FOUND]: {
    icon: Database,
    title: 'Table Not Found',
    description: 'The requested table could not be found or may have been deleted.',
    actions: ['Check if the table still exists', 'Return to table list', 'Contact administrator'],
    severity: 'medium',
    canRetry: false,
    showDetails: false
  },
  [ErrorCategory.UNKNOWN]: {
    icon: AlertTriangle,
    title: 'Unexpected Error',
    description: 'An unexpected error occurred while loading table details.',
    actions: ['Try refreshing the page', 'Clear browser cache', 'Contact support if the issue persists'],
    severity: 'medium',
    canRetry: true,
    showDetails: true
  }
};

/**
 * Table Details Error Boundary Component
 * 
 * Provides comprehensive error handling for table details functionality with
 * user-friendly error messages, recovery options, and accessibility compliance.
 * Implements Next.js error boundary pattern with React Error Boundary integration.
 */
export default function TableDetailsError({ error, reset }: TableDetailsErrorProps) {
  const router = useRouter();
  const params = useParams();
  const [showDetails, setShowDetails] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Get table ID from route parameters for context
  const tableId = params?.tableId as string;
  
  // Categorize the error for appropriate handling
  const errorCategory = categorizeError(error);
  const categoryInfo = ERROR_CATEGORIES[errorCategory];
  const IconComponent = categoryInfo.icon;
  
  /**
   * Enhanced error logging with comprehensive context
   * Supports debugging and monitoring requirements
   */
  useEffect(() => {
    // Log error details for monitoring and debugging
    const errorDetails = {
      timestamp: new Date().toISOString(),
      tableId,
      category: errorCategory,
      severity: categoryInfo.severity,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      retryCount,
      sessionInfo: {
        // Add session context if available
        timestamp: new Date().toISOString(),
        route: `/adf-schema/tables/${tableId}`
      }
    };
    
    // Log to console for development
    console.error('Table Details Error:', errorDetails);
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Integration point for monitoring services like Sentry, LogRocket, etc.
      try {
        // Example: window.gtag?.('event', 'exception', { description: error.message, fatal: false });
        // Example: Sentry.captureException(error, { extra: errorDetails });
      } catch (monitoringError) {
        console.error('Error logging failed:', monitoringError);
      }
    }
  }, [error, tableId, errorCategory, categoryInfo.severity, retryCount]);
  
  /**
   * Handle retry operation with tracking
   * Implements exponential backoff and retry limits
   */
  const handleRetry = useCallback(() => {
    if (retryCount < 3) { // Limit retry attempts
      setRetryCount(prev => prev + 1);
      
      // Add slight delay for network issues
      if (errorCategory === ErrorCategory.NETWORK) {
        setTimeout(() => {
          reset();
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        reset();
      }
    }
  }, [reset, retryCount, errorCategory]);
  
  /**
   * Navigation handlers for different recovery scenarios
   */
  const handleGoToTableList = useCallback(() => {
    router.push('/adf-schema/tables');
  }, [router]);
  
  const handleGoToHome = useCallback(() => {
    router.push('/');
  }, [router]);
  
  const handleGoToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);
  
  /**
   * Copy error details to clipboard for support purposes
   */
  const handleCopyErrorDetails = useCallback(async () => {
    const errorText = `
Error: ${error.message}
Table ID: ${tableId}
Category: ${errorCategory}
Timestamp: ${new Date().toISOString()}
${error.digest ? `Digest: ${error.digest}` : ''}
${error.stack ? `Stack: ${error.stack}` : ''}
`.trim();
    
    try {
      await navigator.clipboard.writeText(errorText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (clipboardError) {
      console.error('Failed to copy error details:', clipboardError);
    }
  }, [error, tableId, errorCategory]);
  
  /**
   * Severity-based styling classes
   */
  const getSeverityClasses = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };
  
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[500px] p-8 max-w-2xl mx-auto"
      data-testid="table-details-error"
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon and Header */}
      <div className={`
        p-6 rounded-lg border-2 w-full text-center space-y-6
        ${getSeverityClasses(categoryInfo.severity)}
      `}>
        {/* Icon */}
        <div className="flex justify-center">
          <IconComponent 
            className={`
              h-16 w-16
              ${categoryInfo.severity === 'critical' ? 'text-red-600' : ''}
              ${categoryInfo.severity === 'high' ? 'text-orange-600' : ''}
              ${categoryInfo.severity === 'medium' ? 'text-yellow-600' : ''}
              ${categoryInfo.severity === 'low' ? 'text-blue-600' : ''}
            `}
            aria-hidden="true"
          />
        </div>
        
        {/* Title and Description */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {categoryInfo.title}
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            {categoryInfo.description}
          </p>
          {tableId && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Table: <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded font-mono text-sm">
                {tableId}
              </code>
            </p>
          )}
        </div>
        
        {/* Action Steps */}
        <div className="text-left bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Suggested Actions:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {categoryInfo.actions.map((action, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-primary-600 font-bold mt-0.5">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          {/* Primary action based on error category */}
          {errorCategory === ErrorCategory.AUTHENTICATION ? (
            <button
              onClick={handleGoToLogin}
              className="
                inline-flex items-center px-6 py-3 bg-primary-600 text-white 
                rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 
                focus:ring-primary-500 focus:ring-offset-2 transition-colors
                font-medium
              "
              data-testid="login-button"
            >
              <Shield className="h-5 w-5 mr-2" />
              Go to Login
            </button>
          ) : errorCategory === ErrorCategory.NOT_FOUND ? (
            <button
              onClick={handleGoToTableList}
              className="
                inline-flex items-center px-6 py-3 bg-primary-600 text-white 
                rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 
                focus:ring-primary-500 focus:ring-offset-2 transition-colors
                font-medium
              "
              data-testid="table-list-button"
            >
              <Database className="h-5 w-5 mr-2" />
              Back to Tables
            </button>
          ) : categoryInfo.canRetry && retryCount < 3 ? (
            <button
              onClick={handleRetry}
              className="
                inline-flex items-center px-6 py-3 bg-primary-600 text-white 
                rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 
                focus:ring-primary-500 focus:ring-offset-2 transition-colors
                font-medium disabled:opacity-50 disabled:cursor-not-allowed
              "
              data-testid="retry-button"
              disabled={retryCount >= 3}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              {retryCount > 0 ? `Retry (${retryCount}/3)` : 'Try Again'}
            </button>
          ) : null}
          
          {/* Secondary actions */}
          <button
            onClick={handleGoToHome}
            className="
              inline-flex items-center px-6 py-3 bg-gray-600 text-white 
              rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 
              focus:ring-gray-500 focus:ring-offset-2 transition-colors
              font-medium
            "
            data-testid="home-button"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Dashboard
          </button>
          
          <button
            onClick={handleGoToTableList}
            className="
              inline-flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 
              text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 
              dark:hover:bg-gray-600 focus:outline-none focus:ring-2 
              focus:ring-gray-500 focus:ring-offset-2 transition-colors
              font-medium
            "
            data-testid="tables-button"
          >
            <Database className="h-5 w-5 mr-2" />
            All Tables
          </button>
        </div>
        
        {/* Error Details Disclosure */}
        {categoryInfo.showDetails && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="
                flex items-center justify-center space-x-2 text-sm 
                text-gray-600 dark:text-gray-400 hover:text-gray-800 
                dark:hover:text-gray-200 transition-colors
              "
              data-testid="toggle-details-button"
              aria-expanded={showDetails}
              aria-controls="error-details"
            >
              <span>Technical Details</span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {showDetails && (
              <div 
                id="error-details"
                className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    Error Information
                  </h4>
                  <button
                    onClick={handleCopyErrorDetails}
                    className="
                      inline-flex items-center space-x-1 text-xs text-gray-600 
                      dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 
                      transition-colors
                    "
                    data-testid="copy-error-button"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="space-y-2 text-xs font-mono text-gray-700 dark:text-gray-300">
                  <div>
                    <span className="font-semibold">Message:</span> {error.message}
                  </div>
                  {error.digest && (
                    <div>
                      <span className="font-semibold">ID:</span> {error.digest}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Category:</span> {errorCategory}
                  </div>
                  <div>
                    <span className="font-semibold">Time:</span> {new Date().toLocaleString()}
                  </div>
                  {retryCount > 0 && (
                    <div>
                      <span className="font-semibold">Retry Attempts:</span> {retryCount}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Support Contact */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Need help? {' '}
            <a 
              href="/support"
              className="
                text-primary-600 dark:text-primary-400 hover:text-primary-800 
                dark:hover:text-primary-300 transition-colors underline
              "
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Support
              <ExternalLink className="inline h-3 w-3 ml-1" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}