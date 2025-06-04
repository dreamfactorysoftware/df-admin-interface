'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, ArrowLeft, Home, Bug } from 'lucide-react'

// Types for error handling
interface ErrorInfo {
  componentStack?: string
  errorBoundary?: string
}

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Enhanced error categorization for better user experience
type ErrorCategory = 'network' | 'permission' | 'not_found' | 'validation' | 'server' | 'unknown'

interface ErrorDetails {
  category: ErrorCategory
  title: string
  message: string
  userMessage: string
  recoveryActions: string[]
  showTechnicalDetails: boolean
}

/**
 * Categorizes errors based on error message and properties
 * Implements comprehensive error analysis per Section 4.2.1.1 error boundary implementation
 */
function categorizeError(error: Error): ErrorDetails {
  const message = error.message.toLowerCase()
  const name = error.name.toLowerCase()

  // Check for 404/Not Found errors
  if (message.includes('not found') || message.includes('404') || name.includes('notfound')) {
    return {
      category: 'not_found',
      title: 'Limit Configuration Not Found',
      message: 'The requested limit configuration could not be found.',
      userMessage: 'The limit you\'re trying to access may have been deleted or the URL may be incorrect.',
      recoveryActions: ['Return to limits list', 'Check the URL for typos'],
      showTechnicalDetails: false
    }
  }

  // Check for permission errors
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden') || message.includes('403')) {
    return {
      category: 'permission',
      title: 'Access Denied',
      message: 'You don\'t have permission to access this limit configuration.',
      userMessage: 'Your current role doesn\'t allow editing this limit. Contact your administrator for access.',
      recoveryActions: ['Return to previous page', 'Contact administrator'],
      showTechnicalDetails: false
    }
  }

  // Check for network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection') || name.includes('networkerror')) {
    return {
      category: 'network',
      title: 'Connection Error',
      message: 'Unable to connect to the server.',
      userMessage: 'Please check your internet connection and try again.',
      recoveryActions: ['Check internet connection', 'Try again in a few moments'],
      showTechnicalDetails: false
    }
  }

  // Check for validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return {
      category: 'validation',
      title: 'Invalid Data',
      message: 'The limit configuration contains invalid data.',
      userMessage: 'Some fields contain invalid values. Please review and correct them.',
      recoveryActions: ['Review form fields', 'Check for missing required fields'],
      showTechnicalDetails: false
    }
  }

  // Check for server errors
  if (message.includes('500') || message.includes('server') || name.includes('servererror')) {
    return {
      category: 'server',
      title: 'Server Error',
      message: 'An internal server error occurred.',
      userMessage: 'Something went wrong on our end. Our team has been notified.',
      recoveryActions: ['Try again later', 'Contact support if the problem persists'],
      showTechnicalDetails: true
    }
  }

  // Default unknown error
  return {
    category: 'unknown',
    title: 'Unexpected Error',
    message: 'An unexpected error occurred.',
    userMessage: 'Something unexpected happened. Please try again or contact support.',
    recoveryActions: ['Try refreshing the page', 'Contact support'],
    showTechnicalDetails: true
  }
}

/**
 * Logs error details for monitoring and debugging
 * Integrates with Next.js built-in error reporting per Section 3.6 monitoring and logging
 */
function logError(error: Error, errorInfo: ErrorInfo, errorDetails: ErrorDetails) {
  const errorReport = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: (error as any).digest
    },
    errorInfo,
    category: errorDetails.category,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userId: typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null
  }

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Boundary Triggered')
    console.error('Error Details:', errorReport)
    console.groupEnd()
  }

  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // This would integrate with your monitoring service (e.g., Sentry, DataDog)
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    }).catch(reportingError => {
      console.error('Failed to report error:', reportingError)
    })
  }
}

/**
 * Error recovery component with retry mechanisms
 * Implements user-friendly error recovery per Section 4.2.2 form validation flow
 */
function ErrorRecoveryActions({ 
  onRetry, 
  errorDetails, 
  limitId 
}: { 
  onRetry: () => void
  errorDetails: ErrorDetails
  limitId?: string
}) {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  const handleGoToLimitsList = () => {
    router.push('/adf-limits')
  }

  const handleGoHome = () => {
    router.push('/adf-home')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-6">
      {/* Primary action: Retry (if applicable) */}
      {errorDetails.category !== 'not_found' && errorDetails.category !== 'permission' && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="Retry loading the limit configuration"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}

      {/* Secondary actions */}
      <button
        onClick={handleGoBack}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        aria-label="Go back to previous page"
      >
        <ArrowLeft className="h-4 w-4" />
        Go Back
      </button>

      <button
        onClick={handleGoToLimitsList}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors border border-gray-300"
        aria-label="Return to limits list"
      >
        View All Limits
      </button>

      <button
        onClick={handleGoHome}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors border border-gray-300"
        aria-label="Go to homepage"
      >
        <Home className="h-4 w-4" />
        Home
      </button>
    </div>
  )
}

/**
 * Technical error details component for development and debugging
 * Provides enhanced debugging information per Section 3.6 quality assurance
 */
function TechnicalErrorDetails({ 
  error, 
  errorDetails 
}: { 
  error: Error
  errorDetails: ErrorDetails
}) {
  if (!errorDetails.showTechnicalDetails && process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <details className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
      <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center gap-2 hover:text-gray-900">
        <Bug className="h-4 w-4" />
        Technical Details
        <span className="text-xs text-gray-500">(for debugging)</span>
      </summary>
      <div className="mt-3 space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Error Type:</h4>
          <p className="text-sm text-gray-600 font-mono">{error.name}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">Error Message:</h4>
          <p className="text-sm text-gray-600 font-mono">{error.message}</p>
        </div>
        {(error as any).digest && (
          <div>
            <h4 className="text-sm font-medium text-gray-900">Error Digest:</h4>
            <p className="text-sm text-gray-600 font-mono">{(error as any).digest}</p>
          </div>
        )}
        {process.env.NODE_ENV === 'development' && error.stack && (
          <div>
            <h4 className="text-sm font-medium text-gray-900">Stack Trace:</h4>
            <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    </details>
  )
}

/**
 * Main error boundary component for limit edit page
 * Implements React 19 error boundary patterns per Section 4.2.1.1 error boundary implementation
 */
export default function LimitEditError({ error, reset }: ErrorPageProps) {
  const router = useRouter()
  const errorDetails = categorizeError(error)

  // Extract limit ID from URL if available
  const limitId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/').pop() 
    : undefined

  // Log error for monitoring and debugging
  useEffect(() => {
    logError(error, {}, errorDetails)
  }, [error, errorDetails])

  // Icon selection based on error category
  const getErrorIcon = () => {
    switch (errorDetails.category) {
      case 'not_found':
        return <AlertTriangle className="h-12 w-12 text-amber-500" aria-hidden="true" />
      case 'permission':
        return <AlertTriangle className="h-12 w-12 text-red-500" aria-hidden="true" />
      case 'network':
        return <AlertTriangle className="h-12 w-12 text-orange-500" aria-hidden="true" />
      default:
        return <AlertTriangle className="h-12 w-12 text-red-500" aria-hidden="true" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-lg font-semibold text-gray-900">
              Limit Configuration Error
            </h1>
            <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
              <span>Limits</span>
              <span className="mx-2">›</span>
              <span>{limitId || 'Unknown'}</span>
              <span className="mx-2">›</span>
              <span className="text-red-600">Error</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main error content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full">
          {/* Error card */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            {/* Error icon and title */}
            <div className="flex flex-col items-center text-center mb-6">
              {getErrorIcon()}
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {errorDetails.title}
              </h2>
            </div>

            {/* Error message */}
            <div className="mb-6">
              <div 
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm text-red-800">
                  {errorDetails.userMessage}
                </p>
              </div>
            </div>

            {/* Recovery suggestions */}
            {errorDetails.recoveryActions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  What you can do:
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {errorDetails.recoveryActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recovery actions */}
            <ErrorRecoveryActions 
              onRetry={reset}
              errorDetails={errorDetails}
              limitId={limitId}
            />

            {/* Technical details */}
            <TechnicalErrorDetails 
              error={error}
              errorDetails={errorDetails}
            />
          </div>

          {/* Additional help */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact{' '}
              <a 
                href="mailto:support@dreamfactory.com" 
                className="text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                support@dreamfactory.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-500 text-center">
            DreamFactory Admin Interface - Error Recovery System
          </p>
        </div>
      </footer>
    </div>
  )
}