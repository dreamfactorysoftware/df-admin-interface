'use client'

import React, { useEffect, useState } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

// Error boundary types
interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
  retryAttempted: boolean
}

// Constants for retry logic
const MAX_RETRY_COUNT = 3
const BASE_RETRY_DELAY = 1000 // 1 second
const RETRY_BACKOFF_MULTIPLIER = 2

// Props interface for fallback UI
interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onRetry: () => void
  retryCount: number
  canRetry: boolean
  isRetrying: boolean
}

/**
 * Service Reports Error Fallback UI Component
 * 
 * Provides user-friendly error display with retry mechanisms
 * and error reporting integration for graceful degradation
 */
function ServiceReportsErrorFallback({ 
  error, 
  errorInfo, 
  onRetry, 
  retryCount, 
  canRetry,
  isRetrying 
}: ErrorFallbackProps) {
  const [errorDetails, setErrorDetails] = useState(false)

  // Determine error type and message
  const getErrorDisplayInfo = () => {
    if (!error) {
      return {
        title: 'Service Reports Unavailable',
        message: 'An unexpected error occurred while loading service reports.',
        type: 'general' as const
      }
    }

    const errorMessage = error.message || 'Unknown error'
    
    // Categorize common error types
    if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      return {
        title: 'Network Connection Error',
        message: 'Unable to connect to the service reports API. Please check your network connection.',
        type: 'network' as const
      }
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return {
        title: 'Authentication Required',
        message: 'Your session may have expired. Please refresh the page to log in again.',
        type: 'auth' as const
      }
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to view service reports. Contact your administrator.',
        type: 'permission' as const
      }
    }
    
    if (errorMessage.includes('500') || errorMessage.includes('Server')) {
      return {
        title: 'Server Error',
        message: 'The service reports system is temporarily unavailable. Please try again later.',
        type: 'server' as const
      }
    }

    return {
      title: 'Service Reports Error',
      message: errorMessage,
      type: 'general' as const
    }
  }

  const { title, message, type } = getErrorDisplayInfo()

  // Error reporting - Log error for monitoring
  useEffect(() => {
    if (error) {
      // Basic error logging - will integrate with error-reporting.ts when available
      console.error('Service Reports Error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        retryCount,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })

      // TODO: Integrate with error-reporting.ts service when available
      // errorReportingService.report({
      //   error,
      //   context: 'service-reports',
      //   severity: 'high',
      //   metadata: { retryCount, errorInfo }
      // })
    }
  }, [error, errorInfo, retryCount])

  return (
    <div className="min-h-96 flex items-center justify-center p-6" role="alert" aria-live="polite">
      <div className="max-w-lg w-full">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-8">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className={`rounded-full p-3 ${
              type === 'network' ? 'bg-orange-100 dark:bg-orange-900/20' :
              type === 'auth' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
              type === 'permission' ? 'bg-red-100 dark:bg-red-900/20' :
              'bg-red-100 dark:bg-red-900/20'
            }`}>
              <ExclamationTriangleIcon className={`h-8 w-8 ${
                type === 'network' ? 'text-orange-600 dark:text-orange-400' :
                type === 'auth' ? 'text-yellow-600 dark:text-yellow-400' :
                type === 'permission' ? 'text-red-600 dark:text-red-400' :
                'text-red-600 dark:text-red-400'
              }`} />
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Retry Button */}
            {canRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label={isRetrying ? 'Retrying...' : `Retry loading service reports (${retryCount}/${MAX_RETRY_COUNT} attempts)`}
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            )}

            {/* Refresh Page Button */}
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Refresh Page
            </button>

            {/* Additional Help Actions */}
            {type === 'permission' && (
              <button
                onClick={() => window.location.href = '/admin-settings'}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Go to Admin Settings
              </button>
            )}

            {type === 'auth' && (
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Sign In Again
              </button>
            )}
          </div>

          {/* Error Details Toggle */}
          {error && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setErrorDetails(!errorDetails)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {errorDetails ? 'Hide' : 'Show'} Error Details
              </button>
              
              {errorDetails && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div className="mb-2">
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs">{error.stack}</pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs">{errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Retry Count Information */}
          {retryCount > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Retry attempts: {retryCount} of {MAX_RETRY_COUNT}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * React Error Boundary Class Component for Service Reports
 * 
 * Implements comprehensive error catching with:
 * - React Error Boundary integration per Section 4.2.1.1
 * - Exponential backoff retry mechanisms per Section 4.2.1
 * - Error reporting and recovery options per React/Next.js Integration Requirements
 * - Graceful degradation and optimal user experience per Section 4.2.1
 */
export default class ServiceReportsErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: React.PropsWithChildren<{}>) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      retryAttempted: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error information
    console.error('Service Reports Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
  }

  componentWillUnmount() {
    // Clean up timeout if component unmounts
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  /**
   * Retry mechanism with exponential backoff
   * Implements retry logic per Section 4.2.1 error handling flowchart
   */
  handleRetry = () => {
    const { retryCount } = this.state

    if (retryCount >= MAX_RETRY_COUNT) {
      return
    }

    // Calculate delay with exponential backoff
    const delay = BASE_RETRY_DELAY * Math.pow(RETRY_BACKOFF_MULTIPLIER, retryCount)

    this.setState({
      retryAttempted: true
    })

    // Set timeout for retry with exponential backoff
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        retryAttempted: false
      })
    }, delay)
  }

  render() {
    const { hasError, error, errorInfo, retryCount, retryAttempted } = this.state
    const { children } = this.props

    if (hasError) {
      const canRetry = retryCount < MAX_RETRY_COUNT

      return (
        <ServiceReportsErrorFallback
          error={error}
          errorInfo={errorInfo}
          onRetry={this.handleRetry}
          retryCount={retryCount}
          canRetry={canRetry}
          isRetrying={retryAttempted}
        />
      )
    }

    return children
  }
}

// Named export for specific use cases
export { ServiceReportsErrorBoundary, ServiceReportsErrorFallback }

// Additional utility types for integration with error reporting service
export interface ServiceReportsErrorContext {
  component: 'service-reports'
  route: '/system-settings/reports'
  retryCount: number
  userAgent: string
  timestamp: string
}

export interface ServiceReportsErrorReport {
  error: Error
  context: ServiceReportsErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, unknown>
}