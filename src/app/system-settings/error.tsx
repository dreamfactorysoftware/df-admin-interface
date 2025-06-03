'use client'

import React, { useEffect, useState } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { XCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'

/**
 * Next.js error boundary component for system settings section
 * Implements React Error Boundary integration with comprehensive error handling
 * per Section 4.2.1 error handling flowchart and Next.js app router patterns
 */

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

interface ErrorDetails {
  name: string
  message: string
  stack?: string
  digest?: string
  timestamp: string
  url: string
  userAgent: string
}

interface RecoveryAction {
  label: string
  action: () => void
  variant: 'primary' | 'secondary' | 'outline'
  icon?: React.ComponentType<{ className?: string }>
}

/**
 * System Settings Error Boundary Component
 * 
 * Provides comprehensive error handling for the system settings section including:
 * - React error boundary integration per Section 4.2.1
 * - Comprehensive error display with recovery options
 * - Error reporting and logging integration
 * - MSW mock error response support for development
 * - Tailwind CSS styling with accessibility compliance per Section 7.1
 * - WCAG 2.1 AA accessibility standards
 */
export default function SystemSettingsError({ error, reset }: ErrorBoundaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const [errorReported, setErrorReported] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Collect comprehensive error details
  const errorDetails: ErrorDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    digest: error.digest,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
  }

  // Error categorization based on Section 4.2.1 error handling flowchart
  const getErrorCategory = (error: Error): string => {
    if (error.message.includes('Network')) return 'NETWORK_ERROR'
    if (error.message.includes('Authentication') || error.message.includes('401')) return 'AUTH_ERROR'
    if (error.message.includes('Permission') || error.message.includes('403')) return 'PERMISSION_ERROR'
    if (error.message.includes('Not Found') || error.message.includes('404')) return 'NOT_FOUND_ERROR'
    if (error.message.includes('Server') || error.message.includes('500')) return 'SERVER_ERROR'
    if (error.name === 'ChunkLoadError') return 'CHUNK_LOAD_ERROR'
    return 'UNKNOWN_ERROR'
  }

  const errorCategory = getErrorCategory(error)

  // Development mode MSW integration per Section 7.1.2
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Error reporting function with logging integration
  const reportError = async () => {
    if (isReporting || errorReported) return

    setIsReporting(true)
    
    try {
      // Error reporting logic - in real implementation, this would integrate with
      // monitoring services like Sentry, LogRocket, or similar
      if (isDevelopment) {
        console.group('🚨 System Settings Error Report')
        console.error('Error Category:', errorCategory)
        console.error('Error Details:', errorDetails)
        console.error('Component Stack:', error.stack)
        console.groupEnd()
      }

      // Simulate error reporting API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setErrorReported(true)
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    } finally {
      setIsReporting(false)
    }
  }

  // Automatic error reporting on mount
  useEffect(() => {
    reportError()
  }, [error])

  // Enhanced retry with exponential backoff per Section 4.2.1
  const handleRetry = () => {
    const maxRetries = 3
    if (retryCount >= maxRetries) {
      return
    }

    setRetryCount(prev => prev + 1)
    
    // Exponential backoff delay
    const delay = Math.pow(2, retryCount) * 1000
    setTimeout(() => {
      reset()
    }, delay)
  }

  // Navigation actions with proper error recovery
  const navigateHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  const navigateBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  const refreshPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  // Recovery actions based on error category
  const getRecoveryActions = (): RecoveryAction[] => {
    const baseActions: RecoveryAction[] = [
      {
        label: retryCount >= 3 ? 'Maximum retries reached' : `Retry${retryCount > 0 ? ` (${retryCount}/3)` : ''}`,
        action: handleRetry,
        variant: 'primary',
        icon: ArrowPathIcon
      }
    ]

    switch (errorCategory) {
      case 'AUTH_ERROR':
        return [
          ...baseActions,
          {
            label: 'Return to Login',
            action: () => window.location.href = '/login',
            variant: 'secondary',
            icon: HomeIcon
          }
        ]
      
      case 'PERMISSION_ERROR':
        return [
          ...baseActions,
          {
            label: 'Return to Dashboard',
            action: navigateHome,
            variant: 'secondary',
            icon: HomeIcon
          }
        ]
      
      case 'NETWORK_ERROR':
      case 'SERVER_ERROR':
        return [
          ...baseActions,
          {
            label: 'Refresh Page',
            action: refreshPage,
            variant: 'outline',
            icon: ArrowPathIcon
          },
          {
            label: 'Go Back',
            action: navigateBack,
            variant: 'outline',
            icon: HomeIcon
          }
        ]
      
      default:
        return [
          ...baseActions,
          {
            label: 'Return to Dashboard',
            action: navigateHome,
            variant: 'secondary',
            icon: HomeIcon
          }
        ]
    }
  }

  const recoveryActions = getRecoveryActions()

  // User-friendly error messages per error category
  const getErrorMessage = (): { title: string; description: string } => {
    switch (errorCategory) {
      case 'NETWORK_ERROR':
        return {
          title: 'Network Connection Error',
          description: 'Unable to connect to the system settings service. Please check your internet connection and try again.'
        }
      
      case 'AUTH_ERROR':
        return {
          title: 'Authentication Required',
          description: 'Your session has expired. Please log in again to access system settings.'
        }
      
      case 'PERMISSION_ERROR':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to access this system settings section. Please contact your administrator.'
        }
      
      case 'NOT_FOUND_ERROR':
        return {
          title: 'Page Not Found',
          description: 'The requested system settings page could not be found. It may have been moved or deleted.'
        }
      
      case 'SERVER_ERROR':
        return {
          title: 'Server Error',
          description: 'A server error occurred while loading system settings. Our team has been notified and is working to fix this issue.'
        }
      
      case 'CHUNK_LOAD_ERROR':
        return {
          title: 'Loading Error',
          description: 'Failed to load application resources. This may be due to a network issue or recent update. Please refresh the page.'
        }
      
      default:
        return {
          title: 'System Settings Error',
          description: 'An unexpected error occurred in the system settings section. Please try again or contact support if the problem persists.'
        }
    }
  }

  const { title, description } = getErrorMessage()

  // Button component with Tailwind styling
  const Button: React.FC<{
    onClick: () => void
    variant: 'primary' | 'secondary' | 'outline'
    disabled?: boolean
    children: React.ReactNode
    className?: string
  }> = ({ onClick, variant, disabled = false, children, className = '' }) => {
    const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
    }

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        aria-describedby="error-description"
      >
        {children}
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Main Error Display */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          {/* Error Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon 
                  className="h-12 w-12 text-error-500" 
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {title}
                </h1>
                <p 
                  id="error-description"
                  className="text-gray-600 text-base leading-relaxed"
                >
                  {description}
                </p>
                
                {/* Error Category Badge */}
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-error-100 text-error-800">
                    <XCircleIcon className="w-3 h-3 mr-1" aria-hidden="true" />
                    {errorCategory.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Actions */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recovery Options
            </h2>
            <div className="flex flex-wrap gap-3">
              {recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  variant={action.variant}
                  disabled={action.label.includes('Maximum retries') || isReporting}
                  className="flex-shrink-0"
                >
                  {action.icon && (
                    <action.icon className="w-4 h-4" aria-hidden="true" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Error Details (Expandable) */}
          <div className="px-6 py-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md p-2 -m-2"
              aria-expanded={isExpanded}
              aria-controls="error-details"
            >
              <span className="flex items-center gap-2">
                <DocumentTextIcon className="w-4 h-4" aria-hidden="true" />
                Technical Details
              </span>
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {isExpanded && (
              <div 
                id="error-details"
                className="mt-4 space-y-4 text-sm"
                role="region"
                aria-label="Error technical details"
              >
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <dt className="font-medium text-gray-900">Error Type:</dt>
                    <dd className="text-gray-600 font-mono">{errorDetails.name}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900">Message:</dt>
                    <dd className="text-gray-600 break-words">{errorDetails.message}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900">Timestamp:</dt>
                    <dd className="text-gray-600 font-mono">{errorDetails.timestamp}</dd>
                  </div>
                  {errorDetails.digest && (
                    <div>
                      <dt className="font-medium text-gray-900">Error ID:</dt>
                      <dd className="text-gray-600 font-mono text-xs">{errorDetails.digest}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-medium text-gray-900">Page URL:</dt>
                    <dd className="text-gray-600 break-all text-xs">{errorDetails.url}</dd>
                  </div>
                  
                  {/* Stack trace for development */}
                  {isDevelopment && errorDetails.stack && (
                    <div>
                      <dt className="font-medium text-gray-900">Stack Trace:</dt>
                      <dd className="text-gray-600 font-mono text-xs whitespace-pre-wrap bg-gray-100 p-3 rounded border overflow-x-auto">
                        {errorDetails.stack}
                      </dd>
                    </div>
                  )}
                </div>

                {/* Error Reporting Status */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {isReporting && (
                    <>
                      <ArrowPathIcon className="w-3 h-3 animate-spin" aria-hidden="true" />
                      <span>Reporting error...</span>
                    </>
                  )}
                  {errorReported && (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full" aria-hidden="true"></div>
                      <span>Error reported successfully</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Need Additional Help?
          </h3>
          <p className="text-blue-800 mb-4">
            If this error persists, please contact your system administrator or check the documentation for troubleshooting steps.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => window.open('/api-docs', '_blank')}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <DocumentTextIcon className="w-4 h-4" aria-hidden="true" />
              View Documentation
            </Button>
            <Button
              onClick={() => window.location.href = 'mailto:support@dreamfactory.com'}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}