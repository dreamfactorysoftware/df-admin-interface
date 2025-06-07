'use client';

/**
 * Error Boundary Component for Database Service Route Segment
 * 
 * Implements Next.js error boundary pattern for the [service] route segment,
 * providing comprehensive error handling for service configuration failures,
 * connection errors, and form validation issues.
 * 
 * Features:
 * - WCAG 2.1 AA accessibility compliance with proper error announcements
 * - Service-specific error recovery workflows
 * - Retry functionality with exponential backoff
 * - User-friendly error messages with actionable recovery steps
 * - Keyboard navigation support
 * - Performance optimized for sub-100ms error recovery interactions
 * 
 * @fileoverview Next.js error boundary for database service route segment
 * @version 1.0.0
 * @see Technical Specification Section 4.2 - ERROR HANDLING AND VALIDATION
 * @see Technical Specification Section 7.5.1 - Core Application Layout Structure
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  AlertTriangle, 
  Database, 
  RefreshCw, 
  ChevronLeft, 
  ExternalLink,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/**
 * Error boundary props interface following Next.js app router patterns
 * Provides error object and reset function from Next.js error handling
 */
export interface ServiceErrorBoundaryProps {
  /**
   * Error object with optional digest for error tracking
   * Provided automatically by Next.js error boundary system
   */
  error: Error & { digest?: string };
  
  /**
   * Reset function to retry the failed operation
   * Provided automatically by Next.js error boundary system
   */
  reset: () => void;
}

/**
 * Service-specific error type classification
 * Enables targeted error handling and recovery workflows
 */
type ServiceErrorType = 
  | 'connection'      // Database connection failures
  | 'authentication' // Auth/credential issues
  | 'validation'     // Form validation errors
  | 'network'        // Network connectivity issues
  | 'timeout'        // Request timeout errors
  | 'permission'     // Access control violations
  | 'configuration'  // Service configuration errors
  | 'server'         // Internal server errors
  | 'unknown';       // Unclassified errors

/**
 * Error classification configuration
 * Maps error patterns to service-specific error types and recovery strategies
 */
const ERROR_PATTERNS: Record<ServiceErrorType, {
  patterns: (string | RegExp)[];
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  maxRetries: number;
  retryDelay: number;
  recoverySteps: string[];
}> = {
  connection: {
    patterns: [
      /connection.*refused/i,
      /connection.*timeout/i,
      /econnrefused/i,
      /could not connect/i,
      /database.*unreachable/i,
      'ERR_CONNECTION_REFUSED'
    ],
    title: 'Database Connection Failed',
    icon: Database,
    severity: 'high',
    retryable: true,
    maxRetries: 3,
    retryDelay: 2000,
    recoverySteps: [
      'Verify database server is running and accessible',
      'Check connection details (host, port, credentials)',
      'Ensure network connectivity to database server',
      'Verify firewall settings allow database connections'
    ]
  },
  authentication: {
    patterns: [
      /authentication.*failed/i,
      /invalid.*credentials/i,
      /access.*denied/i,
      /unauthorized/i,
      'ERR_AUTH_FAILED'
    ],
    title: 'Authentication Error',
    icon: AlertTriangle,
    severity: 'high',
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    recoverySteps: [
      'Verify username and password are correct',
      'Check if account has required database permissions',
      'Contact database administrator if credentials are locked'
    ]
  },
  validation: {
    patterns: [
      /validation.*error/i,
      /invalid.*input/i,
      /required.*field/i,
      /form.*validation/i,
      'VALIDATION_ERROR'
    ],
    title: 'Configuration Validation Error',
    icon: Settings,
    severity: 'medium',
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    recoverySteps: [
      'Review all required configuration fields',
      'Ensure data formats match expected patterns',
      'Check for typos in connection parameters'
    ]
  },
  network: {
    patterns: [
      /network.*error/i,
      /fetch.*failed/i,
      /internet.*connection/i,
      /dns.*resolution/i,
      'ERR_NETWORK'
    ],
    title: 'Network Connection Error',
    icon: AlertTriangle,
    severity: 'medium',
    retryable: true,
    maxRetries: 2,
    retryDelay: 1500,
    recoverySteps: [
      'Check your internet connection',
      'Verify DreamFactory server is accessible',
      'Try refreshing the page'
    ]
  },
  timeout: {
    patterns: [
      /timeout/i,
      /request.*timed.*out/i,
      /response.*timeout/i,
      'TIMEOUT_ERROR'
    ],
    title: 'Request Timeout',
    icon: RefreshCw,
    severity: 'medium',
    retryable: true,
    maxRetries: 2,
    retryDelay: 3000,
    recoverySteps: [
      'Database may be slow to respond',
      'Check database server performance',
      'Try again in a few moments'
    ]
  },
  permission: {
    patterns: [
      /permission.*denied/i,
      /insufficient.*privileges/i,
      /forbidden/i,
      'ERR_PERMISSION_DENIED'
    ],
    title: 'Insufficient Permissions',
    icon: AlertTriangle,
    severity: 'high',
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    recoverySteps: [
      'Contact system administrator for access',
      'Verify your user role has required permissions',
      'Check if service requires elevated privileges'
    ]
  },
  configuration: {
    patterns: [
      /configuration.*error/i,
      /invalid.*config/i,
      /service.*misconfigured/i,
      'CONFIG_ERROR'
    ],
    title: 'Service Configuration Error',
    icon: Settings,
    severity: 'high',
    retryable: false,
    maxRetries: 0,
    retryDelay: 0,
    recoverySteps: [
      'Review service configuration settings',
      'Verify all required parameters are provided',
      'Check configuration against documentation'
    ]
  },
  server: {
    patterns: [
      /internal.*server.*error/i,
      /500/,
      /server.*error/i,
      'ERR_INTERNAL_SERVER_ERROR'
    ],
    title: 'Server Error',
    icon: AlertTriangle,
    severity: 'critical',
    retryable: true,
    maxRetries: 1,
    retryDelay: 5000,
    recoverySteps: [
      'Server is experiencing issues',
      'Try again in a few minutes',
      'Contact support if problem persists'
    ]
  },
  unknown: {
    patterns: [],
    title: 'Unexpected Error',
    icon: AlertTriangle,
    severity: 'medium',
    retryable: true,
    maxRetries: 1,
    retryDelay: 2000,
    recoverySteps: [
      'An unexpected error occurred',
      'Try refreshing the page',
      'Contact support if the issue continues'
    ]
  }
};

/**
 * Classify error based on message patterns
 * Analyzes error message and stack trace to determine service-specific error type
 */
const classifyError = (error: Error): ServiceErrorType => {
  const errorMessage = `${error.message} ${error.stack || ''}`.toLowerCase();
  
  // Check each error pattern for matches
  for (const [type, config] of Object.entries(ERROR_PATTERNS)) {
    const patterns = config.patterns;
    for (const pattern of patterns) {
      if (typeof pattern === 'string') {
        if (errorMessage.includes(pattern.toLowerCase())) {
          return type as ServiceErrorType;
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(errorMessage)) {
          return type as ServiceErrorType;
        }
      }
    }
  }
  
  return 'unknown';
};

/**
 * Database Service Error Boundary Component
 * 
 * Implements comprehensive error handling for individual service route segments,
 * providing user-friendly error messages, recovery actions, and retry functionality
 * for service configuration failures, connection errors, and form validation issues.
 * 
 * Key Features:
 * - Automatic error classification and targeted recovery workflows
 * - Retry functionality with exponential backoff and max retry limits
 * - WCAG 2.1 AA accessibility with proper error announcements
 * - Keyboard navigation support and focus management
 * - Performance optimized for sub-100ms user interactions
 * - Service-specific error context and actionable recovery steps
 * 
 * @example
 * ```tsx
 * // Automatically used by Next.js for route segment error handling
 * // app/api-connections/database/[service]/error.tsx
 * export default function ServiceError({ error, reset }: ServiceErrorBoundaryProps) {
 *   return <ServiceErrorBoundary error={error} reset={reset} />;
 * }
 * ```
 */
export default function ServiceErrorBoundary({ 
  error, 
  reset 
}: ServiceErrorBoundaryProps) {
  // Classify the error type for targeted handling
  const errorType = classifyError(error);
  const errorConfig = ERROR_PATTERNS[errorType];
  
  // Component state management
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [announceRetry, setAnnounceRetry] = useState(false);
  
  // Refs for accessibility and performance
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const errorAnnouncedRef = useRef(false);
  const focusTargetRef = useRef<HTMLHeadingElement>(null);
  
  /**
   * Handle retry with exponential backoff and accessibility announcements
   * Implements intelligent retry logic based on error type and classification
   */
  const handleRetry = useCallback(async () => {
    // Prevent retry if max attempts reached or error is not retryable
    if (!errorConfig.retryable || retryCount >= errorConfig.maxRetries) {
      return;
    }
    
    setIsRetrying(true);
    setAnnounceRetry(true);
    
    // Calculate exponential backoff delay
    const delay = errorConfig.retryDelay * Math.pow(1.5, retryCount);
    
    try {
      // Clear any existing timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Wait for retry delay with exponential backoff
      await new Promise(resolve => {
        retryTimeoutRef.current = setTimeout(resolve, delay);
      });
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
      // Trigger Next.js error boundary reset
      reset();
      
    } catch (retryError) {
      console.error('Error during retry attempt:', retryError);
      setIsRetrying(false);
      setAnnounceRetry(false);
    }
  }, [errorConfig, retryCount, reset]);
  
  /**
   * Handle back navigation to service list
   * Provides escape route from error state
   */
  const handleBack = useCallback(() => {
    // Navigate back to service list using browser history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to service list route
      window.location.href = '/api-connections/database';
    }
  }, []);
  
  /**
   * Handle help documentation navigation
   * Opens relevant help documentation in new tab
   */
  const handleHelp = useCallback(() => {
    const helpUrl = '/help/database-services/troubleshooting';
    window.open(helpUrl, '_blank', 'noopener,noreferrer');
  }, []);
  
  /**
   * Log error for monitoring and debugging
   * Captures error context for analysis and improvement
   */
  useEffect(() => {
    // Log error with classification for monitoring
    console.error('Service Error Boundary:', {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
      type: errorType,
      severity: errorConfig.severity,
      retryCount,
      timestamp: new Date().toISOString(),
    });
    
    // Report to error tracking service if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `Service Error: ${errorType} - ${error.message}`,
        fatal: errorConfig.severity === 'critical',
        error_type: errorType,
        retry_count: retryCount,
      });
    }
  }, [error, errorType, errorConfig, retryCount]);
  
  /**
   * Announce error to screen readers on mount
   * Ensures accessibility compliance with immediate error notification
   */
  useEffect(() => {
    if (!errorAnnouncedRef.current) {
      // Create live region for error announcement
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'assertive');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = `Error: ${errorConfig.title}. ${error.message}`;
      
      document.body.appendChild(announcer);
      
      // Remove announcer after screen reader processes it
      setTimeout(() => {
        if (document.body.contains(announcer)) {
          document.body.removeChild(announcer);
        }
      }, 2000);
      
      errorAnnouncedRef.current = true;
    }
  }, [error.message, errorConfig.title]);
  
  /**
   * Announce retry attempts to screen readers
   * Provides feedback during retry operations
   */
  useEffect(() => {
    if (announceRetry) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.textContent = `Retrying operation. Attempt ${retryCount + 1} of ${errorConfig.maxRetries + 1}.`;
      
      document.body.appendChild(announcer);
      
      setTimeout(() => {
        if (document.body.contains(announcer)) {
          document.body.removeChild(announcer);
        }
        setAnnounceRetry(false);
      }, 1000);
    }
  }, [announceRetry, retryCount, errorConfig.maxRetries]);
  
  /**
   * Focus management for keyboard accessibility
   * Ensures proper focus flow for keyboard users
   */
  useEffect(() => {
    // Focus on error heading when component mounts
    if (focusTargetRef.current) {
      focusTargetRef.current.focus();
    }
  }, []);
  
  /**
   * Cleanup timeouts on unmount
   * Prevents memory leaks and unwanted state updates
   */
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  // Determine retry availability
  const canRetry = errorConfig.retryable && retryCount < errorConfig.maxRetries;
  const retryLabel = retryCount > 0 
    ? `Retry (${retryCount}/${errorConfig.maxRetries})`
    : 'Try Again';
  
  // Get error icon component
  const ErrorIcon = errorConfig.icon;
  
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[500px] p-8 max-w-2xl mx-auto"
      data-testid="service-error-boundary"
      role="main"
      aria-labelledby="error-title"
    >
      {/* Error Icon and Title */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className={cn(
            "p-4 rounded-full",
            errorConfig.severity === 'critical' && "bg-error-100 dark:bg-error-900/30",
            errorConfig.severity === 'high' && "bg-error-50 dark:bg-error-950/50",
            errorConfig.severity === 'medium' && "bg-warning-50 dark:bg-warning-950/50",
            errorConfig.severity === 'low' && "bg-primary-50 dark:bg-primary-950/50"
          )}>
            <ErrorIcon className={cn(
              "h-12 w-12",
              errorConfig.severity === 'critical' && "text-error-600 dark:text-error-400",
              errorConfig.severity === 'high' && "text-error-500 dark:text-error-400",
              errorConfig.severity === 'medium' && "text-warning-500 dark:text-warning-400",
              errorConfig.severity === 'low' && "text-primary-500 dark:text-primary-400"
            )} />
          </div>
        </div>
        
        <h1 
          id="error-title"
          ref={focusTargetRef}
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          tabIndex={-1}
        >
          {errorConfig.title}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Unable to load database service configuration
        </p>
      </div>
      
      {/* Error Details Alert */}
      <div className="w-full mb-6">
        <Alert 
          type={errorConfig.severity === 'critical' ? 'error' : 'warning'}
          variant="soft"
          title="Error Details"
          description={error.message}
          dismissible={false}
          priority={errorConfig.severity === 'critical' ? 'high' : 'medium'}
        />
      </div>
      
      {/* Recovery Steps */}
      <div className="w-full mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          How to resolve this issue:
        </h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          {errorConfig.recoverySteps.map((step, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {/* Primary Action - Retry */}
        {canRetry && (
          <Button
            onClick={handleRetry}
            loading={isRetrying}
            loadingText="Retrying connection..."
            variant="primary"
            size="lg"
            icon={<RefreshCw className="h-4 w-4" />}
            className="w-full sm:w-auto"
            aria-describedby="retry-help"
          >
            {retryLabel}
          </Button>
        )}
        
        {/* Secondary Action - Manual Reset */}
        {!canRetry && (
          <Button
            onClick={reset}
            variant="primary"
            size="lg"
            icon={<RefreshCw className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            Reset Page
          </Button>
        )}
        
        {/* Back to Services */}
        <Button
          onClick={handleBack}
          variant="outline"
          size="lg"
          icon={<ChevronLeft className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          Back to Services
        </Button>
        
        {/* Help Documentation */}
        <Button
          onClick={handleHelp}
          variant="ghost"
          size="lg"
          icon={<HelpCircle className="h-4 w-4" />}
          iconRight={<ExternalLink className="h-3 w-3" />}
          className="w-full sm:w-auto"
          aria-label="Open troubleshooting documentation in new tab"
        >
          Get Help
        </Button>
      </div>
      
      {/* Additional Context Information */}
      <div className="mt-8 w-full">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 rounded px-2 py-1"
          aria-expanded={showDetails}
          aria-controls="error-details"
        >
          {showDetails ? 'Hide' : 'Show'} Technical Details
        </button>
        
        {showDetails && (
          <div 
            id="error-details"
            className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-mono text-gray-600 dark:text-gray-400 overflow-x-auto"
          >
            <div className="space-y-2">
              <div><strong>Error Type:</strong> {errorType}</div>
              <div><strong>Severity:</strong> {errorConfig.severity}</div>
              <div><strong>Retryable:</strong> {errorConfig.retryable ? 'Yes' : 'No'}</div>
              {retryCount > 0 && (
                <div><strong>Retry Attempts:</strong> {retryCount}</div>
              )}
              {error.digest && (
                <div><strong>Error ID:</strong> {error.digest}</div>
              )}
              <div><strong>Message:</strong> {error.message}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Screen Reader Helper Text */}
      <div id="retry-help" className="sr-only">
        {canRetry 
          ? `Retry button will attempt to reload the service configuration. ${errorConfig.maxRetries - retryCount} attempts remaining.`
          : 'Retry limit reached. Use Reset Page to refresh the entire page.'
        }
      </div>
    </div>
  );
}