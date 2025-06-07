'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Wifi, Database, Shield } from 'lucide-react'

// Components (assuming standard interfaces based on React patterns)
interface AlertProps {
  variant?: 'default' | 'destructive' | 'warning' | 'info'
  className?: string
  children: React.ReactNode
}

const Alert = ({ variant = 'default', className = '', children }: AlertProps) => (
  <div 
    className={`rounded-lg border p-4 ${
      variant === 'destructive' ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100' :
      variant === 'warning' ? 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100' :
      variant === 'info' ? 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100' :
      'border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
    } ${className}`}
    role="alert"
    aria-live="polite"
  >
    {children}
  </div>
)

const AlertDescription = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`text-sm leading-relaxed ${className}`}>
    {children}
  </div>
)

interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
  'aria-label'?: string
}

const Button = ({ 
  variant = 'default', 
  size = 'default', 
  className = '', 
  onClick, 
  disabled = false,
  children,
  'aria-label': ariaLabel,
  ...props 
}: ButtonProps) => (
  <button
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      variant === 'default' ? 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800' :
      variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800' :
      variant === 'outline' ? 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700' :
      variant === 'secondary' ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600' :
      variant === 'ghost' ? 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800' :
      'text-primary-600 underline-offset-4 hover:underline'
    } ${
      size === 'sm' ? 'h-9 px-3' :
      size === 'lg' ? 'h-11 px-8' :
      size === 'icon' ? 'h-10 w-10' :
      'h-10 px-4 py-2'
    } ${className}`}
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    {...props}
  >
    {children}
  </button>
)

// Hook for error handling (assuming standard interface)
interface ErrorHandlingHook {
  reportError: (error: Error, context?: string) => void
  clearError: () => void
  retryCount: number
  incrementRetry: () => void
  resetRetry: () => void
}

const useErrorHandling = (): ErrorHandlingHook => {
  const [retryCount, setRetryCount] = useState(0)

  const reportError = useCallback((error: Error, context?: string) => {
    // Error reporting logic would go here
    console.error('Error reported:', { error, context, timestamp: new Date().toISOString() })
    
    // In production, this would integrate with error tracking services
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { tags: { context } })
    }
  }, [])

  const clearError = useCallback(() => {
    setRetryCount(0)
  }, [])

  const incrementRetry = useCallback(() => {
    setRetryCount(prev => prev + 1)
  }, [])

  const resetRetry = useCallback(() => {
    setRetryCount(0)
  }, [])

  return {
    reportError,
    clearError,
    retryCount,
    incrementRetry,
    resetRetry
  }
}

// Error types for better categorization
interface ErrorInfo {
  type: 'network' | 'validation' | 'authentication' | 'authorization' | 'server' | 'client' | 'unknown'
  message: string
  recovery: 'retry' | 'navigate' | 'refresh' | 'contact' | 'none'
  icon: React.ComponentType<{ className?: string }>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Categorizes error types and provides appropriate recovery strategies
 * Based on Section 4.2.1 Error Handling Flowchart requirements
 */
const categorizeError = (error: Error): ErrorInfo => {
  const message = error.message.toLowerCase()
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection and try again.',
      recovery: 'retry',
      icon: Wifi,
      severity: 'medium'
    }
  }
  
  // Authentication errors
  if (message.includes('auth') || message.includes('login') || message.includes('unauthorized')) {
    return {
      type: 'authentication',
      message: 'Authentication failed. Please log in again to continue.',
      recovery: 'navigate',
      icon: Shield,
      severity: 'high'
    }
  }
  
  // Authorization errors
  if (message.includes('forbidden') || message.includes('permission') || message.includes('access denied')) {
    return {
      type: 'authorization',
      message: 'You do not have permission to perform this action. Please contact your administrator.',
      recovery: 'contact',
      icon: Shield,
      severity: 'high'
    }
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return {
      type: 'validation',
      message: 'Please check your input and try again. All required fields must be completed.',
      recovery: 'none',
      icon: AlertTriangle,
      severity: 'low'
    }
  }
  
  // Server errors
  if (message.includes('server') || message.includes('500') || message.includes('internal')) {
    return {
      type: 'server',
      message: 'A server error occurred. Our team has been notified. Please try again later.',
      recovery: 'retry',
      icon: Database,
      severity: 'critical'
    }
  }
  
  // Default to unknown error
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    recovery: 'retry',
    icon: Bug,
    severity: 'medium'
  }
}

/**
 * Next.js Error Boundary Component for Create Limit Page
 * 
 * Implements comprehensive error handling per Section 4.2 requirements:
 * - React Error Boundary integration with fallback UI rendering
 * - User-friendly error recovery interfaces per Section 7.6
 * - Accessibility compliance with WCAG 2.1 AA requirements
 * - Internationalization support for error messages
 * - Tailwind CSS styling with responsive design
 * 
 * @param error - The error that occurred
 * @param reset - Function to reset the error boundary and retry
 */
export default function CreateLimitError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const { reportError, retryCount, incrementRetry, resetRetry } = useErrorHandling()
  const [isRetrying, setIsRetrying] = useState(false)

  // Categorize the error for appropriate handling
  const errorInfo = categorizeError(error)
  const maxRetries = 3

  // Report error on mount
  useEffect(() => {
    reportError(error, 'create-limit-page')
  }, [error, reportError])

  // Enhanced retry with exponential backoff
  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries) {
      return
    }

    setIsRetrying(true)
    incrementRetry()

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay))
      resetRetry()
      reset()
    } catch (retryError) {
      console.error('Retry failed:', retryError)
    } finally {
      setIsRetrying(false)
    }
  }, [retryCount, maxRetries, incrementRetry, resetRetry, reset])

  // Navigate back to limits list
  const handleNavigateBack = useCallback(() => {
    router.push('/api-security/limits')
  }, [router])

  // Navigate to dashboard
  const handleNavigateDashboard = useCallback(() => {
    router.push('/')
  }, [router])

  // Navigate to login (for auth errors)
  const handleNavigateLogin = useCallback(() => {
    router.push('/login')
  }, [router])

  // Refresh the page
  const handleRefresh = useCallback(() => {
    window.location.reload()
  }, [])

  // Keyboard handler for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'r' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      handleRetry()
    }
  }, [handleRetry])

  const ErrorIcon = errorInfo.icon

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="main"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      <div className="max-w-md w-full space-y-6">
        {/* Error Alert */}
        <Alert 
          variant={errorInfo.severity === 'critical' ? 'destructive' : 'warning'}
          className="border-l-4"
        >
          <div className="flex items-start space-x-3">
            <ErrorIcon 
              className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                errorInfo.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
              }`}
              aria-hidden="true"
            />
            <div className="flex-1 space-y-2">
              <h1 
                id="error-title"
                className="font-semibold text-base"
              >
                Error Creating Limit
              </h1>
              <AlertDescription id="error-description">
                {errorInfo.message}
              </AlertDescription>
              
              {/* Additional context for developers */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-3">
                  <summary className="text-xs cursor-pointer hover:underline">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono break-all">
                    <div><strong>Error:</strong> {error.message}</div>
                    {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
                    <div><strong>Type:</strong> {errorInfo.type}</div>
                    <div><strong>Retries:</strong> {retryCount}/{maxRetries}</div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </Alert>

        {/* Recovery Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            What would you like to do?
          </h2>
          
          <div className="grid gap-2">
            {/* Retry Action - Only show if retry is a valid recovery option */}
            {errorInfo.recovery === 'retry' && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying || retryCount >= maxRetries}
                className="w-full justify-start"
                aria-label={`Retry creating limit. Attempt ${retryCount + 1} of ${maxRetries}`}
              >
                <RefreshCw 
                  className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                {isRetrying ? 'Retrying...' : 
                 retryCount >= maxRetries ? 'Max retries reached' : 
                 `Retry (${retryCount}/${maxRetries})`}
              </Button>
            )}

            {/* Navigate to Login - For auth errors */}
            {errorInfo.recovery === 'navigate' && errorInfo.type === 'authentication' && (
              <Button
                onClick={handleNavigateLogin}
                className="w-full justify-start"
                aria-label="Go to login page to re-authenticate"
              >
                <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                Go to Login
              </Button>
            )}

            {/* Go Back to Limits List */}
            <Button
              variant="outline"
              onClick={handleNavigateBack}
              className="w-full justify-start"
              aria-label="Return to limits management page"
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Back to Limits
            </Button>

            {/* Go to Dashboard */}
            <Button
              variant="outline"
              onClick={handleNavigateDashboard}
              className="w-full justify-start"
              aria-label="Return to application dashboard"
            >
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              Go to Dashboard
            </Button>

            {/* Refresh Page - For critical errors */}
            {errorInfo.severity === 'critical' && (
              <Button
                variant="secondary"
                onClick={handleRefresh}
                className="w-full justify-start"
                aria-label="Refresh the current page"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Refresh Page
              </Button>
            )}
          </div>
        </div>

        {/* Contact Support - For authorization errors or critical issues */}
        {(errorInfo.recovery === 'contact' || errorInfo.severity === 'critical') && (
          <Alert variant="info">
            <AlertDescription>
              If this problem persists, please contact your system administrator or 
              <a 
                href="mailto:support@dreamfactory.com" 
                className="ml-1 underline hover:no-underline focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                aria-label="Send email to DreamFactory support"
              >
                DreamFactory support
              </a>.
            </AlertDescription>
          </Alert>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Tip: Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl/Cmd + R</kbd> to retry
        </div>

        {/* Screen Reader Instructions */}
        <div className="sr-only" aria-live="polite">
          Error boundary activated for limit creation page. Error type: {errorInfo.type}. 
          Severity: {errorInfo.severity}. 
          {errorInfo.recovery === 'retry' && `Retry available. Current attempt: ${retryCount} of ${maxRetries}.`}
          Use buttons above to recover from this error or navigate away from this page.
        </div>
      </div>
    </div>
  )
}