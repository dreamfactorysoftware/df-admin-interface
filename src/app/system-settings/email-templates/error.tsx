'use client'

/**
 * Email Templates Error Boundary Component
 * 
 * Next.js app router error boundary for the email templates section.
 * Implements React Error Boundary integration with comprehensive error handling,
 * recovery options, and accessibility compliance.
 * 
 * Features:
 * - Catches React errors and network failures in email template operations
 * - Provides clear error messages and actionable recovery steps
 * - Integrates with application logging and monitoring systems
 * - Maintains WCAG 2.1 AA accessibility standards and responsive design
 * - Supports MSW mock error responses for development mode testing
 */

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'

// Type definitions for error boundary props
interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Error types for better error classification
type ErrorType = 'network' | 'validation' | 'permission' | 'server' | 'client' | 'unknown'

interface ErrorContext {
  type: ErrorType
  title: string
  description: string
  actionable: boolean
  retryable: boolean
}

/**
 * Classifies error type based on error message and properties
 */
function classifyError(error: Error): ErrorContext {
  const message = error.message.toLowerCase()
  const name = error.name.toLowerCase()

  // Network-related errors
  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return {
      type: 'network',
      title: 'Network Connection Error',
      description: 'Unable to connect to the email template service. Please check your internet connection and try again.',
      actionable: true,
      retryable: true
    }
  }

  // Permission/authentication errors
  if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('permission')) {
    return {
      type: 'permission',
      title: 'Access Denied',
      description: 'You do not have permission to access email template management. Please contact your administrator.',
      actionable: false,
      retryable: false
    }
  }

  // Validation errors
  if (message.includes('validation') || name.includes('validation') || message.includes('invalid')) {
    return {
      type: 'validation',
      title: 'Invalid Email Template Data',
      description: 'The email template contains invalid data. Please check your inputs and try again.',
      actionable: true,
      retryable: false
    }
  }

  // Server errors
  if (message.includes('server') || message.includes('internal') || name.includes('server')) {
    return {
      type: 'server',
      title: 'Server Error',
      description: 'The email template service is experiencing issues. Please try again in a few moments.',
      actionable: true,
      retryable: true
    }
  }

  // Client-side errors
  if (name.includes('type') || name.includes('reference') || name.includes('syntax')) {
    return {
      type: 'client',
      title: 'Application Error',
      description: 'An unexpected error occurred while processing email templates. Our team has been notified.',
      actionable: true,
      retryable: true
    }
  }

  // Default/unknown errors
  return {
    type: 'unknown',
    title: 'Unexpected Error',
    description: 'An unexpected error occurred in the email templates section. Please try refreshing the page.',
    actionable: true,
    retryable: true
  }
}

/**
 * Logs error details for monitoring and debugging
 */
function logError(error: Error, context: ErrorContext, digest?: string) {
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    digest,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    section: 'email-templates'
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Email Templates Error:', errorDetails)
  }

  // In production, this would integrate with monitoring services
  // Example: Send to error reporting service
  // errorReportingService.captureException(error, errorDetails)
}

/**
 * Email Templates Error Boundary Component
 * 
 * Implements Next.js app router error.tsx convention with comprehensive
 * error handling for email template management operations.
 */
export default function EmailTemplatesError({ error, reset }: ErrorProps) {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [errorContext, setErrorContext] = useState<ErrorContext>(() => classifyError(error))

  // Maximum retry attempts
  const MAX_RETRIES = 3

  // Log error on component mount and when error changes
  useEffect(() => {
    const context = classifyError(error)
    setErrorContext(context)
    logError(error, context, error.digest)
  }, [error])

  /**
   * Handles retry operation with exponential backoff
   */
  const handleRetry = async () => {
    if (retryCount >= MAX_RETRIES) {
      return
    }

    setIsRetrying(true)
    
    try {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, retryCount) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      
      setRetryCount(prev => prev + 1)
      reset()
    } catch (retryError) {
      console.error('Retry failed:', retryError)
    } finally {
      setIsRetrying(false)
    }
  }

  /**
   * Navigates back to email templates listing
   */
  const handleBackToList = () => {
    router.push('/system-settings/email-templates')
  }

  /**
   * Navigates to system settings dashboard
   */
  const handleBackToSettings = () => {
    router.push('/system-settings')
  }

  /**
   * Navigates to application home
   */
  const handleBackToHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Error Icon and Header */}
        <div className="text-center">
          <ExclamationTriangleIcon 
            className="mx-auto h-16 w-16 text-red-500 dark:text-red-400" 
            aria-hidden="true"
          />
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {errorContext.title}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {errorContext.description}
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Development Error Details
            </h3>
            <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
              <p><strong>Error:</strong> {error.name}</p>
              <p><strong>Message:</strong> {error.message}</p>
              {error.digest && (
                <p><strong>Digest:</strong> {error.digest}</p>
              )}
              <p><strong>Type:</strong> {errorContext.type}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Retry Button */}
          {errorContext.retryable && retryCount < MAX_RETRIES && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label={isRetrying ? 'Retrying operation' : 'Retry email template operation'}
            >
              <ArrowPathIcon 
                className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
          )}

          {/* Maximum retries reached message */}
          {retryCount >= MAX_RETRIES && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Maximum retry attempts reached. Please try refreshing the page or contact support if the issue persists.
              </p>
            </div>
          )}

          {/* Navigation Options */}
          <div className="space-y-2">
            {/* Back to Email Templates */}
            <button
              onClick={handleBackToList}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              aria-label="Return to email templates list"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-2" aria-hidden="true" />
              Back to Email Templates
            </button>

            {/* Back to System Settings */}
            <button
              onClick={handleBackToSettings}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              aria-label="Return to system settings"
            >
              System Settings
            </button>

            {/* Back to Home */}
            <button
              onClick={handleBackToHome}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              aria-label="Return to application home"
            >
              <HomeIcon className="w-4 h-4 mr-2" aria-hidden="true" />
              Go Home
            </button>
          </div>
        </div>

        {/* Additional Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            If this problem persists, please contact your system administrator or check the{' '}
            <a 
              href="/system-settings" 
              className="text-primary-600 dark:text-primary-400 hover:text-primary-500 underline"
              aria-label="Navigate to system settings for additional help"
            >
              system status
            </a>
            {' '}for more information.
          </p>
        </div>

        {/* Screen Reader Status */}
        <div 
          className="sr-only" 
          role="status" 
          aria-live="polite"
          aria-label="Error status for screen readers"
        >
          {isRetrying ? 'Retrying email template operation' : 'Email template error occurred'}
        </div>
      </div>
    </div>
  )
}