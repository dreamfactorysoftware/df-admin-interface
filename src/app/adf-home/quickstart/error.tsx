/**
 * Error Boundary Component for Quickstart Page
 * 
 * Next.js 15.1 error boundary component that handles runtime errors
 * in the quickstart page with user-friendly recovery options.
 * 
 * Features:
 * - Next.js app router error.tsx conventions
 * - Client-side error handling with 'use client' directive
 * - User-friendly error recovery actions
 * - Tailwind CSS styling with consistent visual hierarchy
 * - Error logging and monitoring integration
 * - WCAG 2.1 AA accessibility compliance
 * - Comprehensive error context for debugging
 */

'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface QuickstartErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorDetails {
  message: string;
  stack?: string;
  digest?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
}

interface ErrorContextInfo {
  component: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'validation' | 'authentication' | 'system' | 'unknown';
}

// ============================================================================
// ERROR CLASSIFICATION UTILITIES
// ============================================================================

/**
 * Classify error type and severity for appropriate handling
 */
function classifyError(error: Error): ErrorContextInfo {
  const errorMessage = error.message.toLowerCase();
  
  // Network-related errors
  if (errorMessage.includes('fetch') || 
      errorMessage.includes('network') || 
      errorMessage.includes('connection')) {
    return {
      component: 'quickstart',
      action: 'network_request',
      severity: 'medium',
      category: 'network'
    };
  }
  
  // Authentication errors
  if (errorMessage.includes('unauthorized') || 
      errorMessage.includes('authentication') || 
      errorMessage.includes('token')) {
    return {
      component: 'quickstart',
      action: 'authentication',
      severity: 'high',
      category: 'authentication'
    };
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || 
      errorMessage.includes('invalid') || 
      errorMessage.includes('required')) {
    return {
      component: 'quickstart',
      action: 'form_validation',
      severity: 'low',
      category: 'validation'
    };
  }
  
  // System errors (default)
  return {
    component: 'quickstart',
    action: 'system_error',
    severity: 'critical',
    category: 'system'
  };
}

/**
 * Generate user-friendly error message based on error type
 */
function getUserFriendlyMessage(errorContext: ErrorContextInfo): string {
  switch (errorContext.category) {
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case 'authentication':
      return 'Your session has expired or you do not have permission to access this feature. Please log in again.';
    case 'validation':
      return 'There was an issue with the data provided. Please review your inputs and try again.';
    case 'system':
    default:
      return 'An unexpected error occurred while loading the quickstart guide. Our team has been notified.';
  }
}

/**
 * Get recovery suggestions based on error type
 */
function getRecoverySuggestions(errorContext: ErrorContextInfo): string[] {
  switch (errorContext.category) {
    case 'network':
      return [
        'Check your internet connection',
        'Refresh the page to retry the request',
        'Try accessing the page later if the issue persists'
      ];
    case 'authentication':
      return [
        'Log out and log back in to refresh your session',
        'Contact your administrator if you believe you should have access',
        'Return to the home page to start over'
      ];
    case 'validation':
      return [
        'Review any form inputs for completeness and correctness',
        'Clear your browser cache and try again',
        'Contact support if the error persists'
      ];
    case 'system':
    default:
      return [
        'Refresh the page to retry loading the content',
        'Clear your browser cache and reload',
        'Contact support if the problem continues'
      ];
  }
}

// ============================================================================
// ERROR LOGGING UTILITY
// ============================================================================

/**
 * Log error details for monitoring and debugging
 * Integrates with application monitoring systems
 */
function logErrorDetails(error: Error, errorContext: ErrorContextInfo): void {
  const errorDetails: ErrorDetails = {
    message: error.message,
    stack: error.stack,
    digest: (error as any).digest,
    timestamp: new Date(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Quickstart Error Details');
    console.error('Error:', error);
    console.table(errorContext);
    console.table(errorDetails);
    console.groupEnd();
  }

  // Log to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    try {
      // Integration point for external monitoring services
      // Example: Sentry, LogRocket, DataDog, etc.
      const monitoringPayload = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          digest: (error as any).digest
        },
        context: errorContext,
        details: errorDetails,
        tags: {
          component: 'quickstart-error-boundary',
          severity: errorContext.severity,
          category: errorContext.category
        }
      };

      // Send to monitoring service
      // This would be replaced with actual monitoring service calls
      console.log('Monitoring payload:', monitoringPayload);
      
    } catch (loggingError) {
      // Fail silently for logging errors to prevent cascade failures
      console.warn('Failed to log error to monitoring service:', loggingError);
    }
  }
}

// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * QuickstartError Component
 * 
 * Error boundary for the quickstart page that provides:
 * - User-friendly error messages
 * - Recovery action buttons
 * - Detailed error information (expandable)
 * - Accessibility features
 * - Error logging integration
 */
export default function QuickstartError({ error, reset }: QuickstartErrorProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);
  
  // Classify error and get context information
  const errorContext = classifyError(error);
  const userMessage = getUserFriendlyMessage(errorContext);
  const suggestions = getRecoverySuggestions(errorContext);

  // Log error details on component mount
  useEffect(() => {
    logErrorDetails(error, errorContext);
  }, [error, errorContext]);

  /**
   * Handle retry action with loading state
   */
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Navigate to home page
   */
  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  /**
   * Open help documentation
   */
  const handleGetHelp = () => {
    if (typeof window !== 'undefined') {
      window.open('/api-docs', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[500px] p-8 max-w-2xl mx-auto"
      data-testid="quickstart-error"
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className="mb-6">
        <div className={cn(
          "p-4 rounded-full",
          errorContext.severity === 'critical' ? "bg-red-100 dark:bg-red-900/20" :
          errorContext.severity === 'high' ? "bg-orange-100 dark:bg-orange-900/20" :
          errorContext.severity === 'medium' ? "bg-yellow-100 dark:bg-yellow-900/20" :
          "bg-blue-100 dark:bg-blue-900/20"
        )}>
          <AlertTriangle 
            className={cn(
              "h-8 w-8",
              errorContext.severity === 'critical' ? "text-red-600 dark:text-red-400" :
              errorContext.severity === 'high' ? "text-orange-600 dark:text-orange-400" :
              errorContext.severity === 'medium' ? "text-yellow-600 dark:text-yellow-400" :
              "text-blue-600 dark:text-blue-400"
            )}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Error Title */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 text-center">
        Quickstart Guide Error
      </h1>

      {/* User-Friendly Error Message */}
      <p className="text-gray-600 dark:text-gray-400 text-center text-lg mb-6 max-w-md leading-relaxed">
        {userMessage}
      </p>

      {/* Recovery Suggestions */}
      <div className="mb-8 w-full max-w-md">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Try these steps:
        </h2>
        <ul className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <li 
              key={index}
              className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <span className="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full mt-2" aria-hidden="true" />
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full max-w-md">
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          loading={isRetrying}
          loadingText="Retrying..."
          variant="default"
          size="lg"
          fullWidth
          leftIcon={<RefreshCw className="h-4 w-4" />}
          aria-describedby="retry-description"
        >
          Try Again
        </Button>
        
        <Button
          onClick={handleGoHome}
          variant="outline"
          size="lg"
          fullWidth
          leftIcon={<Home className="h-4 w-4" />}
          aria-describedby="home-description"
        >
          Go Home
        </Button>
      </div>

      {/* Secondary Actions */}
      <div className="flex gap-4 mb-6">
        <Button
          onClick={handleGetHelp}
          variant="ghost"
          size="sm"
          leftIcon={<HelpCircle className="h-4 w-4" />}
          aria-describedby="help-description"
        >
          Get Help
        </Button>
      </div>

      {/* Technical Details Toggle */}
      <div className="w-full max-w-md">
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="ghost"
          size="sm"
          fullWidth
          rightIcon={showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          aria-expanded={showDetails}
          aria-controls="error-details"
        >
          {showDetails ? 'Hide' : 'Show'} Technical Details
        </Button>

        {/* Collapsible Error Details */}
        {showDetails && (
          <div 
            id="error-details"
            className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            role="region"
            aria-label="Technical error details"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Error Details
            </h3>
            
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Message:</dt>
                <dd className="text-gray-600 dark:text-gray-400 break-words font-mono">
                  {error.message}
                </dd>
              </div>
              
              {(error as any).digest && (
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-300">Error ID:</dt>
                  <dd className="text-gray-600 dark:text-gray-400 font-mono">
                    {(error as any).digest}
                  </dd>
                </div>
              )}
              
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Category:</dt>
                <dd className="text-gray-600 dark:text-gray-400 capitalize">
                  {errorContext.category}
                </dd>
              </div>
              
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Severity:</dt>
                <dd className={cn(
                  "capitalize font-medium",
                  errorContext.severity === 'critical' ? "text-red-600 dark:text-red-400" :
                  errorContext.severity === 'high' ? "text-orange-600 dark:text-orange-400" :
                  errorContext.severity === 'medium' ? "text-yellow-600 dark:text-yellow-400" :
                  "text-blue-600 dark:text-blue-400"
                )}>
                  {errorContext.severity}
                </dd>
              </div>
              
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Time:</dt>
                <dd className="text-gray-600 dark:text-gray-400 font-mono">
                  {new Date().toISOString()}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Screen Reader Only Descriptions */}
      <div className="sr-only">
        <div id="retry-description">
          Reload the quickstart guide and retry the operation
        </div>
        <div id="home-description">
          Return to the DreamFactory admin console homepage
        </div>
        <div id="help-description">
          Open the DreamFactory documentation in a new tab
        </div>
      </div>
    </div>
  );
}