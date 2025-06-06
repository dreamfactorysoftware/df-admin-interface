'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Wifi, Shield, Database, Globe, Bug, ExternalLink } from 'lucide-react'

/**
 * Error boundary component for database service creation page
 * Implements comprehensive error handling and recovery workflows following Next.js conventions
 * Supports error recovery flows from Section 7.2.3 including connection timeout recovery,
 * authentication error correction, and network diagnostics
 */

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
  isRetrying: boolean
  errorType: ErrorType
  errorId: string
}

type ErrorType = 
  | 'connection_timeout'
  | 'authentication_error'
  | 'network_error'
  | 'validation_error'
  | 'server_error'
  | 'permission_error'
  | 'database_error'
  | 'unknown_error'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onRetry?: () => void
  maxRetries?: number
}

interface ErrorDetails {
  type: ErrorType
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  actionable: boolean
  recoverable: boolean
  diagnosticSteps: string[]
  retryable: boolean
}

/**
 * Determines error type and provides categorized error handling
 * Based on error patterns from Section 4.2.1 Error Handling Flowchart
 */
const categorizeError = (error: Error): ErrorType => {
  const message = error.message.toLowerCase()
  const stack = error.stack?.toLowerCase() || ''

  // Connection and network errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'connection_timeout'
  }
  
  if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
    return 'network_error'
  }

  // Authentication and authorization errors
  if (message.includes('unauthorized') || message.includes('401') || message.includes('authentication')) {
    return 'authentication_error'
  }

  if (message.includes('forbidden') || message.includes('403') || message.includes('permission')) {
    return 'permission_error'
  }

  // Database-specific errors
  if (message.includes('database') || message.includes('connection') || message.includes('sql')) {
    return 'database_error'
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return 'validation_error'
  }

  // Server errors
  if (message.includes('500') || message.includes('internal server') || message.includes('server')) {
    return 'server_error'
  }

  return 'unknown_error'
}

/**
 * Error details mapping following Section 7.2.3 Error Handling and Recovery Workflows
 */
const getErrorDetails = (errorType: ErrorType): ErrorDetails => {
  const errorMap: Record<ErrorType, ErrorDetails> = {
    connection_timeout: {
      type: 'connection_timeout',
      title: 'Connection Timeout',
      description: 'The database connection attempt timed out. This may be due to network issues or server unavailability.',
      icon: Globe,
      actionable: true,
      recoverable: true,
      retryable: true,
      diagnosticSteps: [
        'Check your network connection',
        'Verify the database server is running',
        'Confirm firewall settings allow connections',
        'Check if the host address and port are correct'
      ]
    },
    authentication_error: {
      type: 'authentication_error',
      title: 'Authentication Failed',
      description: 'Unable to authenticate with the database using the provided credentials.',
      icon: Shield,
      actionable: true,
      recoverable: true,
      retryable: false,
      diagnosticSteps: [
        'Verify your username and password are correct',
        'Check if the database user exists',
        'Confirm the user has necessary permissions',
        'Ensure the authentication method is supported'
      ]
    },
    network_error: {
      type: 'network_error',
      title: 'Network Connection Error',
      description: 'Unable to establish a network connection to the database server.',
      icon: Wifi,
      actionable: true,
      recoverable: true,
      retryable: true,
      diagnosticSteps: [
        'Check your internet connection',
        'Verify the server hostname or IP address',
        'Confirm the port number is correct',
        'Check if a VPN connection is required'
      ]
    },
    validation_error: {
      type: 'validation_error',
      title: 'Validation Error',
      description: 'The connection information provided contains invalid or incomplete data.',
      icon: AlertTriangle,
      actionable: true,
      recoverable: true,
      retryable: false,
      diagnosticSteps: [
        'Review all required fields are filled',
        'Check that field formats are correct',
        'Verify numeric values are within valid ranges',
        'Ensure special characters are properly escaped'
      ]
    },
    server_error: {
      type: 'server_error',
      title: 'Server Error',
      description: 'An internal server error occurred while processing your request.',
      icon: Database,
      actionable: true,
      recoverable: true,
      retryable: true,
      diagnosticSteps: [
        'Wait a moment and try again',
        'Check the server status page',
        'Verify the DreamFactory service is running',
        'Contact your system administrator if the issue persists'
      ]
    },
    permission_error: {
      type: 'permission_error',
      title: 'Access Denied',
      description: 'You do not have permission to create database connections.',
      icon: Shield,
      actionable: true,
      recoverable: false,
      retryable: false,
      diagnosticSteps: [
        'Contact your administrator to request permissions',
        'Verify your user role includes database management',
        'Check if your account is active and not suspended',
        'Review the system access policies'
      ]
    },
    database_error: {
      type: 'database_error',
      title: 'Database Connection Error',
      description: 'Failed to establish a connection to the database server.',
      icon: Database,
      actionable: true,
      recoverable: true,
      retryable: true,
      diagnosticSteps: [
        'Verify the database server is accessible',
        'Check the connection parameters',
        'Confirm the database exists',
        'Test connectivity from the server network'
      ]
    },
    unknown_error: {
      type: 'unknown_error',
      title: 'Unexpected Error',
      description: 'An unexpected error occurred. Please try again or contact support.',
      icon: Bug,
      actionable: true,
      recoverable: true,
      retryable: true,
      diagnosticSteps: [
        'Refresh the page and try again',
        'Clear your browser cache and cookies',
        'Try using a different browser',
        'Contact technical support with error details'
      ]
    }
  }

  return errorMap[errorType]
}

/**
 * Implements exponential backoff retry strategy for connection and network errors
 * Following performance requirements from React/Next.js Integration Requirements
 */
const calculateRetryDelay = (retryCount: number): number => {
  const baseDelay = 1000 // 1 second base delay
  const maxDelay = 30000 // 30 seconds maximum delay
  const exponentialDelay = baseDelay * Math.pow(2, retryCount)
  return Math.min(exponentialDelay, maxDelay)
}

/**
 * Generates unique error ID for tracking and debugging
 */
const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Logs error details for monitoring and debugging
 * Integrates with application logging infrastructure
 */
const logError = (error: Error, errorInfo: ErrorInfo, errorId: string, errorType: ErrorType): void => {
  // Enhanced error logging for monitoring and debugging
  const errorData = {
    id: errorId,
    type: errorType,
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: null, // Would be populated from auth context
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Boundary - Error Details:', errorData)
  }

  // In production, send to logging service
  // This would integrate with your monitoring infrastructure
  try {
    // Example: Send to logging service
    // loggerService.logError(errorData)
  } catch (loggingError) {
    console.error('Failed to log error:', loggingError)
  }
}

export default class DatabaseCreateErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      errorType: 'unknown_error',
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorType = categorizeError(error)
    const errorId = generateErrorId()
    
    return {
      hasError: true,
      error,
      errorType,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = categorizeError(error)
    const errorId = generateErrorId()
    
    // Log error for monitoring and debugging
    logError(error, errorInfo, errorId, errorType)
    
    // Update state with error information
    this.setState({
      error,
      errorInfo,
      errorType,
      errorId
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  /**
   * Handles retry mechanism with exponential backoff
   * Implements retry logic from Section 7.2.3 Connection Error Recovery Flow
   */
  handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount, errorType } = this.state
    const errorDetails = getErrorDetails(errorType)

    if (!errorDetails.retryable || retryCount >= maxRetries) {
      return
    }

    this.setState({ isRetrying: true })

    const delay = calculateRetryDelay(retryCount)
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
        isRetrying: false
      })

      // Call optional retry handler
      if (this.props.onRetry) {
        this.props.onRetry()
      }
    }, delay)
  }

  /**
   * Resets error boundary state for manual recovery
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      errorType: 'unknown_error',
      errorId: ''
    })
  }

  /**
   * Handles navigation to credential correction flow
   * Supports credential correction from Section 7.2.3
   */
  handleCredentialCorrection = () => {
    // Navigate back to form with focus on credential fields
    window.history.back()
  }

  /**
   * Opens network diagnostics interface
   * Supports network diagnostics from Section 7.2.3
   */
  handleNetworkDiagnostics = () => {
    // In a real implementation, this would open a diagnostic modal
    // For now, provide basic network diagnostic information
    alert('Network Diagnostics:\n\nPlease check:\n- Internet connection\n- VPN status\n- Firewall settings\n- Server accessibility')
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    const { error, errorType, retryCount, isRetrying, errorId } = this.state
    const { maxRetries = 3 } = this.props
    const errorDetails = getErrorDetails(errorType)
    const canRetry = errorDetails.retryable && retryCount < maxRetries
    const IconComponent = errorDetails.icon

    return (
      <div 
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        role="alert"
        aria-live="assertive"
        aria-labelledby="error-title"
        aria-describedby="error-description"
      >
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border border-gray-200">
          {/* Error Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <IconComponent 
                  className="h-8 w-8 text-red-500" 
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <h1 
                  id="error-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {errorDetails.title}
                </h1>
                <p 
                  id="error-description"
                  className="mt-1 text-gray-600"
                >
                  {errorDetails.description}
                </p>
              </div>
            </div>
            
            {/* Error ID for debugging */}
            <div className="mt-4 text-xs text-gray-500 font-mono">
              Error ID: {errorId}
            </div>
          </div>

          {/* Recovery Actions */}
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Primary Action - Retry */}
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  disabled={isRetrying}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={`Retry connection attempt ${retryCount + 1} of ${maxRetries}`}
                >
                  <RefreshCw 
                    className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  {isRetrying ? 'Retrying...' : `Retry (${maxRetries - retryCount} left)`}
                </button>
              )}

              {/* Reset Action */}
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                aria-label="Reset and try again"
              >
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Start Over
              </button>

              {/* Credential Correction for Auth Errors */}
              {errorType === 'authentication_error' && (
                <button
                  onClick={this.handleCredentialCorrection}
                  className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
                  aria-label="Go back to correct credentials"
                >
                  <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                  Fix Credentials
                </button>
              )}

              {/* Network Diagnostics for Network Errors */}
              {(errorType === 'network_error' || errorType === 'connection_timeout') && (
                <button
                  onClick={this.handleNetworkDiagnostics}
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                  aria-label="Open network diagnostics"
                >
                  <Wifi className="h-4 w-4 mr-2" aria-hidden="true" />
                  Network Check
                </button>
              )}
            </div>

            {/* Diagnostic Steps */}
            {errorDetails.diagnosticSteps.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Diagnostic Steps:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {errorDetails.diagnosticSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 h-5 w-5 text-gray-400 mr-2">
                        {index + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Technical Details (Development)
                </summary>
                <div className="mt-3 p-4 bg-gray-50 rounded-md">
                  <div className="text-xs font-mono text-gray-700">
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}

            {/* Contact Support */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <div className="flex items-start">
                <ExternalLink className="h-5 w-5 text-blue-400 mt-0.5 mr-3" aria-hidden="true" />
                <div className="text-sm">
                  <p className="text-blue-700 font-medium">
                    Need additional help?
                  </p>
                  <p className="text-blue-600 mt-1">
                    Contact support with error ID <code className="bg-blue-100 px-1 rounded">{errorId}</code> for faster assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Retry Progress Indicator */}
        {isRetrying && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" aria-hidden="true" />
                <span className="text-gray-900">Retrying connection...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

/**
 * Export convenience hook for using the error boundary with functional components
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <DatabaseCreateErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </DatabaseCreateErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}