'use client'

/**
 * Next.js Error Boundary Component for Edit Limits Dynamic Route
 * 
 * Implements React 19 error boundary patterns for comprehensive client-side error capture
 * with fallback UI rendering, comprehensive error logging, user-friendly error messages,
 * and retry mechanisms for failed limit data fetching or update operations.
 * 
 * Features:
 * - React 19 error boundary implementation for robust error handling
 * - Next.js error boundary integration with fallback UI rendering
 * - Comprehensive error logging and monitoring integration
 * - WCAG 2.1 AA compliance for error states and recovery mechanisms
 * - User-friendly error recovery with retry mechanisms
 * - Specific handling for 404 errors when limit ID is not found
 * - Development mode error reporting with enhanced debugging information
 * - Integration with React Query error handling for API failures
 * 
 * @fileoverview Error boundary for adf-limits/[id] route
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home, ChevronLeft, Bug } from 'lucide-react'

// ============================================================================
// Error Type Definitions
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
  retryCount: number
  isRetrying: boolean
}

interface LimitErrorDetails {
  type: 'not_found' | 'permission_denied' | 'validation_error' | 'network_error' | 'server_error' | 'unknown'
  statusCode?: number
  message: string
  details?: string
  limitId?: string
  canRetry: boolean
  suggestedActions: string[]
}

// ============================================================================
// Error Analysis and Classification
// ============================================================================

/**
 * Analyzes error details and classifies error types for appropriate handling
 * Implements specific error handling patterns per Section 4.2 error handling
 */
const analyzeError = (error: Error): LimitErrorDetails => {
  const errorMessage = error.message.toLowerCase()
  const stack = error.stack || ''
  
  // Extract potential status codes from error messages
  const statusCodeMatch = errorMessage.match(/(\d{3})/)
  const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1]) : undefined

  // Classify error types based on patterns and status codes
  if (statusCode === 404 || errorMessage.includes('not found') || errorMessage.includes('limit not found')) {
    return {
      type: 'not_found',
      statusCode: 404,
      message: 'The requested limit could not be found.',
      details: 'The limit may have been deleted or the ID is incorrect.',
      canRetry: false,
      suggestedActions: [
        'Return to the limits list',
        'Verify the limit ID is correct',
        'Contact your administrator if the limit should exist'
      ]
    }
  }

  if (statusCode === 403 || errorMessage.includes('permission') || errorMessage.includes('forbidden') || errorMessage.includes('access denied')) {
    return {
      type: 'permission_denied',
      statusCode: 403,
      message: 'You do not have permission to access this limit.',
      details: 'Your current role may not include limit management permissions.',
      canRetry: false,
      suggestedActions: [
        'Contact your administrator for access',
        'Check your role permissions',
        'Return to the dashboard'
      ]
    }
  }

  if (statusCode === 422 || errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return {
      type: 'validation_error',
      statusCode: 422,
      message: 'There was a validation error with the limit data.',
      details: 'The limit configuration contains invalid values.',
      canRetry: true,
      suggestedActions: [
        'Refresh the page to reload limit data',
        'Check for invalid field values',
        'Return to the limits list'
      ]
    }
  }

  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
    return {
      type: 'network_error',
      statusCode: 0,
      message: 'Network connection error occurred.',
      details: 'Unable to connect to the server. Please check your internet connection.',
      canRetry: true,
      suggestedActions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      ]
    }
  }

  if (statusCode && statusCode >= 500) {
    return {
      type: 'server_error',
      statusCode,
      message: 'Server error occurred while loading the limit.',
      details: 'The server encountered an error processing your request.',
      canRetry: true,
      suggestedActions: [
        'Wait a moment and try again',
        'Refresh the page',
        'Contact support if the problem persists'
      ]
    }
  }

  // Default unknown error
  return {
    type: 'unknown',
    statusCode,
    message: 'An unexpected error occurred.',
    details: error.message || 'Please try again or contact support if the problem persists.',
    canRetry: true,
    suggestedActions: [
      'Try refreshing the page',
      'Return to the limits list',
      'Contact support if the problem continues'
    ]
  }
}

/**
 * Generates a unique error ID for tracking and logging
 */
const generateErrorId = (): string => {
  return `limit-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Enhanced error logging with comprehensive context
 * Integrates with Next.js built-in error reporting per Section 3.6
 */
const logError = async (
  error: Error,
  errorInfo: React.ErrorInfo | null,
  errorDetails: LimitErrorDetails,
  errorId: string,
  context: { limitId?: string; userAgent?: string; url?: string }
) => {
  const logData = {
    errorId,
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    errorInfo: {
      componentStack: errorInfo?.componentStack,
    },
    errorDetails,
    context: {
      ...context,
      route: '/adf-limits/[id]',
      userAgent: navigator.userAgent,
      url: window.location.href,
    },
    environment: process.env.NODE_ENV,
  }

  // Log to console in development for enhanced debugging
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Limit Edit Error (${errorId})`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Error Details:', errorDetails)
    console.error('Context:', context)
    console.groupEnd()
  }

  try {
    // Send to error monitoring service (e.g., Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && window.fetch) {
      await fetch('/api/error-reporting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      }).catch(err => {
        console.warn('Failed to send error report:', err)
      })
    }
  } catch (reportingError) {
    console.warn('Error reporting failed:', reportingError)
  }
}

// ============================================================================
// UI Components
// ============================================================================

/**
 * Alert component for displaying error messages
 * Implements WCAG 2.1 AA compliance with proper ARIA attributes
 */
const Alert: React.FC<{
  children: React.ReactNode
  variant?: 'error' | 'warning' | 'info'
  className?: string
}> = ({ children, variant = 'error', className = '' }) => {
  const baseClasses = 'rounded-lg border p-4 shadow-sm'
  const variantClasses = {
    error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200'
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {children}
    </div>
  )
}

/**
 * Button component with loading states and accessibility features
 */
const Button: React.FC<{
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  'aria-label'?: string
}> = ({ 
  onClick, 
  disabled = false, 
  loading = false, 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '',
  'aria-label': ariaLabel
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
  }
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading && (
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}

/**
 * Card component for error content container
 */
const Card: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 ${className}`}>
      {children}
    </div>
  )
}

// ============================================================================
// Main Error Boundary Component
// ============================================================================

/**
 * Next.js Error Boundary for Edit Limits Route
 * Implements comprehensive error handling with recovery mechanisms
 */
export default function LimitEditError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const [state, setState] = useState<ErrorBoundaryState>({
    hasError: true,
    error,
    errorInfo: null,
    errorId: generateErrorId(),
    retryCount: 0,
    isRetrying: false
  })

  const [errorDetails, setErrorDetails] = useState<LimitErrorDetails>(() => analyzeError(error))
  const [showDetails, setShowDetails] = useState(false)

  // Extract limit ID from URL for context
  const limitId = typeof window !== 'undefined' 
    ? window.location.pathname.split('/').pop() 
    : undefined

  // Log error on component mount and when error changes
  useEffect(() => {
    if (error) {
      logError(error, null, errorDetails, state.errorId, { 
        limitId,
        url: window.location.href 
      })
    }
  }, [error, errorDetails, state.errorId, limitId])

  /**
   * Retry mechanism with exponential backoff
   * Implements user-friendly error recovery per Section 4.2.2
   */
  const handleRetry = useCallback(async () => {
    if (!errorDetails.canRetry || state.isRetrying) return

    setState(prev => ({ ...prev, isRetrying: true }))

    try {
      // Clear React Query cache for this route if available
      if (typeof window !== 'undefined' && 'queryClient' in window) {
        const queryClient = (window as any).queryClient
        if (queryClient && typeof queryClient.invalidateQueries === 'function') {
          await queryClient.invalidateQueries({ queryKey: ['limit', limitId] })
        }
      }

      // Wait for a brief moment to prevent rapid retries
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Reset the error boundary
      reset()

      setState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        isRetrying: false
      }))
    } catch (retryError) {
      console.error('Retry failed:', retryError)
      setState(prev => ({ ...prev, isRetrying: false }))
    }
  }, [errorDetails.canRetry, state.isRetrying, limitId, reset])

  /**
   * Navigation handlers for recovery actions
   */
  const handleGoHome = useCallback(() => {
    router.push('/')
  }, [router])

  const handleGoToLimitsList = useCallback(() => {
    router.push('/adf-limits')
  }, [router])

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back()
    } else {
      handleGoToLimitsList()
    }
  }, [router, handleGoToLimitsList])

  /**
   * Toggle error details visibility for debugging
   */
  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev)
  }, [])

  // ============================================================================
  // Render Error UI
  // ============================================================================

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900"
      role="main"
      aria-labelledby="error-title"
    >
      <Card className="w-full max-w-2xl p-6 md:p-8">
        {/* Error Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0">
            <AlertTriangle 
              className="h-8 w-8 text-red-500 dark:text-red-400" 
              aria-hidden="true"
            />
          </div>
          <div className="flex-1">
            <h1 
              id="error-title"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              {errorDetails.type === 'not_found' && 'Limit Not Found'}
              {errorDetails.type === 'permission_denied' && 'Access Denied'}
              {errorDetails.type === 'validation_error' && 'Validation Error'}
              {errorDetails.type === 'network_error' && 'Connection Error'}
              {errorDetails.type === 'server_error' && 'Server Error'}
              {errorDetails.type === 'unknown' && 'Unexpected Error'}
            </h1>
            {limitId && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Limit ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{limitId}</code>
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        <Alert className="mb-6">
          <div className="space-y-2">
            <p className="font-medium">{errorDetails.message}</p>
            {errorDetails.details && (
              <p className="text-sm opacity-90">{errorDetails.details}</p>
            )}
          </div>
        </Alert>

        {/* Suggested Actions */}
        {errorDetails.suggestedActions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              What you can do:
            </h2>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {errorDetails.suggestedActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full mt-2" aria-hidden="true" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {errorDetails.canRetry && (
            <Button
              onClick={handleRetry}
              loading={state.isRetrying}
              disabled={state.retryCount >= 3}
              variant="primary"
              aria-label={state.isRetrying ? 'Retrying...' : 'Retry loading the limit'}
            >
              {state.isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}
          
          <Button
            onClick={handleGoBack}
            variant="secondary"
            aria-label="Go back to previous page"
          >
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Go Back
          </Button>
          
          <Button
            onClick={handleGoToLimitsList}
            variant="outline"
            aria-label="Return to limits list"
          >
            View All Limits
          </Button>
          
          <Button
            onClick={handleGoHome}
            variant="outline"
            aria-label="Return to dashboard home"
          >
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Dashboard
          </Button>
        </div>

        {/* Retry Counter */}
        {state.retryCount > 0 && (
          <div className="mb-4">
            <Alert variant="info">
              <p className="text-sm">
                Retry attempts: {state.retryCount} / 3
                {state.retryCount >= 3 && (
                  <span className="block mt-1 font-medium">
                    Maximum retry attempts reached. Please try a different action or contact support.
                  </span>
                )}
              </p>
            </Alert>
          </div>
        )}

        {/* Developer Information (Development Mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <Button
              onClick={toggleDetails}
              variant="outline"
              size="sm"
              className="mb-4"
              aria-expanded={showDetails}
              aria-controls="error-details"
            >
              <Bug className="mr-2 h-4 w-4" aria-hidden="true" />
              {showDetails ? 'Hide' : 'Show'} Developer Details
            </Button>
            
            {showDetails && (
              <div 
                id="error-details"
                className="space-y-4 text-xs font-mono bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto"
                role="region"
                aria-label="Error details for developers"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Information</h3>
                  <div className="space-y-1 text-gray-700 dark:text-gray-300">
                    <p><strong>Error ID:</strong> {state.errorId}</p>
                    <p><strong>Type:</strong> {errorDetails.type}</p>
                    <p><strong>Status Code:</strong> {errorDetails.statusCode || 'N/A'}</p>
                    <p><strong>Name:</strong> {error.name}</p>
                    <p><strong>Message:</strong> {error.message}</p>
                    {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
                  </div>
                </div>
                
                {error.stack && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Stack Trace</h3>
                    <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-xs overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}