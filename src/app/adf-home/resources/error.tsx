/**
 * Resources Page Error Boundary Component
 * 
 * Next.js error boundary component for the DreamFactory Admin Console resources page.
 * Handles loading failures and provides user-friendly error messages with recovery options.
 * 
 * Features:
 * - Contextual error messages specific to resources page failures
 * - WCAG 2.1 AA compliant with accessible error messaging
 * - Error retry functionality using Next.js error boundary patterns
 * - Tailwind CSS styling replacing Angular Material components
 * - Responsive design with proper semantic HTML structure
 */

'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ExternalLink, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// ERROR BOUNDARY INTERFACES
// ============================================================================

interface ResourcesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface ErrorDetails {
  title: string;
  description: string;
  actionLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ============================================================================
// ERROR TYPE DETECTION
// ============================================================================

/**
 * Analyzes the error to determine the appropriate contextual messaging
 * for resources page specific failures
 */
const getErrorDetails = (error: Error): ErrorDetails => {
  const errorMessage = error.message.toLowerCase();
  
  // Network-related errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
    return {
      title: 'Resources Unavailable',
      description: 'Unable to load DreamFactory resources and documentation links. Please check your internet connection and try again.',
      actionLabel: 'Retry Loading Resources',
      icon: AlertTriangle,
    };
  }
  
  // Data parsing or content errors
  if (errorMessage.includes('parse') || errorMessage.includes('json') || errorMessage.includes('syntax')) {
    return {
      title: 'Content Loading Error',
      description: 'There was an issue loading the resources content. The resource data may be corrupted or unavailable.',
      actionLabel: 'Reload Resources',
      icon: ExternalLink,
    };
  }
  
  // Timeout or performance errors
  if (errorMessage.includes('timeout') || errorMessage.includes('slow') || errorMessage.includes('performance')) {
    return {
      title: 'Loading Timeout',
      description: 'The resources page is taking longer than expected to load. This may be due to network conditions or server response time.',
      actionLabel: 'Try Again',
      icon: RefreshCw,
    };
  }
  
  // Server errors
  if (errorMessage.includes('server') || errorMessage.includes('5')) {
    return {
      title: 'Server Error',
      description: 'The resources page could not be loaded due to a server error. Please try again in a few moments.',
      actionLabel: 'Retry Loading',
      icon: AlertTriangle,
    };
  }
  
  // Generic fallback for unknown errors
  return {
    title: 'Resources Loading Failed',
    description: 'An unexpected error occurred while loading the DreamFactory resources page. Please try refreshing the page.',
    actionLabel: 'Refresh Page',
    icon: AlertTriangle,
  };
};

// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Error boundary component specifically designed for the resources page
 * Provides contextual error messages and recovery actions
 */
export default function ResourcesError({ error, reset }: ResourcesErrorProps) {
  const errorDetails = getErrorDetails(error);
  const IconComponent = errorDetails.icon;

  // Log error details for debugging and monitoring
  useEffect(() => {
    console.error('Resources page error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    });
  }, [error]);

  // Handle retry with additional error recovery logic
  const handleRetry = () => {
    try {
      // Clear any cached data that might be causing issues
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.delete('resources-cache').catch(console.warn);
      }
      
      // Execute the Next.js reset function
      reset();
    } catch (retryError) {
      console.error('Error during retry:', retryError);
      // Fallback: reload the page if reset fails
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  // Navigate back to home page as alternative recovery
  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[600px] p-8 bg-white dark:bg-gray-900"
      data-testid="resources-error-boundary"
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className="flex items-center justify-center w-16 h-16 mb-6 bg-red-100 dark:bg-red-900/20 rounded-full">
        <IconComponent 
          className="w-8 h-8 text-red-600 dark:text-red-400" 
          aria-hidden="true"
        />
      </div>

      {/* Error Content */}
      <div className="text-center max-w-md space-y-4">
        {/* Error Title */}
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {errorDetails.title}
        </h1>

        {/* Error Description */}
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {errorDetails.description}
        </p>

        {/* Technical Error Details (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
              <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-auto">
                {error.message}
                {error.stack && '\n\nStack trace:\n' + error.stack}
                {error.digest && '\n\nError digest: ' + error.digest}
              </pre>
            </div>
          </details>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        {/* Primary Retry Button */}
        <Button
          onClick={handleRetry}
          variant="default"
          size="lg"
          className="min-w-[160px]"
          aria-describedby="retry-description"
        >
          <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
          {errorDetails.actionLabel}
        </Button>

        {/* Secondary Home Button */}
        <Button
          onClick={handleGoHome}
          variant="outline"
          size="lg"
          className="min-w-[160px]"
          aria-describedby="home-description"
        >
          <Home className="w-4 h-4 mr-2" aria-hidden="true" />
          Return to Dashboard
        </Button>
      </div>

      {/* Screen Reader Descriptions */}
      <div className="sr-only">
        <div id="retry-description">
          Attempts to reload the resources page and clear any cached data that may be causing the error
        </div>
        <div id="home-description">
          Returns to the main dashboard page where you can navigate to other sections
        </div>
      </div>

      {/* Additional Help Information */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          If this problem persists, please contact your system administrator or check the{' '}
          <a 
            href="https://docs.dreamfactory.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            aria-label="DreamFactory documentation (opens in new tab)"
          >
            DreamFactory documentation
          </a>
          {' '}for troubleshooting guidance.
        </p>
      </div>
    </div>
  );
}