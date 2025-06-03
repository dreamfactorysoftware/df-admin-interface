'use client'

import React, { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft, Home, HelpCircle, Bug, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Next.js Error Boundary Component for Field Creation Page
 * 
 * Provides comprehensive error handling for the field creation workflow with:
 * - React Error Boundary integration with graceful degradation
 * - WCAG 2.1 AA compliant accessibility features
 * - Tailwind CSS 4.1+ styling with consistent theme support
 * - Manual retry options and navigation alternatives
 * - Diagnostic information display for debugging
 * - Error recovery workflows per Section 4.6.5 Error Handling and Recovery Data Flow
 */

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Enhanced error classification for better user experience
 */
const getErrorType = (error: Error): {
  type: 'validation' | 'network' | 'server' | 'client' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
} => {
  const message = error.message.toLowerCase()
  
  if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
    return { type: 'validation', severity: 'low' }
  }
  
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return { type: 'network', severity: 'medium' }
  }
  
  if (message.includes('server') || message.includes('500') || message.includes('503')) {
    return { type: 'server', severity: 'high' }
  }
  
  if (message.includes('syntax') || message.includes('reference') || message.includes('type')) {
    return { type: 'client', severity: 'medium' }
  }
  
  return { type: 'unknown', severity: 'critical' }
}

/**
 * Get user-friendly error messages based on error type
 */
const getErrorDetails = (errorType: ReturnType<typeof getErrorType>) => {
  switch (errorType.type) {
    case 'validation':
      return {
        title: 'Field Validation Error',
        description: 'There was an issue with the field configuration. Please review your input and try again.',
        icon: AlertTriangle,
        suggestions: [
          'Check that all required fields are completed',
          'Verify field names follow the naming conventions',
          'Ensure data types are compatible with your database',
          'Review field length and constraint settings'
        ]
      }
    
    case 'network':
      return {
        title: 'Connection Error',
        description: 'Unable to connect to the database service. This may be a temporary network issue.',
        icon: AlertTriangle,
        suggestions: [
          'Check your internet connection',
          'Verify the database service is running',
          'Try refreshing the page and retry',
          'Contact your administrator if the issue persists'
        ]
      }
    
    case 'server':
      return {
        title: 'Server Error',
        description: 'The server encountered an error while processing your request.',
        icon: Bug,
        suggestions: [
          'Wait a moment and try again',
          'Check if other services are working',
          'Contact support if the error continues',
          'Report this issue with the error details below'
        ]
      }
    
    case 'client':
      return {
        title: 'Application Error',
        description: 'An unexpected error occurred in the application.',
        icon: AlertTriangle,
        suggestions: [
          'Refresh the page to clear the error',
          'Try using a different browser',
          'Clear your browser cache and cookies',
          'Report this issue to the development team'
        ]
      }
    
    default:
      return {
        title: 'Unexpected Error',
        description: 'An unknown error occurred while creating the field.',
        icon: HelpCircle,
        suggestions: [
          'Try refreshing the page',
          'Return to the previous step',
          'Contact technical support',
          'Report this error with the details shown below'
        ]
      }
  }
}

export default function FieldCreationError({ error, reset }: ErrorPageProps) {
  const router = useRouter()
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [retryAttempted, setRetryAttempted] = useState(false)
  
  const errorClassification = getErrorType(error)
  const errorDetails = getErrorDetails(errorClassification)
  const IconComponent = errorDetails.icon

  // Log error for monitoring (per Section 4.6.5 Error Handling and Recovery Data Flow)
  useEffect(() => {
    console.error('Field creation error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      location: '/adf-schema/fields/new',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      classification: errorClassification
    })
  }, [error, errorClassification])

  /**
   * Enhanced retry functionality with backoff strategy
   */
  const handleRetry = () => {
    setRetryAttempted(true)
    setRetryCount(prev => prev + 1)
    
    // Implement exponential backoff for network errors
    if (errorClassification.type === 'network' && retryCount > 0) {
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000)
      setTimeout(() => {
        reset()
      }, delay)
    } else {
      reset()
    }
  }

  /**
   * Navigate back to field list with error context
   */
  const handleGoBack = () => {
    router.back()
  }

  /**
   * Navigate to schema overview
   */
  const handleGoToSchema = () => {
    // Extract service ID from current path if possible
    const pathSegments = window.location.pathname.split('/')
    const serviceIndex = pathSegments.indexOf('adf-schema')
    
    if (serviceIndex >= 0 && pathSegments[serviceIndex - 1]) {
      router.push(`/adf-schema`)
    } else {
      router.push('/api-connections/database')
    }
  }

  /**
   * Severity-based styling for error indicators
   */
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100'
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-900 dark:text-orange-100'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100'
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Error Display */}
        <div 
          className={`rounded-lg border-2 p-8 text-center ${getSeverityStyles(errorClassification.severity)}`}
          role="alert"
          aria-live="assertive"
          aria-labelledby="error-title"
          aria-describedby="error-description"
        >
          <div className="flex flex-col items-center space-y-4">
            <IconComponent 
              className="h-16 w-16" 
              aria-hidden="true"
            />
            
            <div className="space-y-2">
              <h1 
                id="error-title"
                className="text-2xl font-bold"
              >
                {errorDetails.title}
              </h1>
              
              <p 
                id="error-description"
                className="text-lg opacity-90"
              >
                {errorDetails.description}
              </p>
            </div>

            {/* Error Classification Badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/50 dark:bg-black/50">
              <span className="sr-only">Error type:</span>
              {errorClassification.type.charAt(0).toUpperCase() + errorClassification.type.slice(1)} Error
              <span className="ml-2 text-xs opacity-75">
                ({errorClassification.severity.toUpperCase()})
              </span>
            </div>
          </div>
        </div>

        {/* Recovery Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Recovery Options
          </h2>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleRetry}
              disabled={retryAttempted && retryCount >= 3}
              className="inline-flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-describedby={retryCount > 0 ? "retry-help" : undefined}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${retryAttempted ? 'animate-spin' : ''}`} />
              {retryCount > 0 ? `Retry (${retryCount}/3)` : 'Try Again'}
            </button>

            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>

          {retryCount > 0 && (
            <p id="retry-help" className="text-sm text-gray-600 dark:text-gray-400">
              {retryCount >= 3 
                ? 'Maximum retry attempts reached. Please try alternative options below.'
                : 'If the error persists, consider the alternative options below.'
              }
            </p>
          )}

          {/* Navigation Alternatives */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Alternative Actions
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleGoToSchema}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Schema
              </button>

              <Link
                href="/api-connections/database"
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <Home className="h-4 w-4 mr-2" />
                Database Services
              </Link>
            </div>
          </div>

          {/* Helpful Suggestions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Troubleshooting Tips
            </h3>
            
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              {errorDetails.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0" aria-hidden="true" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Diagnostic Information (Collapsible) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset rounded-lg transition-colors duration-200"
            aria-expanded={showDiagnostics}
            aria-controls="diagnostic-details"
          >
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Diagnostic Information
            </span>
            {showDiagnostics ? (
              <ChevronUp className="h-5 w-5 text-gray-500" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" aria-hidden="true" />
            )}
          </button>

          {showDiagnostics && (
            <div 
              id="diagnostic-details"
              className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Error Details
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 text-sm font-mono">
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Type:</span>{' '}
                        <span className="text-gray-900 dark:text-gray-100">{errorClassification.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Severity:</span>{' '}
                        <span className="text-gray-900 dark:text-gray-100">{errorClassification.severity}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Message:</span>{' '}
                        <span className="text-gray-900 dark:text-gray-100">{error.message}</span>
                      </div>
                      {error.digest && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Digest:</span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">{error.digest}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>{' '}
                        <span className="text-gray-900 dark:text-gray-100">{new Date().toISOString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Location:</span>{' '}
                        <span className="text-gray-900 dark:text-gray-100">/adf-schema/fields/new</span>
                      </div>
                    </div>
                  </div>
                </div>

                {error.stack && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Stack Trace
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 text-xs font-mono max-h-48 overflow-y-auto">
                      <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <strong>Note:</strong> This diagnostic information can help technical support 
                    resolve the issue. Please include this information when reporting the error.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Support Information */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            If you continue to experience issues, please contact{' '}
            <a 
              href="mailto:support@dreamfactory.com" 
              className="text-primary-600 hover:text-primary-700 underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
            >
              technical support
            </a>{' '}
            with the diagnostic information above.
          </p>
        </div>
      </div>
    </div>
  )
}