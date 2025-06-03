'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronLeft } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Route-level error boundary component for Next.js app router
 * 
 * Handles and displays error states with user-friendly messaging and recovery options.
 * Implements comprehensive error handling with logging, user feedback, and graceful 
 * degradation patterns using React 19 error boundary capabilities.
 * 
 * Features:
 * - React 19 error boundary integration for comprehensive client-side error capture
 * - User-friendly error messaging with recovery options
 * - Error logging and reporting integration
 * - Tailwind CSS styled interface replacing Angular Material components
 * - Accessibility compliant with WCAG 2.1 AA standards
 * - Retry mechanisms and navigation fallbacks
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error for monitoring and debugging
    // This replaces the Angular error service pattern with modern error reporting
    const logError = async () => {
      try {
        // In a real implementation, this would integrate with error-logger.ts
        // For now, we'll use console.error as a fallback
        console.error('Route Error Boundary - Error caught:', {
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })

        // Send error to monitoring service (e.g., Sentry, LogRocket, etc.)
        // This would typically use the error-logger.ts service when available
        if (typeof window !== 'undefined' && 'fetch' in window) {
          // Example monitoring endpoint - replace with actual service
          fetch('/api/v2/system/error-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              error: {
                message: error.message,
                stack: error.stack,
                digest: error.digest
              },
              context: {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                component: 'route-error-boundary'
              }
            })
          }).catch(logError => {
            // Silently fail error reporting to avoid infinite loops
            console.warn('Failed to report error to monitoring service:', logError)
          })
        }
      } catch (logError) {
        // Prevent error logging from causing additional errors
        console.warn('Error in error logging:', logError)
      }
    }

    logError()
  }, [error])

  // Determine error type and appropriate messaging
  const getErrorDetails = () => {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        suggestion: 'This might be a temporary network issue. Retrying often resolves the problem.',
        retryRecommended: true
      }
    }
    
    if (message.includes('timeout')) {
      return {
        title: 'Request Timeout',
        description: 'The request took too long to complete. Please try again.',
        suggestion: 'The server might be experiencing high load. Please wait a moment before retrying.',
        retryRecommended: true
      }
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        title: 'Access Denied',
        description: 'You do not have permission to access this resource.',
        suggestion: 'Please contact your administrator if you believe this is an error.',
        retryRecommended: false
      }
    }
    
    if (message.includes('not found')) {
      return {
        title: 'Resource Not Found',
        description: 'The requested resource could not be found.',
        suggestion: 'The page or resource you\'re looking for might have been moved or deleted.',
        retryRecommended: false
      }
    }
    
    // Default error handling
    return {
      title: 'Something went wrong',
      description: 'An unexpected error has occurred while loading this page.',
      suggestion: 'This error has been logged and our team has been notified. Please try refreshing the page.',
      retryRecommended: true
    }
  }

  const errorDetails = getErrorDetails()

  const handleRetry = () => {
    // Reset the error boundary to retry the failed operation
    reset()
  }

  const handleGoHome = () => {
    // Navigate to the home page
    window.location.href = '/'
  }

  const handleGoBack = () => {
    // Navigate back to the previous page
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Error Icon and Title */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle 
              className="w-8 h-8 text-red-600 dark:text-red-400" 
              aria-hidden="true"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {errorDetails.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {errorDetails.description}
          </p>
        </div>

        {/* Error Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                What can you do?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {errorDetails.suggestion}
              </p>
            </div>

            {/* Development mode error details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                  Error Details (Development Mode)
                </summary>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-auto">
                  <div className="space-y-2">
                    <div>
                      <strong>Message:</strong> {error.message}
                    </div>
                    {error.digest && (
                      <div>
                        <strong>Digest:</strong> {error.digest}
                      </div>
                    )}
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {errorDetails.retryRecommended && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
              aria-label="Retry the failed operation"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Try Again
            </button>
          )}
          
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
            aria-label="Go back to the previous page"
          >
            <ChevronLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Go Back
          </button>
          
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors"
            aria-label="Go to the dashboard home page"
          >
            <Home className="w-4 h-4 mr-2" aria-hidden="true" />
            Dashboard Home
          </button>
        </div>

        {/* Support Information */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If this problem persists, please contact your administrator or check the{' '}
            <a 
              href="/admin-settings/system-info" 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline"
            >
              system status
            </a>
            {' '}for more information.
          </p>
        </div>
      </div>
    </div>
  )
}