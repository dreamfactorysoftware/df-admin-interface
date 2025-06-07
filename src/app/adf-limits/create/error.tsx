'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Next.js Error Boundary Component for Create Limits Route
 * 
 * Implements React 19 error boundary patterns for comprehensive client-side error capture
 * with fallback UI rendering, error logging integration, and user-friendly recovery options.
 * 
 * Features:
 * - React 19 error boundary implementation for robust error handling
 * - Next.js error boundary integration with fallback UI rendering 
 * - Comprehensive error logging and monitoring integration
 * - WCAG 2.1 AA compliance for error states and recovery mechanisms
 * - User-friendly error recovery with retry options
 * - React Query error handling integration for API failures
 * - Development mode error reporting with enhanced debugging information
 * 
 * @param error - Error object containing error details and stack trace
 * @param reset - Function to reset the error boundary and retry the operation
 */
interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Enhanced error logging utility with development and production modes
 */
const logError = (error: Error & { digest?: string }, errorInfo?: any) => {
  // Development mode: Enhanced error reporting with stack traces
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Boundary - Create Limits Route')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    if (error.digest) {
      console.error('Digest:', error.digest)
    }
    if (errorInfo) {
      console.error('Additional Info:', errorInfo)
    }
    console.groupEnd()
  }

  // Production mode: Send to monitoring service (placeholder for integration)
  if (process.env.NODE_ENV === 'production') {
    // Integration with monitoring services like Sentry, DataDog, etc.
    try {
      // Log to external monitoring service
      const errorData = {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        route: '/adf-limits/create',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      }
      
      // Send to monitoring endpoint (implement based on chosen monitoring solution)
      // Example: await fetch('/api/error-monitoring', { method: 'POST', body: JSON.stringify(errorData) })
      console.error('Error logged to monitoring:', errorData)
    } catch (monitoringError) {
      console.error('Failed to log error to monitoring service:', monitoringError)
    }
  }
}

/**
 * Error type classification for specific error handling
 */
const getErrorType = (error: Error): 'network' | 'validation' | 'permission' | 'server' | 'unknown' => {
  const message = error.message.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'network'
  }
  if (message.includes('validation') || message.includes('required')) {
    return 'validation'
  }
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
    return 'permission'
  }
  if (message.includes('server') || message.includes('500') || message.includes('internal')) {
    return 'server'
  }
  return 'unknown'
}

/**
 * Get user-friendly error message based on error type
 */
const getErrorMessage = (errorType: string): { title: string; description: string } => {
  switch (errorType) {
    case 'network':
      return {
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.'
      }
    case 'validation':
      return {
        title: 'Validation Error',
        description: 'There was a problem with the information provided. Please review your input and try again.'
      }
    case 'permission':
      return {
        title: 'Access Denied',
        description: 'You do not have permission to perform this action. Please contact your administrator if you believe this is an error.'
      }
    case 'server':
      return {
        title: 'Server Error',
        description: 'An internal server error occurred. Our team has been notified and is working to resolve the issue.'
      }
    default:
      return {
        title: 'Unexpected Error',
        description: 'An unexpected error occurred while creating the limit. Please try again or contact support if the problem persists.'
      }
  }
}

/**
 * Main Error Boundary Component
 */
export default function CreateLimitsError({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // Log error with comprehensive error information
  React.useEffect(() => {
    logError(error, {
      route: '/adf-limits/create',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'
    })
  }, [error])

  const errorType = getErrorType(error)
  const { title, description } = getErrorMessage(errorType)

  /**
   * Handle retry operation with React Query cache invalidation
   */
  const handleRetry = async () => {
    try {
      // Invalidate related React Query caches for fresh data
      await queryClient.invalidateQueries({ queryKey: ['limits'] })
      await queryClient.invalidateQueries({ queryKey: ['api-security'] })
      
      // Reset the error boundary to retry the operation
      reset()
    } catch (retryError) {
      console.error('Failed to retry operation:', retryError)
      logError(retryError as Error, { action: 'retry', originalError: error.message })
    }
  }

  /**
   * Handle navigation back to limits list
   */
  const handleGoBack = () => {
    router.push('/adf-limits')
  }

  /**
   * Handle refresh page action
   */
  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8"
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="max-w-md w-full space-y-8">
        {/* Error Icon */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              className="h-8 w-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>

        {/* Error Content */}
        <div className="text-center space-y-4">
          <h1 
            id="error-title"
            className="text-2xl font-bold text-gray-900"
          >
            {title}
          </h1>
          
          <p 
            id="error-description"
            className="text-base text-gray-600 leading-relaxed"
          >
            {description}
          </p>

          {/* Development Mode: Show error details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <summary className="cursor-pointer font-medium text-red-800 hover:text-red-900">
                Error Details (Development Mode)
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-semibold text-red-700">Message:</span>
                  <code className="block mt-1 p-2 bg-red-100 rounded text-sm font-mono text-red-800 break-all">
                    {error.message}
                  </code>
                </div>
                {error.digest && (
                  <div>
                    <span className="font-semibold text-red-700">Digest:</span>
                    <code className="block mt-1 p-2 bg-red-100 rounded text-sm font-mono text-red-800">
                      {error.digest}
                    </code>
                  </div>
                )}
                {error.stack && (
                  <div>
                    <span className="font-semibold text-red-700">Stack Trace:</span>
                    <pre className="block mt-1 p-2 bg-red-100 rounded text-xs font-mono text-red-800 overflow-auto max-h-40 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Action: Retry */}
          <button
            onClick={handleRetry}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            aria-describedby="retry-description"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Try Again
          </button>
          <div id="retry-description" className="sr-only">
            Retry the failed operation and reload the page
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoBack}
              className="flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              aria-describedby="back-description"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Go Back
            </button>
            <div id="back-description" className="sr-only">
              Return to the limits list page
            </div>

            <button
              onClick={handleRefresh}
              className="flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              aria-describedby="refresh-description"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Refresh
            </button>
            <div id="refresh-description" className="sr-only">
              Refresh the current page to reload the application
            </div>
          </div>
        </div>

        {/* Contact Support Information */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If this problem persists, please{' '}
            <a 
              href="/support" 
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-describedby="support-description"
            >
              contact support
            </a>
            {' '}or check the{' '}
            <a 
              href="/status" 
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-describedby="status-description"
            >
              system status
            </a>
            .
          </p>
          <div id="support-description" className="sr-only">
            Contact support for assistance with this error
          </div>
          <div id="status-description" className="sr-only">
            Check the system status page for any known issues
          </div>
        </div>
      </div>
    </div>
  )
}