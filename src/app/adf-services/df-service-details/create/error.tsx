'use client';

/**
 * Error boundary component for the service creation page that handles and displays 
 * user-friendly error messages when service creation workflows fail.
 * 
 * Features:
 * - React 19 error boundary implementation with fallback UI
 * - Contextual recovery actions based on error types (network, validation, authentication)
 * - Retry mechanisms with exponential backoff for transient errors
 * - User-friendly error messaging with accessibility compliance (WCAG 2.1 AA)
 * - Error logging and monitoring integration for debugging and system health
 * - Tailwind CSS styling with dark mode support
 * - Navigation options and proper error recovery workflows
 * 
 * Implements:
 * - Next.js app router error handling per Section 7.5.1 Core Application Layout Structure
 * - React 19 error boundary patterns per Section 4.7.1 Angular to React Component Migration
 * - Error recovery workflows per Section 4.1.3 Connection Failure Recovery Workflow
 * - Tailwind CSS error styling with dark mode support per React/Next.js Integration Requirements
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Network, 
  Shield, 
  AlertCircle,
  Database,
  Settings,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useErrorHandler, ErrorType, RecoveryStrategy, type AppError } from '@/hooks/use-error-handler';
import useLogger from '@/hooks/use-logger';

// ============================================================================
// Type Definitions
// ============================================================================

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ServiceCreationErrorContext {
  step?: 'selection' | 'configuration' | 'testing' | 'creation';
  serviceType?: string;
  connectionParams?: Record<string, any>;
  validationErrors?: Record<string, string[]>;
}

// ============================================================================
// Error Classification for Service Creation
// ============================================================================

function classifyServiceCreationError(error: Error): {
  type: ErrorType;
  context: ServiceCreationErrorContext;
  userMessage: string;
  technicalMessage: string;
  recoveryActions: string[];
} {
  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || '';

  // Network and connection errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorStack.includes('network')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      context: { step: 'testing' },
      userMessage: 'Unable to connect to the database server. Please check your network connection and database server status.',
      technicalMessage: error.message,
      recoveryActions: [
        'Verify your internet connection',
        'Check database server connectivity',
        'Confirm firewall settings allow database access',
        'Try connecting again in a few moments'
      ]
    };
  }

  // Authentication errors
  if (
    errorMessage.includes('authentication') ||
    errorMessage.includes('login') ||
    errorMessage.includes('credentials') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('401')
  ) {
    return {
      type: ErrorType.AUTHENTICATION_ERROR,
      context: { step: 'testing' },
      userMessage: 'Database authentication failed. Please verify your username and password.',
      technicalMessage: error.message,
      recoveryActions: [
        'Double-check your database username',
        'Verify your database password',
        'Ensure the database user has proper permissions',
        'Check if the database requires special authentication'
      ]
    };
  }

  // Authorization/Permission errors
  if (
    errorMessage.includes('permission') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('access denied') ||
    errorMessage.includes('403')
  ) {
    return {
      type: ErrorType.AUTHORIZATION_ERROR,
      context: { step: 'testing' },
      userMessage: 'Insufficient permissions to access the database. Please check your user privileges.',
      technicalMessage: error.message,
      recoveryActions: [
        'Verify database user permissions',
        'Contact your database administrator',
        'Ensure the user can create/read tables',
        'Check schema-level permissions'
      ]
    };
  }

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required') ||
    errorMessage.includes('format') ||
    errorMessage.includes('400')
  ) {
    return {
      type: ErrorType.VALIDATION_ERROR,
      context: { step: 'configuration' },
      userMessage: 'Invalid configuration values. Please review and correct the form fields.',
      technicalMessage: error.message,
      recoveryActions: [
        'Check all required fields are filled',
        'Verify host and port format',
        'Ensure database name is correct',
        'Validate special characters in credentials'
      ]
    };
  }

  // Database-specific errors
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('schema') ||
    errorMessage.includes('table') ||
    errorMessage.includes('mysql') ||
    errorMessage.includes('postgresql') ||
    errorMessage.includes('oracle') ||
    errorMessage.includes('mongodb')
  ) {
    return {
      type: ErrorType.DATABASE_ERROR,
      context: { step: 'testing' },
      userMessage: 'Database server error. The database may be unavailable or misconfigured.',
      technicalMessage: error.message,
      recoveryActions: [
        'Verify database server is running',
        'Check database configuration',
        'Ensure database name exists',
        'Confirm database server version compatibility'
      ]
    };
  }

  // Service creation specific errors
  if (
    errorMessage.includes('service') ||
    errorMessage.includes('creation') ||
    errorMessage.includes('duplicate') ||
    errorMessage.includes('exists')
  ) {
    return {
      type: ErrorType.SERVICE_ERROR,
      context: { step: 'creation' },
      userMessage: 'Service creation failed. A service with this name may already exist.',
      technicalMessage: error.message,
      recoveryActions: [
        'Use a different service name',
        'Check existing services list',
        'Remove conflicting service if appropriate',
        'Retry service creation'
      ]
    };
  }

  // Configuration errors
  if (
    errorMessage.includes('configuration') ||
    errorMessage.includes('config') ||
    errorMessage.includes('parameter') ||
    errorMessage.includes('setting')
  ) {
    return {
      type: ErrorType.CONFIGURATION_ERROR,
      context: { step: 'configuration' },
      userMessage: 'Configuration error detected. Please review your service settings.',
      technicalMessage: error.message,
      recoveryActions: [
        'Review all configuration parameters',
        'Check default port numbers',
        'Verify SSL/TLS settings',
        'Confirm advanced options are correct'
      ]
    };
  }

  // Default to application error
  return {
    type: ErrorType.APPLICATION_ERROR,
    context: { step: 'creation' },
    userMessage: 'An unexpected error occurred during service creation. Please try again.',
    technicalMessage: error.message,
    recoveryActions: [
      'Refresh the page and try again',
      'Clear browser cache if issues persist',
      'Try using a different browser',
      'Contact support if the problem continues'
    ]
  };
}

// ============================================================================
// Error Icon Component
// ============================================================================

function ErrorIcon({ errorType, className = "h-12 w-12" }: { errorType: ErrorType; className?: string }) {
  const iconProps = {
    className: `${className} mb-4`,
    'aria-hidden': 'true'
  };

  switch (errorType) {
    case ErrorType.NETWORK_ERROR:
    case ErrorType.CONNECTION_ERROR:
      return <Network {...iconProps} className={`${iconProps.className} text-orange-500`} />;
    
    case ErrorType.AUTHENTICATION_ERROR:
    case ErrorType.AUTHORIZATION_ERROR:
      return <Shield {...iconProps} className={`${iconProps.className} text-red-500`} />;
    
    case ErrorType.DATABASE_ERROR:
      return <Database {...iconProps} className={`${iconProps.className} text-purple-500`} />;
    
    case ErrorType.VALIDATION_ERROR:
    case ErrorType.CONFIGURATION_ERROR:
      return <Settings {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
    
    case ErrorType.SERVICE_ERROR:
      return <AlertCircle {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    
    default:
      return <AlertTriangle {...iconProps} className={`${iconProps.className} text-red-500`} />;
  }
}

// ============================================================================
// Recovery Actions Component
// ============================================================================

function RecoveryActions({ 
  actions, 
  onRetry, 
  canRetry, 
  isRetrying 
}: { 
  actions: string[]; 
  onRetry: () => void; 
  canRetry: boolean; 
  isRetrying: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-6 space-y-4">
      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onRetry}
          disabled={!canRetry || isRetrying}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          aria-label={isRetrying ? 'Retrying service creation...' : 'Retry service creation'}
        >
          {isRetrying ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" aria-hidden="true" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5 mr-2" aria-hidden="true" />
              Try Again
            </>
          )}
        </button>

        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          aria-label="Go back to previous page"
        >
          <ArrowLeft className="h-5 w-5 mr-2" aria-hidden="true" />
          Go Back
        </button>
      </div>

      {/* Troubleshooting Guide */}
      {actions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left text-blue-900 dark:text-blue-100 font-medium hover:text-blue-700 dark:hover:text-blue-200 transition-colors duration-200"
            aria-expanded={isExpanded}
            aria-controls="troubleshooting-actions"
          >
            <span className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" aria-hidden="true" />
              Troubleshooting Steps
            </span>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          
          {isExpanded && (
            <div id="troubleshooting-actions" className="mt-3">
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                {actions.map((action, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Technical Details Component
// ============================================================================

function TechnicalDetails({ error, errorInfo }: { error: AppError; errorInfo: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const technicalInfo = {
    'Error ID': error.errorId,
    'Error Type': error.type,
    'Timestamp': error.timestamp,
    'Message': error.technicalMessage || error.message,
    'Component Stack': errorInfo?.componentStack?.split('\n').slice(0, 5).join('\n') || 'Not available',
    'User Agent': navigator.userAgent,
    'URL': window.location.href,
  };

  const copyToClipboard = useCallback(async () => {
    const text = Object.entries(technicalInfo)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [technicalInfo]);

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left text-gray-600 dark:text-gray-300 text-sm font-medium hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
        aria-expanded={isExpanded}
        aria-controls="technical-details"
      >
        <span>Technical Details</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {isExpanded && (
        <div id="technical-details" className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Error Information
            </h4>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
              aria-label="Copy technical details to clipboard"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
          </div>
          
          <dl className="space-y-2 text-sm">
            {Object.entries(technicalInfo).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row">
                <dt className="font-medium text-gray-600 dark:text-gray-300 sm:w-32 sm:flex-shrink-0">
                  {key}:
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 break-all sm:ml-2">
                  {value || 'N/A'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Additional Resources Component
// ============================================================================

function AdditionalResources() {
  const resources = [
    {
      title: 'Database Connection Guide',
      description: 'Step-by-step guide for connecting to different database types',
      url: '/docs/database-connections',
      icon: Database
    },
    {
      title: 'Service Configuration Help',
      description: 'Detailed documentation on service configuration options',
      url: '/docs/service-configuration',
      icon: Settings
    },
    {
      title: 'Troubleshooting Guide',
      description: 'Common issues and solutions for service creation',
      url: '/docs/troubleshooting',
      icon: AlertCircle
    }
  ];

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Need More Help?
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {resources.map((resource, index) => {
          const IconComponent = resource.icon;
          return (
            <a
              key={index}
              href={resource.url}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex items-start">
                <IconComponent className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5 mr-3" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    {resource.title}
                    <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {resource.description}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Main Error Component
// ============================================================================

export default function ServiceCreationError({ error, reset }: ErrorPageProps) {
  const router = useRouter();
  const errorHandler = useErrorHandler();
  const logger = useLogger();
  
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorInfo, setErrorInfo] = useState<any>(null);

  // Classify the error for better user experience
  const errorClassification = classifyServiceCreationError(error);
  
  // Create AppError instance for consistency
  const appError: AppError = {
    name: 'ServiceCreationError',
    message: error.message,
    type: errorClassification.type,
    severity: errorHandler.getErrorSeverity(error),
    recoveryStrategy: RecoveryStrategy.RETRY,
    errorId: `service_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    userMessage: errorClassification.userMessage,
    technicalMessage: errorClassification.technicalMessage,
    originalError: error,
    retryable: [
      ErrorType.NETWORK_ERROR,
      ErrorType.CONNECTION_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.DATABASE_ERROR,
      ErrorType.SERVICE_ERROR
    ].includes(errorClassification.type),
    context: {
      component: 'ServiceCreationPage',
      route: '/adf-services/df-service-details/create',
      action: 'service_creation',
      feature: 'database_service_management',
      ...errorClassification.context
    }
  };

  // Log error on mount and when it changes
  useEffect(() => {
    logger.error(
      `Service creation error: ${appError.type}`,
      appError.originalError || appError,
      {
        component: 'ServiceCreationError',
        category: 'service_creation',
        action: 'error_display',
        errorId: appError.errorId,
        errorType: appError.type,
        step: errorClassification.context.step,
        retryCount,
        userAgent: navigator.userAgent,
        url: window.location.href,
      }
    );

    // Handle error through error handler
    errorHandler.handleError(appError);
  }, [error, logger, errorHandler, appError.errorId, retryCount]);

  // Handle retry with exponential backoff
  const handleRetry = useCallback(async () => {
    if (isRetrying || retryCount >= 3) return;

    setIsRetrying(true);
    
    try {
      // Add delay based on retry count (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Log retry attempt
      logger.info(
        `Retrying service creation (attempt ${retryCount + 1})`,
        undefined,
        {
          component: 'ServiceCreationError',
          category: 'service_creation',
          action: 'retry',
          errorId: appError.errorId,
          retryCount: retryCount + 1,
        }
      );

      setRetryCount(prev => prev + 1);
      reset();
    } catch (retryError) {
      logger.error(
        'Retry failed',
        retryError as Error,
        {
          component: 'ServiceCreationError',
          category: 'service_creation',
          action: 'retry_failed',
          errorId: appError.errorId,
          retryCount: retryCount + 1,
        }
      );
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, retryCount, reset, logger, appError.errorId]);

  // Handle navigation back to services list
  const handleBackToServices = useCallback(() => {
    logger.info(
      'Navigating back to services list from error page',
      undefined,
      {
        component: 'ServiceCreationError',
        category: 'service_creation',
        action: 'navigate_back',
        errorId: appError.errorId,
      }
    );
    
    router.push('/adf-services');
  }, [router, logger, appError.errorId]);

  const canRetry = appError.retryable && retryCount < 3;

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 sm:p-12">
          {/* Error Header */}
          <div className="text-center">
            <ErrorIcon errorType={errorClassification.type} />
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Service Creation Failed
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              {errorClassification.userMessage}
            </p>

            {retryCount > 0 && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
                Retry attempt {retryCount} of 3
              </p>
            )}

            {retryCount >= 3 && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-800 dark:text-red-200 font-medium">
                  Maximum retry attempts reached. Please review the configuration or contact support.
                </p>
              </div>
            )}
          </div>

          {/* Recovery Actions */}
          <RecoveryActions
            actions={errorClassification.recoveryActions}
            onRetry={handleRetry}
            canRetry={canRetry}
            isRetrying={isRetrying}
          />

          {/* Navigation Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleBackToServices}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                aria-label="Return to database services list"
              >
                <Database className="h-5 w-5 mr-2" aria-hidden="true" />
                Back to Services
              </button>

              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                aria-label="Return to dashboard"
              >
                <ArrowLeft className="h-5 w-5 mr-2" aria-hidden="true" />
                Dashboard
              </button>
            </div>
          </div>

          {/* Additional Resources */}
          <AdditionalResources />

          {/* Technical Details */}
          <TechnicalDetails error={appError} errorInfo={errorInfo} />

          {/* Error Context Information */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Development Information
              </h4>
              <pre className="text-xs text-yellow-700 dark:text-yellow-300 whitespace-pre-wrap break-words">
                {JSON.stringify({
                  errorType: errorClassification.type,
                  context: errorClassification.context,
                  retryCount,
                  canRetry,
                  digest: error.digest,
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}