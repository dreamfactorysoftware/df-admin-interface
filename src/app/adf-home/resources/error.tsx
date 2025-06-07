'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, BookOpen, ExternalLink, Home } from 'lucide-react';

/**
 * Error boundary component for the resources page that handles loading failures
 * and provides user-friendly error messages with recovery options.
 * 
 * This component follows Next.js app router error.tsx conventions and implements
 * WCAG 2.1 AA accessibility standards with proper contrast ratios, touch targets,
 * and keyboard navigation support.
 */
export default function ResourcesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for monitoring and debugging
    console.error('Resources page error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Optional: Send error to monitoring service
    // analytics.track('page_error', {
    //   page: 'resources',
    //   error: error.message,
    //   digest: error.digest,
    // });
  }, [error]);

  // Determine error type and provide contextual messaging
  const getErrorContext = () => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Network Connection Error',
        description: 'Unable to load resources content due to a network connectivity issue. Please check your internet connection and try again.',
        icon: AlertTriangle,
        suggestions: [
          'Check your internet connection',
          'Verify network connectivity to DreamFactory services',
          'Try refreshing the page'
        ]
      };
    }
    
    if (message.includes('timeout') || message.includes('slow')) {
      return {
        title: 'Resources Loading Timeout',
        description: 'The resources content is taking longer than expected to load. This may be due to server performance issues.',
        icon: AlertTriangle,
        suggestions: [
          'Wait a moment and try again',
          'Check server performance status',
          'Contact your system administrator if the issue persists'
        ]
      };
    }
    
    if (message.includes('auth') || message.includes('unauthorized')) {
      return {
        title: 'Authentication Required',
        description: 'Your session may have expired or you may not have permission to access these resources.',
        icon: AlertTriangle,
        suggestions: [
          'Try logging in again',
          'Contact your administrator for access permissions',
          'Check if your session has expired'
        ]
      };
    }
    
    // Default error context for resources page
    return {
      title: 'Resources Content Error',
      description: 'Unable to load the resources and documentation content. This could be due to a temporary server issue or data loading problem.',
      icon: BookOpen,
      suggestions: [
        'Try refreshing the page',
        'Check if the documentation server is available',
        'Contact support if the problem continues'
      ]
    };
  };

  const errorContext = getErrorContext();
  const IconComponent = errorContext.icon;

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-white dark:bg-gray-900"
      data-testid="resources-error-boundary"
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon */}
      <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-100 dark:bg-red-900/20">
        <IconComponent 
          className="w-8 h-8 text-red-600 dark:text-red-400" 
          aria-hidden="true"
        />
      </div>

      {/* Error Title */}
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
        {errorContext.title}
      </h1>

      {/* Error Description */}
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl mb-6 leading-relaxed">
        {errorContext.description}
      </p>

      {/* Error Details (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-6 w-full max-w-2xl">
          <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
            Technical Details
          </summary>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
            <div className="font-mono text-red-600 dark:text-red-400 mb-2">
              {error.message}
            </div>
            {error.digest && (
              <div className="text-gray-500 dark:text-gray-400">
                Error ID: {error.digest}
              </div>
            )}
          </div>
        </details>
      )}

      {/* Suggestions List */}
      <div className="mb-8 max-w-2xl">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
          What you can try:
        </h2>
        <ul className="space-y-2">
          {errorContext.suggestions.map((suggestion, index) => (
            <li 
              key={index}
              className="flex items-start text-gray-600 dark:text-gray-400"
            >
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              {suggestion}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {/* Retry Button */}
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white text-base font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-800 transition-colors duration-200 min-h-[44px]"
          aria-describedby="retry-description"
        >
          <RefreshCw className="w-5 h-5 mr-2" aria-hidden="true" />
          Try Again
        </button>
        <span id="retry-description" className="sr-only">
          Reload the resources page content
        </span>

        {/* Go to Home Button */}
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-600 transition-colors duration-200 min-h-[44px]"
          aria-describedby="home-description"
        >
          <Home className="w-5 h-5 mr-2" aria-hidden="true" />
          Go to Dashboard
        </button>
        <span id="home-description" className="sr-only">
          Return to the main dashboard page
        </span>
      </div>

      {/* Additional Help Links */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 text-sm">
        <a
          href="/api-docs"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
          aria-describedby="docs-description"
        >
          <BookOpen className="w-4 h-4 mr-1" aria-hidden="true" />
          View API Documentation
        </a>
        <span id="docs-description" className="sr-only">
          Access the API documentation and guides
        </span>

        <span className="hidden sm:block text-gray-300 dark:text-gray-600">•</span>

        <a
          href="https://wiki.dreamfactory.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
          aria-describedby="help-description"
        >
          <ExternalLink className="w-4 h-4 mr-1" aria-hidden="true" />
          Get Help & Support
        </a>
        <span id="help-description" className="sr-only">
          Open DreamFactory support documentation in a new tab
        </span>
      </div>

      {/* Screen Reader Announcement */}
      <div className="sr-only" aria-live="polite">
        Resources page encountered an error: {errorContext.title}. 
        {errorContext.description} 
        You can try reloading the page or return to the dashboard.
      </div>
    </div>
  );
}