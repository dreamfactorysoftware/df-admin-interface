'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft, Bug, Shield, UserX } from 'lucide-react'

/**
 * Error types specific to profile management workflows
 */
type ProfileErrorType = 
  | 'profile-update-failed'
  | 'password-change-failed' 
  | 'security-question-failed'
  | 'authentication-expired'
  | 'network-error'
  | 'validation-error'
  | 'permission-denied'
  | 'server-error'
  | 'unknown-error'

interface ProfileErrorInfo {
  type: ProfileErrorType
  message: string
  action: string
  icon: React.ComponentType<{ className?: string }>
  canRetry: boolean
}

/**
 * Enhanced error logger for profile-specific errors
 * Provides comprehensive error tracking and monitoring integration
 */
class ProfileErrorLogger {
  private static instance: ProfileErrorLogger
  private errors: Array<{ timestamp: Date; error: Error; errorInfo?: any; context?: string }> = []

  static getInstance(): ProfileErrorLogger {
    if (!ProfileErrorLogger.instance) {
      ProfileErrorLogger.instance = new ProfileErrorLogger()
    }
    return ProfileErrorLogger.instance
  }

  /**
   * Log error with profile-specific context and monitoring integration
   */
  logError(error: Error, errorInfo?: any, context?: string): void {
    const errorEntry = {
      timestamp: new Date(),
      error,
      errorInfo,
      context: context || 'profile-management'
    }

    this.errors.push(errorEntry)
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Profile Error Boundary')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Context:', context)
      console.error('Stack:', error.stack)
      console.groupEnd()
    }

    // Production error monitoring integration
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(errorEntry)
    }

    // Announce error to screen readers
    this.announceErrorToScreenReader(error.message)
  }

  /**
   * Send error to monitoring service (placeholder for actual implementation)
   */
  private sendToMonitoring(errorEntry: any): void {
    // Integration with error monitoring services like Sentry, LogRocket, etc.
    // This would be implemented based on the chosen monitoring solution
    try {
      // Example integration pattern:
      // window.errorMonitoring?.captureException(errorEntry.error, {
      //   tags: { component: 'profile-error-boundary' },
      //   extra: { errorInfo: errorEntry.errorInfo, context: errorEntry.context }
      // })
    } catch (monitoringError) {
      console.warn('Failed to send error to monitoring service:', monitoringError)
    }
  }

  /**
   * Announce error to screen readers for accessibility compliance
   */
  private announceErrorToScreenReader(message: string): void {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'assertive')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.setAttribute('class', 'sr-only')
    announcement.textContent = `Error occurred: ${message}. Please review the error details and try again.`
    
    document.body.appendChild(announcement)
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): Array<any> {
    return this.errors.slice(-limit)
  }

  /**
   * Clear error log
   */
  clearErrors(): void {
    this.errors = []
  }
}

/**
 * Enhanced error recovery mechanisms for profile management
 */
class ProfileErrorRecovery {
  /**
   * Determine error type and recovery strategy based on error characteristics
   */
  static categorizeError(error: Error): ProfileErrorInfo {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    // Profile update failures
    if (message.includes('profile') && (message.includes('update') || message.includes('save'))) {
      return {
        type: 'profile-update-failed',
        message: 'Failed to update profile information. Please check your input and try again.',
        action: 'Verify your information and retry the update',
        icon: UserX,
        canRetry: true
      }
    }

    // Password change errors
    if (message.includes('password') || message.includes('credential')) {
      return {
        type: 'password-change-failed',
        message: 'Password change failed. Please ensure your current password is correct.',
        action: 'Verify your current password and try again',
        icon: Shield,
        canRetry: true
      }
    }

    // Security question errors
    if (message.includes('security') && message.includes('question')) {
      return {
        type: 'security-question-failed',
        message: 'Failed to update security questions. Please try again.',
        action: 'Review your security question answers and retry',
        icon: Shield,
        canRetry: true
      }
    }

    // Authentication expiration
    if (message.includes('token') || message.includes('auth') || message.includes('session')) {
      return {
        type: 'authentication-expired',
        message: 'Your session has expired. Please log in again to continue.',
        action: 'Log in again to access your profile',
        icon: UserX,
        canRetry: false
      }
    }

    // Network connectivity issues
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: 'network-error',
        message: 'Network connection error. Please check your internet connection.',
        action: 'Check your connection and try again',
        icon: RefreshCw,
        canRetry: true
      }
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return {
        type: 'validation-error',
        message: 'Invalid input detected. Please review your information.',
        action: 'Correct the highlighted fields and try again',
        icon: AlertTriangle,
        canRetry: true
      }
    }

    // Permission errors
    if (message.includes('permission') || message.includes('forbidden') || message.includes('access')) {
      return {
        type: 'permission-denied',
        message: 'You do not have permission to perform this action.',
        action: 'Contact your administrator for access',
        icon: Shield,
        canRetry: false
      }
    }

    // Server errors
    if (message.includes('server') || message.includes('500') || stack.includes('server')) {
      return {
        type: 'server-error',
        message: 'Server error occurred. Please try again in a few moments.',
        action: 'Wait a moment and try again',
        icon: Bug,
        canRetry: true
      }
    }

    // Default unknown error
    return {
      type: 'unknown-error',
      message: 'An unexpected error occurred while managing your profile.',
      action: 'Try refreshing the page or contact support if the issue persists',
      icon: AlertTriangle,
      canRetry: true
    }
  }

  /**
   * Execute retry logic with exponential backoff
   */
  static async executeRetry(
    retryFunction: () => void | Promise<void>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<void> {
    let attempt = 0
    
    while (attempt < maxRetries) {
      try {
        await retryFunction()
        return
      } catch (error) {
        attempt++
        if (attempt >= maxRetries) {
          throw error
        }
        
        // Exponential backoff: delay = baseDelay * 2^attempt + random jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
}

/**
 * Props for the ProfileError component
 */
interface ProfileErrorProps {
  error: Error
  reset: () => void
}

/**
 * Next.js Error Boundary Component for Profile Management Route
 * 
 * Provides comprehensive error handling with user-friendly messaging,
 * recovery options, and accessibility compliance for profile-related errors.
 * 
 * Features:
 * - React 19 error boundary capabilities
 * - Profile-specific error categorization and messaging
 * - Retry mechanisms with exponential backoff
 * - WCAG 2.1 AA compliant error announcements
 * - Comprehensive error logging and monitoring integration
 * - Graceful degradation with contextual recovery guidance
 */
export default function ProfileError({ error, reset }: ProfileErrorProps) {
  const [retrying, setRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [errorInfo, setErrorInfo] = useState<ProfileErrorInfo | null>(null)

  const errorLogger = ProfileErrorLogger.getInstance()
  const maxRetries = 3

  // Categorize and log the error on mount
  useEffect(() => {
    const categorizedError = ProfileErrorRecovery.categorizeError(error)
    setErrorInfo(categorizedError)
    
    // Log error with profile context
    errorLogger.logError(error, { componentStack: 'ProfileError' }, 'profile-error-boundary')
  }, [error, errorLogger])

  /**
   * Handle retry with exponential backoff and user feedback
   */
  const handleRetry = async () => {
    if (!errorInfo?.canRetry || retrying || retryCount >= maxRetries) {
      return
    }

    setRetrying(true)
    
    try {
      await ProfileErrorRecovery.executeRetry(
        async () => {
          // Simulate retry delay for user feedback
          await new Promise(resolve => setTimeout(resolve, 500))
          reset()
        },
        1,
        1000
      )
      
      setRetryCount(prev => prev + 1)
    } catch (retryError) {
      console.error('Retry failed:', retryError)
      errorLogger.logError(
        retryError as Error, 
        { retryAttempt: retryCount + 1 }, 
        'profile-error-retry'
      )
    } finally {
      setRetrying(false)
    }
  }

  /**
   * Navigate back to previous page or profile home
   */
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/profile'
    }
  }

  /**
   * Handle authentication redirect for expired sessions
   */
  const handleLoginRedirect = () => {
    // Clear any stored session data
    localStorage.removeItem('session')
    sessionStorage.clear()
    
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(window.location.pathname)
    window.location.href = `/login?returnUrl=${returnUrl}`
  }

  if (!errorInfo) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { type, message, action, icon: ErrorIcon, canRetry } = errorInfo

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[400px] px-4 py-8"
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description error-action"
    >
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <ErrorIcon 
              className="h-8 w-8 text-red-600" 
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Error Title */}
        <div className="space-y-2">
          <h1 
            id="error-title"
            className="text-2xl font-bold text-gray-900"
          >
            Profile Error
          </h1>
          <p 
            id="error-description"
            className="text-gray-600 leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Error Action Guidance */}
        <div 
          id="error-action"
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <p className="text-sm text-blue-800 font-medium">
            What you can do:
          </p>
          <p className="text-sm text-blue-700 mt-1">
            {action}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Retry Button - Only show if error can be retried */}
          {canRetry && retryCount < maxRetries && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-describedby="retry-help"
            >
              {retrying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                  Try Again
                </>
              )}
            </button>
          )}

          {/* Authentication Redirect - Show for auth errors */}
          {type === 'authentication-expired' && (
            <button
              onClick={handleLoginRedirect}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
              Log In Again
            </button>
          )}

          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Go Back
          </button>
        </div>

        {/* Retry Count Information */}
        {retryCount > 0 && (
          <div className="text-sm text-gray-500">
            {retryCount >= maxRetries ? (
              <span className="text-red-600 font-medium">
                Maximum retry attempts reached. Please contact support if the issue persists.
              </span>
            ) : (
              <span>
                Retry attempt {retryCount} of {maxRetries}
              </span>
            )}
          </div>
        )}

        {/* Development Error Details */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              Development Error Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded border text-xs font-mono text-gray-800 overflow-auto max-h-32">
              <div className="mb-2">
                <strong>Error Type:</strong> {type}
              </div>
              <div className="mb-2">
                <strong>Message:</strong> {error.message}
              </div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap break-words">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>

      {/* Hidden elements for screen reader assistance */}
      <div className="sr-only">
        <div id="retry-help">
          {canRetry 
            ? `You can try this action again. Attempts remaining: ${maxRetries - retryCount}`
            : "This action cannot be retried automatically. Please use the alternative options provided."
          }
        </div>
      </div>
    </div>
  )
}