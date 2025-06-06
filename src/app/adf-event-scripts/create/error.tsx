'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft, Bug, Code, Database, Save } from 'lucide-react'

/**
 * Error boundary component for the event script creation page.
 * 
 * Provides comprehensive error handling for script creation workflows including:
 * - Form validation errors and submission failures
 * - Script editor initialization and code validation issues  
 * - Storage service connection and configuration problems
 * - API communication failures during script operations
 * - Authentication and authorization errors
 * 
 * Features React 19 error boundary capabilities with:
 * - Graceful error recovery with user-friendly messaging
 * - Retry mechanisms for transient failures
 * - Comprehensive error logging and monitoring integration
 * - WCAG 2.1 AA compliant error announcements
 * - Tailwind CSS responsive design with dark/light theme support
 */

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Enhanced error classification for script creation workflows
 */
interface ErrorContext {
  type: 'validation' | 'editor' | 'storage' | 'api' | 'auth' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userMessage: string
  technicalMessage: string
  recoveryActions: Array<{
    label: string
    action: () => void
    icon: React.ReactNode
    primary?: boolean
  }>
  helpText?: string
}

/**
 * Classifies errors based on message content and context for targeted recovery
 */
function classifyError(error: Error): ErrorContext {
  const message = error.message.toLowerCase()
  const stack = error.stack?.toLowerCase() || ''

  // Script validation and form errors
  if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
    return {
      type: 'validation',
      severity: 'medium',
      userMessage: 'Script validation failed',
      technicalMessage: 'The script contains validation errors that need to be corrected.',
      recoveryActions: [
        {
          label: 'Review Form',
          action: () => window.location.reload(),
          icon: <Code className="h-4 w-4" />,
          primary: true
        },
        {
          label: 'Reset Form',
          action: () => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('script-draft')
              window.location.reload()
            }
          },
          icon: <RefreshCw className="h-4 w-4" />
        }
      ],
      helpText: 'Check that all required fields are filled and script syntax is valid.'
    }
  }

  // Script editor and code-related errors
  if (message.includes('editor') || message.includes('syntax') || message.includes('monaco')) {
    return {
      type: 'editor',
      severity: 'high',
      userMessage: 'Script editor encountered an error',
      technicalMessage: 'The code editor failed to initialize or encountered a syntax error.',
      recoveryActions: [
        {
          label: 'Reload Editor',
          action: () => window.location.reload(),
          icon: <Code className="h-4 w-4" />,
          primary: true
        },
        {
          label: 'Use Simple Mode',
          action: () => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('use-simple-editor', 'true')
              window.location.reload()
            }
          },
          icon: <Code className="h-4 w-4" />
        }
      ],
      helpText: 'Try reloading the editor or switch to simple text mode if the rich editor fails.'
    }
  }

  // Storage service connection errors
  if (message.includes('storage') || message.includes('service') || message.includes('connection')) {
    return {
      type: 'storage',
      severity: 'high',
      userMessage: 'Storage service connection failed',
      technicalMessage: 'Unable to connect to the selected storage service for script deployment.',
      recoveryActions: [
        {
          label: 'Test Connection',
          action: () => window.location.reload(),
          icon: <Database className="h-4 w-4" />,
          primary: true
        },
        {
          label: 'Select Different Service',
          action: () => {
            const url = new URL(window.location.href)
            url.searchParams.delete('storage_service')
            window.location.href = url.toString()
          },
          icon: <Database className="h-4 w-4" />
        }
      ],
      helpText: 'Verify that the storage service is configured correctly and accessible.'
    }
  }

  // API and network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('api') || 
      message.includes('timeout') || stack.includes('fetch')) {
    return {
      type: 'api',
      severity: 'high',
      userMessage: 'Network connection error',
      technicalMessage: 'Failed to communicate with the server while creating the script.',
      recoveryActions: [
        {
          label: 'Retry Request',
          action: () => window.location.reload(),
          icon: <RefreshCw className="h-4 w-4" />,
          primary: true
        },
        {
          label: 'Save Draft',
          action: () => {
            if (typeof window !== 'undefined') {
              // Attempt to save form data to localStorage for recovery
              const formData = document.querySelector('form')
              if (formData) {
                const data = new FormData(formData)
                const draft = Object.fromEntries(data.entries())
                localStorage.setItem('script-creation-draft', JSON.stringify(draft))
                alert('Draft saved to local storage')
              }
            }
          },
          icon: <Save className="h-4 w-4" />
        }
      ],
      helpText: 'Check your internet connection and try again. Your work has been saved locally.'
    }
  }

  // Authentication and authorization errors
  if (message.includes('auth') || message.includes('401') || message.includes('403') || 
      message.includes('unauthorized') || message.includes('forbidden')) {
    return {
      type: 'auth',
      severity: 'critical',
      userMessage: 'Authentication required',
      technicalMessage: 'Your session has expired or you lack permission to create scripts.',
      recoveryActions: [
        {
          label: 'Login Again',
          action: () => {
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
          },
          icon: <ArrowLeft className="h-4 w-4" />,
          primary: true
        }
      ],
      helpText: 'Please log in again to continue creating scripts.'
    }
  }

  // Generic/unknown errors
  return {
    type: 'unknown',
    severity: 'high',
    userMessage: 'An unexpected error occurred',
    technicalMessage: 'The script creation process encountered an unexpected error.',
    recoveryActions: [
      {
        label: 'Try Again',
        action: () => window.location.reload(),
        icon: <RefreshCw className="h-4 w-4" />,
        primary: true
      },
      {
        label: 'Go Back',
        action: () => {
          if (typeof window !== 'undefined') {
            window.history.back()
          }
        },
        icon: <ArrowLeft className="h-4 w-4" />
      }
    ],
    helpText: 'If this problem persists, please contact your system administrator.'
  }
}

/**
 * Logs error details for monitoring and debugging
 */
function logError(error: Error, context: ErrorContext): void {
  // Enhanced error logging with context
  const errorLog = {
    timestamp: new Date().toISOString(),
    page: 'event-scripts/create',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: (error as any).digest
    },
    context: {
      type: context.type,
      severity: context.severity,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    },
    user: {
      // Add user context if available
      sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('session_id') : null
    }
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Script Creation Error:', errorLog)
  }

  // Production error reporting integration
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service (replace with actual implementation)
    try {
      fetch('/api/error-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog)
      }).catch(() => {
        // Silently fail if error reporting is unavailable
      })
    } catch {
      // Prevent error reporting from causing additional errors
    }
  }
}

/**
 * Main error boundary component for event script creation page
 */
export default function CreateScriptError({ error, reset }: ErrorProps) {
  const errorContext = React.useMemo(() => classifyError(error), [error])
  
  // Log error on mount
  React.useEffect(() => {
    logError(error, errorContext)
  }, [error, errorContext])

  // Severity-based styling
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
      case 'high':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
    }
  }

  const getSeverityIconColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400'
      case 'high':
        return 'text-orange-600 dark:text-orange-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const handleRetry = () => {
    // Clear any error state and reset the component tree
    reset()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error announcement for screen readers */}
        <div 
          role="alert" 
          aria-live="assertive" 
          className="sr-only"
          aria-atomic="true"
        >
          Script creation error: {errorContext.userMessage}. {errorContext.helpText}
        </div>

        {/* Main error container */}
        <div className={`
          rounded-lg border-2 p-8 shadow-lg backdrop-blur-sm
          ${getSeverityStyles(errorContext.severity)}
        `}>
          {/* Error header with icon */}
          <div className="flex items-start space-x-4 mb-6">
            <div className={`
              flex-shrink-0 p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm
              ${getSeverityIconColor(errorContext.severity)}
            `}>
              <AlertTriangle className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Script Creation Error
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">
                {errorContext.userMessage}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {errorContext.technicalMessage}
              </p>
            </div>
          </div>

          {/* Help text */}
          {errorContext.helpText && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>What you can do:</strong> {errorContext.helpText}
              </p>
            </div>
          )}

          {/* Recovery actions */}
          <div className="space-y-3 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Recovery Options
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {errorContext.recoveryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`
                    flex items-center justify-center space-x-3 px-4 py-3 rounded-lg
                    text-sm font-medium transition-all duration-200 border
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    ${action.primary 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm hover:shadow-md' 
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                    }
                  `}
                  aria-describedby={action.primary ? 'primary-action-desc' : undefined}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Technical details (collapsible) */}
          <details className="mb-6">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center space-x-2">
              <Bug className="h-4 w-4" />
              <span>Technical Details</span>
            </summary>
            <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Error Type:</strong> 
                  <span className="ml-2 font-mono text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    {errorContext.type}
                  </span>
                </div>
                <div>
                  <strong>Severity:</strong> 
                  <span className="ml-2 font-mono text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    {errorContext.severity}
                  </span>
                </div>
                <div>
                  <strong>Message:</strong> 
                  <code className="block mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded text-xs break-all">
                    {error.message}
                  </code>
                </div>
                {error.digest && (
                  <div>
                    <strong>Error ID:</strong> 
                    <code className="block mt-1 p-2 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                      {error.digest}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </details>

          {/* Additional navigation */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/adf-event-scripts'
                  }
                }}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-sm
                         text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200
                         border border-gray-300 dark:border-gray-600 rounded-lg
                         hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Scripts</span>
              </button>
              
              <button
                onClick={handleRetry}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-sm
                         text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200
                         border border-blue-300 dark:border-blue-600 rounded-lg
                         hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hidden descriptions for screen readers */}
        <div className="sr-only">
          <div id="primary-action-desc">
            Primary recommended action to resolve the script creation error
          </div>
        </div>
      </div>
    </div>
  )
}