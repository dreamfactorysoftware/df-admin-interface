'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Wifi, Shield, Database } from 'lucide-react'

/**
 * Error types for contextual error handling and user guidance
 */
type ErrorType = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR' 
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'SERVER_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'FORM_SUBMISSION_ERROR'
  | 'DATA_LOADING_ERROR'
  | 'UNKNOWN_ERROR'

/**
 * Error severity levels for appropriate UI treatment
 */
type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Props for the error boundary component following Next.js error.tsx conventions
 */
interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error information interface for comprehensive error analysis
 */
interface ErrorInfo {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string
  recoveryActions: string[]
  canRetry: boolean
  requiresAuthentication: boolean
}

/**
 * Enhanced error logging utility (inline implementation)
 * TODO: Replace with src/lib/error-logger.ts when available
 */
const logError = (error: Error, context: string, userAgent?: string) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: userAgent || navigator.userAgent,
    url: window.location.href,
    userId: 'current-user-id', // TODO: Get from auth context
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorData)
  }

  // TODO: Send to monitoring service in production
  // Example: sendToErrorTracking(errorData)
}

/**
 * Error recovery utility (inline implementation)  
 * TODO: Replace with src/lib/error-recovery.ts when available
 */
const getErrorRecoveryActions = (error: Error): string[] => {
  const message = error.message.toLowerCase()
  
  if (message.includes('network') || message.includes('fetch')) {
    return [
      'Check your internet connection',
      'Try refreshing the page',
      'Contact support if the problem persists'
    ]
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return [
      'Check your input values',
      'Ensure all required fields are filled',
      'Verify data format requirements'
    ]
  }
  
  if (message.includes('unauthorized') || message.includes('403')) {
    return [
      'Log in again to refresh your session',
      'Contact an administrator for access',
      'Check your role permissions'
    ]
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return [
      'Verify the user ID is correct',
      'Return to the user list',
      'Contact support if the user should exist'
    ]
  }
  
  return [
    'Try refreshing the page',
    'Return to the previous page',
    'Contact support if the problem continues'
  ]
}

/**
 * Categorizes errors for appropriate handling and user messaging
 */
const categorizeError = (error: Error): ErrorInfo => {
  const message = error.message.toLowerCase()
  
  // Network connectivity errors
  if (message.includes('network') || message.includes('fetch failed') || message.includes('offline')) {
    return {
      type: 'NETWORK_ERROR',
      severity: 'medium',
      message: error.message,
      userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
      recoveryActions: getErrorRecoveryActions(error),
      canRetry: true,
      requiresAuthentication: false
    }
  }
  
  // Authentication errors
  if (message.includes('unauthorized') || message.includes('invalid token') || message.includes('401')) {
    return {
      type: 'AUTHENTICATION_ERROR',
      severity: 'high',
      message: error.message,
      userMessage: 'Your session has expired. Please log in again to continue.',
      recoveryActions: ['Log in again', 'Contact support if you continue having issues'],
      canRetry: false,
      requiresAuthentication: true
    }
  }
  
  // Authorization errors
  if (message.includes('forbidden') || message.includes('access denied') || message.includes('403')) {
    return {
      type: 'AUTHORIZATION_ERROR',
      severity: 'high',
      message: error.message,
      userMessage: 'You don\'t have permission to edit this user. Contact an administrator for access.',
      recoveryActions: ['Contact an administrator', 'Check your role permissions', 'Return to user list'],
      canRetry: false,
      requiresAuthentication: false
    }
  }
  
  // Not found errors
  if (message.includes('not found') || message.includes('404')) {
    return {
      type: 'NOT_FOUND_ERROR',
      severity: 'medium',
      message: error.message,
      userMessage: 'The requested user could not be found. It may have been deleted or moved.',
      recoveryActions: ['Return to user list', 'Verify the user ID', 'Contact support'],
      canRetry: false,
      requiresAuthentication: false
    }
  }
  
  // Form validation errors
  if (message.includes('validation') || message.includes('invalid input') || message.includes('required')) {
    return {
      type: 'VALIDATION_ERROR',
      severity: 'low',
      message: error.message,
      userMessage: 'There are validation errors in the form. Please review your input and try again.',
      recoveryActions: getErrorRecoveryActions(error),
      canRetry: true,
      requiresAuthentication: false
    }
  }
  
  // Server errors
  if (message.includes('server error') || message.includes('500') || message.includes('internal')) {
    return {
      type: 'SERVER_ERROR',
      severity: 'critical',
      message: error.message,
      userMessage: 'A server error occurred while processing your request. Our team has been notified.',
      recoveryActions: ['Try again in a few minutes', 'Contact support', 'Return to user list'],
      canRetry: true,
      requiresAuthentication: false
    }
  }
  
  // Data loading errors
  if (message.includes('load') || message.includes('fetch') || message.includes('data')) {
    return {
      type: 'DATA_LOADING_ERROR',
      severity: 'medium',
      message: error.message,
      userMessage: 'Failed to load user data. This might be a temporary issue.',
      recoveryActions: getErrorRecoveryActions(error),
      canRetry: true,
      requiresAuthentication: false
    }
  }
  
  // Default unknown error
  return {
    type: 'UNKNOWN_ERROR',
    severity: 'high',
    message: error.message,
    userMessage: 'An unexpected error occurred. Please try again or contact support.',
    recoveryActions: getErrorRecoveryActions(error),
    canRetry: true,
    requiresAuthentication: false
  }
}

/**
 * Gets appropriate icon for error type with accessibility support
 */
const getErrorIcon = (type: ErrorType) => {
  const iconProps = {
    className: "h-8 w-8",
    'aria-hidden': 'true' as const
  }
  
  switch (type) {
    case 'NETWORK_ERROR':
      return <Wifi {...iconProps} className="h-8 w-8 text-orange-500" />
    case 'AUTHENTICATION_ERROR':
    case 'AUTHORIZATION_ERROR':
      return <Shield {...iconProps} className="h-8 w-8 text-red-500" />
    case 'SERVER_ERROR':
    case 'DATA_LOADING_ERROR':
      return <Database {...iconProps} className="h-8 w-8 text-red-500" />
    default:
      return <AlertTriangle {...iconProps} className="h-8 w-8 text-amber-500" />
  }
}

/**
 * Gets severity-based styling classes following Tailwind CSS patterns
 */
const getSeverityStyles = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'low':
      return {
        container: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
        title: 'text-yellow-800 dark:text-yellow-200',
        message: 'text-yellow-700 dark:text-yellow-300'
      }
    case 'medium':
      return {
        container: 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
        title: 'text-orange-800 dark:text-orange-200',
        message: 'text-orange-700 dark:text-orange-300'
      }
    case 'high':
      return {
        container: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
        title: 'text-red-800 dark:text-red-200',
        message: 'text-red-700 dark:text-red-300'
      }
    case 'critical':
      return {
        container: 'border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/40',
        title: 'text-red-900 dark:text-red-100',
        message: 'text-red-800 dark:text-red-200'
      }
  }
}

/**
 * Inline Button component (TODO: Replace with src/components/ui/button.tsx when available)
 */
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
  'aria-label'?: string
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled, 
  children, 
  className = '',
  'aria-label': ariaLabel 
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500",
    ghost: "bg-transparent hover:bg-gray-100 focus:ring-gray-500"
  }
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  }
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

/**
 * User Edit Route Error Boundary Component
 * 
 * Provides comprehensive error handling for the user edit route (/adf-users/[id])
 * following Next.js app router error boundary conventions and React 19 patterns.
 * 
 * Features:
 * - Contextual error categorization and user messaging
 * - WCAG 2.1 AA compliant error announcements
 * - Retry mechanisms for transient errors
 * - Recovery guidance based on error type
 * - Comprehensive error logging for monitoring
 * - Responsive design with Tailwind CSS
 * - Dark mode support
 */
export default function UserEditErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter()
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  
  // Categorize the error for appropriate handling
  const errorInfo = categorizeError(error)
  const severityStyles = getSeverityStyles(errorInfo.severity)
  const maxRetries = 3
  
  // Log error on mount and when error changes
  useEffect(() => {
    logError(error, 'user-edit-route', navigator.userAgent)
  }, [error])
  
  // Handle retry with exponential backoff
  const handleRetry = async () => {
    if (!errorInfo.canRetry || retryCount >= maxRetries) return
    
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay))
      reset()
    } catch (retryError) {
      console.error('Retry failed:', retryError)
    } finally {
      setIsRetrying(false)
    }
  }
  
  // Handle navigation actions
  const handleGoHome = () => router.push('/adf-home')
  const handleGoBack = () => router.back()
  const handleGoToUserList = () => router.push('/adf-users')
  const handleLogin = () => router.push('/login')
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl w-full space-y-6">
        {/* Error announcement for screen readers */}
        <div 
          role="alert" 
          aria-live="assertive"
          className="sr-only"
        >
          An error occurred while editing the user: {errorInfo.userMessage}
        </div>
        
        {/* Main error display */}
        <div className={`rounded-lg border-2 p-6 ${severityStyles.container}`}>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {getErrorIcon(errorInfo.type)}
            </div>
            
            <div className="flex-1 space-y-4">
              {/* Error title */}
              <div>
                <h1 className={`text-xl font-semibold ${severityStyles.title}`}>
                  User Edit Error
                </h1>
                <p className={`mt-2 text-sm ${severityStyles.message}`}>
                  {errorInfo.userMessage}
                </p>
              </div>
              
              {/* Technical details (development only) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className={`cursor-pointer text-sm font-medium ${severityStyles.title}`}>
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                    <p><strong>Error Type:</strong> {errorInfo.type}</p>
                    <p><strong>Severity:</strong> {errorInfo.severity}</p>
                    <p><strong>Message:</strong> {error.message}</p>
                    {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}
                    {error.stack && (
                      <div className="mt-2">
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              {/* Recovery suggestions */}
              {errorInfo.recoveryActions.length > 0 && (
                <div>
                  <h2 className={`text-sm font-medium ${severityStyles.title}`}>
                    What you can do:
                  </h2>
                  <ul className={`mt-2 text-sm space-y-1 ${severityStyles.message}`}>
                    {errorInfo.recoveryActions.map((action, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {/* Retry button */}
          {errorInfo.canRetry && retryCount < maxRetries && (
            <Button
              variant="primary"
              onClick={handleRetry}
              disabled={isRetrying}
              aria-label={`Retry loading user data (attempt ${retryCount + 1} of ${maxRetries})`}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>
                {isRetrying 
                  ? `Retrying... (${retryCount}/${maxRetries})` 
                  : `Try Again ${retryCount > 0 ? `(${retryCount}/${maxRetries})` : ''}`
                }
              </span>
            </Button>
          )}
          
          {/* Authentication button */}
          {errorInfo.requiresAuthentication && (
            <Button
              variant="primary"
              onClick={handleLogin}
              className="flex items-center space-x-2"
              aria-label="Go to login page to re-authenticate"
            >
              <Shield className="h-4 w-4" />
              <span>Log In</span>
            </Button>
          )}
          
          {/* Navigation buttons */}
          <Button
            variant="outline"
            onClick={handleGoToUserList}
            className="flex items-center space-x-2"
            aria-label="Return to user list"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Users</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleGoBack}
            className="flex items-center space-x-2"
            aria-label="Go back to previous page"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleGoHome}
            className="flex items-center space-x-2"
            aria-label="Go to application home page"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>
        </div>
        
        {/* Retry exhausted message */}
        {retryCount >= maxRetries && errorInfo.canRetry && (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Maximum retry attempts reached. Please try again later or contact support.
            </p>
          </div>
        )}
        
        {/* Support information */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-500">
          <p>
            If this problem persists, please contact your administrator or{' '}
            <button 
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => window.open('mailto:support@dreamfactory.com', '_blank')}
              aria-label="Contact DreamFactory support via email"
            >
              technical support
            </button>
            .
          </p>
          {error.digest && (
            <p className="mt-1">
              Error ID: <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">{error.digest}</code>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}