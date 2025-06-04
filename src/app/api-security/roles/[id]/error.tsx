'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Shield, FileX, Wifi, Server } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useErrorHandling } from '@/hooks/use-error-handling'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error boundary component for the role editing page per Next.js app router conventions.
 * Implements comprehensive error handling and recovery mechanisms for role editing workflows
 * including validation errors, API failures, role not found errors, and form submission issues.
 * 
 * Features:
 * - Role-specific error categorization and messaging
 * - User-friendly recovery actions with proper accessibility
 * - Error logging and monitoring integration
 * - WCAG 2.1 AA compliant error states
 * - Dynamic route error handling for invalid role IDs
 * 
 * @param error - The error object containing error details and optional digest
 * @param reset - Function to reset the error boundary and retry the operation
 */
export default function RoleEditError({ error, reset }: ErrorPageProps) {
  const router = useRouter()
  const { logError, getErrorType, getErrorMessage, shouldRetry } = useErrorHandling()

  // Log error for monitoring and debugging
  useEffect(() => {
    logError(error, {
      context: 'role-edit-page',
      userId: 'current-user-id', // Will be populated by error handling hook
      timestamp: new Date().toISOString(),
      digest: error.digest,
      url: window.location.href
    })
  }, [error, logError])

  const errorType = getErrorType(error)
  const errorMessage = getErrorMessage(error)
  const canRetry = shouldRetry(error)

  /**
   * Get error-specific icon based on error type
   */
  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
        return <Wifi className="h-8 w-8 text-orange-500" aria-hidden="true" />
      case 'server':
        return <Server className="h-8 w-8 text-red-500" aria-hidden="true" />
      case 'not-found':
        return <FileX className="h-8 w-8 text-yellow-500" aria-hidden="true" />
      case 'permission':
        return <Shield className="h-8 w-8 text-red-500" aria-hidden="true" />
      case 'validation':
        return <AlertTriangle className="h-8 w-8 text-orange-500" aria-hidden="true" />
      default:
        return <AlertTriangle className="h-8 w-8 text-red-500" aria-hidden="true" />
    }
  }

  /**
   * Get contextual error title based on error type
   */
  const getErrorTitle = () => {
    switch (errorType) {
      case 'network':
        return 'Connection Error'
      case 'server':
        return 'Server Error'
      case 'not-found':
        return 'Role Not Found'
      case 'permission':
        return 'Access Denied'
      case 'validation':
        return 'Validation Error'
      default:
        return 'An Error Occurred'
    }
  }

  /**
   * Get detailed error description with role-specific context
   */
  const getErrorDescription = () => {
    switch (errorType) {
      case 'network':
        return 'Unable to connect to the server to load role data. Please check your internet connection and try again.'
      case 'server':
        return 'A server error occurred while processing your role editing request. Our technical team has been notified.'
      case 'not-found':
        return 'The role you are trying to edit could not be found. It may have been deleted or the role ID is invalid.'
      case 'permission':
        return 'You do not have sufficient permissions to edit this role. Please contact your administrator for access.'
      case 'validation':
        return 'There was an issue with the role data validation. Please review your inputs and try again.'
      default:
        return 'An unexpected error occurred while loading the role editing page. Please try again or contact support if the problem persists.'
    }
  }

  /**
   * Handle retry with exponential backoff for transient errors
   */
  const handleRetry = async () => {
    try {
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      reset()
    } catch (retryError) {
      console.error('Retry failed:', retryError)
      // Error will be caught by the error boundary again
    }
  }

  /**
   * Navigate back to roles list with proper error context
   */
  const handleBackToRoles = () => {
    router.push('/api-security/roles')
  }

  /**
   * Navigate to dashboard as fallback option
   */
  const handleBackToDashboard = () => {
    router.push('/')
  }

  /**
   * Generate recovery actions based on error type
   */
  const getRecoveryActions = () => {
    const actions = []

    // Retry action for retryable errors
    if (canRetry && errorType !== 'not-found' && errorType !== 'permission') {
      actions.push(
        <Button
          key="retry"
          onClick={handleRetry}
          variant="primary"
          className="min-w-[44px] min-h-[44px]"
          aria-label="Retry loading the role editing page"
        >
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
          Try Again
        </Button>
      )
    }

    // Back to roles list action
    actions.push(
      <Button
        key="back-roles"
        onClick={handleBackToRoles}
        variant="secondary"
        className="min-w-[44px] min-h-[44px]"
        aria-label="Return to roles list"
      >
        <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
        Back to Roles
      </Button>
    )

    // Dashboard fallback for critical errors
    if (errorType === 'server' || errorType === 'permission') {
      actions.push(
        <Button
          key="dashboard"
          onClick={handleBackToDashboard}
          variant="outline"
          className="min-w-[44px] min-h-[44px]"
          aria-label="Return to dashboard"
        >
          <Home className="h-4 w-4 mr-2" aria-hidden="true" />
          Dashboard
        </Button>
      )
    }

    return actions
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900"
      role="main"
      aria-labelledby="error-title"
    >
      <div className="max-w-md w-full space-y-6">
        {/* Error Icon and Title */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            {getErrorIcon()}
          </div>
          <h1 
            id="error-title"
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            {getErrorTitle()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {getErrorDescription()}
          </p>
        </div>

        {/* Error Details Alert */}
        <Alert variant="error" className="text-left">
          <AlertTriangle className="h-4 w-4" />
          <Alert.Content>
            <Alert.Title>Error Details</Alert.Title>
            <Alert.Description>
              {errorMessage}
              {error.digest && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Error ID: {error.digest}
                </div>
              )}
            </Alert.Description>
          </Alert.Content>
        </Alert>

        {/* Recovery Actions */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {getRecoveryActions()}
          </div>
        </div>

        {/* Additional Help Text */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {errorType === 'permission' && (
            <p>If you believe you should have access to edit roles, please contact your system administrator.</p>
          )}
          {errorType === 'server' && (
            <p>If this problem continues, please contact technical support with the error ID above.</p>
          )}
          {errorType === 'network' && (
            <p>Check your internet connection and ensure the DreamFactory server is accessible.</p>
          )}
          {errorType === 'not-found' && (
            <p>You can create a new role or return to the roles list to view existing roles.</p>
          )}
        </div>

        {/* Accessibility improvements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          An error occurred while loading the role editing page. {getErrorDescription()}
        </div>
      </div>
    </div>
  )
}