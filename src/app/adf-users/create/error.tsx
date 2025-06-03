'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Error types for contextual handling and user messaging
 */
type ErrorType = 
  | 'form-validation'
  | 'network'
  | 'api-response'
  | 'authentication'
  | 'authorization'
  | 'server'
  | 'unknown'

/**
 * Error severity levels for prioritized handling
 */
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Enhanced error information for comprehensive handling
 */
interface ErrorInfo {
  type: ErrorType
  severity: ErrorSeverity
  code?: string
  statusCode?: number
  retryable: boolean
  userMessage: string
  technicalMessage?: string
  timestamp: Date
  userAgent?: string
  url?: string
}

/**
 * Error boundary props extending Next.js error boundary interface
 */
interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Button component with accessibility and theme support
 */
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  disabled = false, 
  className = '',
  'aria-label': ariaLabel,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'border-transparent bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Alert component for error display with accessibility
 */
interface AlertProps {
  children: React.ReactNode
  variant?: 'error' | 'warning' | 'info'
  className?: string
}

const Alert: React.FC<AlertProps> = ({ children, variant = 'error', className = '' }) => {
  const variants = {
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
  }

  const icons = {
    error: (
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div 
      className={`border rounded-md p-4 ${variants[variant]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex">
        {icons[variant]}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Comprehensive error logger with monitoring integration
 */
class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorInfo[] = []

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * Log error with comprehensive context information
   */
  log(error: Error, context?: Partial<ErrorInfo>): void {
    const errorInfo: ErrorInfo = {
      type: this.determineErrorType(error),
      severity: this.determineSeverity(error),
      retryable: this.isRetryable(error),
      userMessage: this.generateUserMessage(error),
      technicalMessage: error.message,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...context
    }

    this.logs.push(errorInfo)

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary Caught:', errorInfo)
    }

    // Production monitoring integration point
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorInfo)
    }
  }

  /**
   * Determine error type based on error characteristics
   */
  private determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    if (message.includes('validation') || message.includes('invalid')) {
      return 'form-validation'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network'
    }
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'authentication'
    }
    if (message.includes('403') || message.includes('forbidden')) {
      return 'authorization'
    }
    if (message.includes('500') || message.includes('server')) {
      return 'server'
    }
    if (stack.includes('api') || message.includes('api')) {
      return 'api-response'
    }
    
    return 'unknown'
  }

  /**
   * Determine error severity based on type and context
   */
  private determineSeverity(error: Error): ErrorSeverity {
    const type = this.determineErrorType(error)
    
    switch (type) {
      case 'authentication':
      case 'authorization':
      case 'server':
        return 'high'
      case 'network':
      case 'api-response':
        return 'medium'
      case 'form-validation':
        return 'low'
      default:
        return 'medium'
    }
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(error: Error): boolean {
    const type = this.determineErrorType(error)
    const retryableTypes: ErrorType[] = ['network', 'api-response', 'server']
    return retryableTypes.includes(type)
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(error: Error): string {
    const type = this.determineErrorType(error)
    
    const messages: Record<ErrorType, string> = {
      'form-validation': 'Please check your form inputs and try again.',
      'network': 'Unable to connect to the server. Please check your internet connection and try again.',
      'api-response': 'The server returned an unexpected response. Please try again.',
      'authentication': 'Your session has expired. Please log in again.',
      'authorization': 'You do not have permission to perform this action.',
      'server': 'A server error occurred. Please try again later.',
      'unknown': 'An unexpected error occurred. Please try again.'
    }

    return messages[type]
  }

  /**
   * Send error information to monitoring service
   */
  private sendToMonitoring(errorInfo: ErrorInfo): void {
    // Integration point for production monitoring services
    // This would typically send to services like Sentry, LogRocket, etc.
    try {
      // Example integration (would be replaced with actual service)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: errorInfo.technicalMessage,
          fatal: errorInfo.severity === 'critical'
        })
      }
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError)
    }
  }

  /**
   * Get recent error logs for debugging
   */
  getRecentLogs(limit: number = 10): ErrorInfo[] {
    return this.logs.slice(-limit)
  }

  /**
   * Clear error logs
   */
  clearLogs(): void {
    this.logs = []
  }
}

/**
 * Error recovery utility with retry mechanisms
 */
class ErrorRecovery {
  private static maxRetries = 3
  private static retryDelay = 1000

  /**
   * Retry function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    retries: number = ErrorRecovery.maxRetries,
    delay: number = ErrorRecovery.retryDelay
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0 && ErrorLogger.getInstance().isRetryable(error as Error)) {
        await new Promise(resolve => setTimeout(resolve, delay))
        return ErrorRecovery.retry(fn, retries - 1, delay * 2)
      }
      throw error
    }
  }

  /**
   * Provide contextual recovery suggestions
   */
  static getRecoveryActions(errorType: ErrorType): Array<{
    label: string
    action: string
    primary?: boolean
  }> {
    const actions: Record<ErrorType, Array<{ label: string; action: string; primary?: boolean }>> = {
      'form-validation': [
        { label: 'Review Form', action: 'review', primary: true },
        { label: 'Clear Form', action: 'clear' },
        { label: 'Go Back', action: 'back' }
      ],
      'network': [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Check Connection', action: 'connection' },
        { label: 'Go Back', action: 'back' }
      ],
      'api-response': [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Refresh Page', action: 'refresh' },
        { label: 'Go Back', action: 'back' }
      ],
      'authentication': [
        { label: 'Login Again', action: 'login', primary: true },
        { label: 'Go Home', action: 'home' }
      ],
      'authorization': [
        { label: 'Contact Administrator', action: 'contact', primary: true },
        { label: 'Go Back', action: 'back' }
      ],
      'server': [
        { label: 'Try Again Later', action: 'later', primary: true },
        { label: 'Contact Support', action: 'support' },
        { label: 'Go Home', action: 'home' }
      ],
      'unknown': [
        { label: 'Retry', action: 'retry', primary: true },
        { label: 'Refresh Page', action: 'refresh' },
        { label: 'Go Back', action: 'back' }
      ]
    }

    return actions[errorType] || actions.unknown
  }
}

/**
 * Next.js Error Boundary Component for User Creation Route
 * 
 * Implements React 19 error boundary capabilities with comprehensive error handling,
 * recovery options, accessibility compliance, and monitoring integration.
 * 
 * @param error - The error that occurred
 * @param reset - Function to retry the component that errored
 */
export default function UserCreateErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter()
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  // Error analysis and logging
  const errorLogger = ErrorLogger.getInstance()
  const errorInfo = {
    type: errorLogger.determineErrorType(error),
    severity: errorLogger.determineSeverity(error),
    retryable: errorLogger.isRetryable(error),
    userMessage: errorLogger.generateUserMessage(error),
    technicalMessage: error.message,
    digest: error.digest
  }

  // Log error on component mount
  useEffect(() => {
    errorLogger.log(error, {
      ...errorInfo,
      code: error.digest,
      url: '/adf-users/create'
    })

    // Announce error to screen readers
    const announcement = `Error occurred: ${errorInfo.userMessage}`
    const srElement = document.createElement('div')
    srElement.setAttribute('aria-live', 'assertive')
    srElement.setAttribute('aria-atomic', 'true')
    srElement.className = 'sr-only'
    srElement.textContent = announcement
    document.body.appendChild(srElement)

    // Cleanup announcement after delay
    setTimeout(() => {
      document.body.removeChild(srElement)
    }, 1000)
  }, [error])

  /**
   * Handle retry action with loading state
   */
  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    try {
      // Attempt recovery with retry mechanism
      await ErrorRecovery.retry(async () => {
        // Reset the error boundary
        reset()
      }, 1, 1000)
    } catch (retryError) {
      console.error('Retry failed:', retryError)
      setIsRetrying(false)
    }
  }

  /**
   * Handle recovery actions based on error type
   */
  const handleRecoveryAction = (action: string) => {
    switch (action) {
      case 'retry':
        handleRetry()
        break
      case 'refresh':
        window.location.reload()
        break
      case 'back':
        router.back()
        break
      case 'home':
        router.push('/')
        break
      case 'login':
        router.push('/login')
        break
      case 'review':
        // Scroll to form for review
        reset()
        break
      case 'clear':
        // Clear form data and reset
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('user-form-data')
          localStorage.removeItem('user-form-draft')
        }
        reset()
        break
      case 'contact':
        // Contact administrator action
        alert('Please contact your administrator for assistance.')
        break
      case 'support':
        // Contact support action
        alert('Please contact technical support for assistance.')
        break
      case 'connection':
        // Guide user to check connection
        alert('Please check your internet connection and try again.')
        break
      case 'later':
        router.push('/adf-users')
        break
      default:
        handleRetry()
    }
  }

  // Get contextual recovery actions
  const recoveryActions = ErrorRecovery.getRecoveryActions(errorInfo.type)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Error Icon and Header */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
            <svg 
              className="h-6 w-6 text-red-600 dark:text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
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
          
          <h1 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            User Creation Error
          </h1>
          
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Something went wrong while creating the user. We're here to help you resolve this.
          </p>
        </div>

        {/* Error Details Alert */}
        <div className="mt-8">
          <Alert variant="error">
            <div>
              <h3 className="text-sm font-medium mb-2">
                {errorInfo.userMessage}
              </h3>
              
              {errorInfo.severity === 'high' && (
                <p className="text-xs mb-2">
                  This is a high-priority error that requires immediate attention.
                </p>
              )}

              {retryCount > 0 && (
                <p className="text-xs">
                  Retry attempts: {retryCount}
                </p>
              )}
            </div>
          </Alert>
        </div>

        {/* Recovery Actions */}
        <div className="mt-6 space-y-3">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Recommended Actions:
          </div>
          
          {recoveryActions.map((action, index) => (
            <Button
              key={action.action}
              onClick={() => handleRecoveryAction(action.action)}
              variant={action.primary ? 'primary' : 'outline'}
              disabled={isRetrying}
              className="w-full"
              aria-label={`${action.label} - Recovery action for ${errorInfo.type} error`}
            >
              {isRetrying && action.action === 'retry' ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Retrying...
                </div>
              ) : (
                action.label
              )}
            </Button>
          ))}
        </div>

        {/* Technical Details Toggle */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-expanded={showTechnicalDetails}
            aria-controls="technical-details"
          >
            {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
          </button>
          
          {showTechnicalDetails && (
            <div 
              id="technical-details"
              className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-xs font-mono"
              role="region"
              aria-label="Technical error details"
            >
              <div className="space-y-2">
                <div><strong>Error Type:</strong> {errorInfo.type}</div>
                <div><strong>Severity:</strong> {errorInfo.severity}</div>
                <div><strong>Retryable:</strong> {errorInfo.retryable ? 'Yes' : 'No'}</div>
                {error.digest && <div><strong>Error ID:</strong> {error.digest}</div>}
                <div><strong>Message:</strong> {errorInfo.technicalMessage}</div>
                <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            If this problem persists, please contact your system administrator with the error details above.
          </p>
        </div>

        {/* Hidden screen reader content for context */}
        <div className="sr-only" aria-live="polite">
          {`User creation error boundary active. Error type: ${errorInfo.type}. ${recoveryActions.length} recovery options available.`}
        </div>
      </div>
    </div>
  )
}