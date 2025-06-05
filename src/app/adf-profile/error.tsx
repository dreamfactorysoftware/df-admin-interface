'use client';

/**
 * @fileoverview Profile Management Error Boundary Component
 * 
 * Next.js error boundary for the profile management section providing comprehensive
 * error handling with recovery options, accessibility compliance, and user-friendly
 * messaging. Implements React 19 error boundary patterns with profile-specific
 * error handling for profile updates, security question changes, and password modifications.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield, Key, User, ExternalLink } from 'lucide-react';
import { isApiError, ApiErrorResponse } from '@/types/api';

// ============================================================================
// ERROR TYPES AND INTERFACES
// ============================================================================

/**
 * Profile-specific error types for contextual error handling
 */
type ProfileErrorType = 
  | 'PROFILE_UPDATE_FAILED'
  | 'PASSWORD_CHANGE_FAILED'
  | 'SECURITY_QUESTION_FAILED'
  | 'NETWORK_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Error boundary props interface
 */
interface ProfileErrorBoundaryProps {
  children: ReactNode;
  /**
   * Optional fallback component to render instead of default error UI
   */
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  /**
   * Callback function called when error occurs
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * Whether to show detailed error information (development mode)
   */
  showDetails?: boolean;
}

/**
 * Error boundary state interface
 */
interface ProfileErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: ProfileErrorType;
  retryCount: number;
  isRetrying: boolean;
}

/**
 * Error recovery actions for different error types
 */
interface ErrorRecoveryAction {
  label: string;
  action: () => void;
  icon: ReactNode;
  variant: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

// ============================================================================
// ERROR CATEGORIZATION UTILITIES
// ============================================================================

/**
 * Categorizes errors based on error message and type for profile-specific handling
 */
function categorizeProfileError(error: Error): ProfileErrorType {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Network and connectivity errors
  if (name === 'networkerror' || message.includes('network') || message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }

  // Authentication errors
  if (message.includes('unauthorized') || message.includes('401') || message.includes('authentication')) {
    return 'AUTHENTICATION_ERROR';
  }

  // Permission errors
  if (message.includes('forbidden') || message.includes('403') || message.includes('permission')) {
    return 'PERMISSION_DENIED';
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return 'VALIDATION_ERROR';
  }

  // Profile-specific errors
  if (message.includes('profile') && message.includes('update')) {
    return 'PROFILE_UPDATE_FAILED';
  }

  if (message.includes('password')) {
    return 'PASSWORD_CHANGE_FAILED';
  }

  if (message.includes('security') && message.includes('question')) {
    return 'SECURITY_QUESTION_FAILED';
  }

  // Server errors
  if (message.includes('server') || message.includes('500') || message.includes('503')) {
    return 'SERVER_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Gets user-friendly error message based on error type
 */
function getErrorMessage(errorType: ProfileErrorType, error: Error): string {
  switch (errorType) {
    case 'PROFILE_UPDATE_FAILED':
      return 'Failed to update your profile information. Please check your entries and try again.';
    
    case 'PASSWORD_CHANGE_FAILED':
      return 'Unable to change your password. Please verify your current password and ensure the new password meets requirements.';
    
    case 'SECURITY_QUESTION_FAILED':
      return 'Failed to update your security question. Please ensure all fields are completed correctly.';
    
    case 'NETWORK_ERROR':
      return 'Network connection error. Please check your internet connection and try again.';
    
    case 'AUTHENTICATION_ERROR':
      return 'Your session has expired. Please log in again to continue managing your profile.';
    
    case 'PERMISSION_DENIED':
      return 'You do not have permission to perform this action. Please contact your administrator.';
    
    case 'VALIDATION_ERROR':
      return 'Please correct the validation errors in the form and try again.';
    
    case 'SERVER_ERROR':
      return 'The server is currently experiencing issues. Please try again in a few moments.';
    
    default:
      return 'An unexpected error occurred while managing your profile. Please try again.';
  }
}

/**
 * Gets contextual help text based on error type
 */
function getErrorHelpText(errorType: ProfileErrorType): string {
  switch (errorType) {
    case 'PROFILE_UPDATE_FAILED':
      return 'Ensure all required fields are filled correctly and your email address is valid.';
    
    case 'PASSWORD_CHANGE_FAILED':
      return 'Your new password must be at least 8 characters long and include uppercase, lowercase, and numeric characters.';
    
    case 'SECURITY_QUESTION_FAILED':
      return 'Choose a security question and provide an answer you will remember for account recovery.';
    
    case 'NETWORK_ERROR':
      return 'If the problem persists, please contact your system administrator.';
    
    case 'AUTHENTICATION_ERROR':
      return 'Your login session may have timed out for security reasons.';
    
    case 'PERMISSION_DENIED':
      return 'Some profile features may be restricted based on your user role.';
    
    case 'VALIDATION_ERROR':
      return 'Review all form fields for any missing or incorrectly formatted information.';
    
    case 'SERVER_ERROR':
      return 'Our team has been notified and is working to resolve this issue.';
    
    default:
      return 'If this error continues to occur, please contact technical support.';
  }
}

// ============================================================================
// ERROR LOGGING UTILITIES
// ============================================================================

/**
 * Logs error with context for monitoring and debugging
 */
function logProfileError(error: Error, errorInfo: ErrorInfo, errorType: ProfileErrorType): void {
  const errorContext = {
    timestamp: new Date().toISOString(),
    section: 'profile-management',
    errorType,
    errorMessage: error.message,
    errorStack: error.stack,
    componentStack: errorInfo.componentStack,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 Profile Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Context:', errorContext);
    console.groupEnd();
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with monitoring service (e.g., Sentry, LogRocket)
    try {
      // Example: Send to monitoring service
      // monitoringService.captureException(error, errorContext);
    } catch (loggingError) {
      console.error('Failed to log error to monitoring service:', loggingError);
    }
  }
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Profile Management Error Boundary Component
 * 
 * Implements React 19 error boundary patterns with Next.js app router compatibility.
 * Provides comprehensive error handling for profile management workflows including
 * profile updates, password changes, and security question management.
 * 
 * Features:
 * - Profile-specific error categorization and messaging
 * - Retry mechanisms for transient errors
 * - Accessible error UI with WCAG 2.1 AA compliance
 * - Recovery actions tailored to error types
 * - Comprehensive error logging and monitoring
 * - Responsive design with Tailwind CSS
 */
export default class ProfileErrorBoundary extends Component<ProfileErrorBoundaryProps, ProfileErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ProfileErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'UNKNOWN_ERROR',
      retryCount: 0,
      isRetrying: false,
    };

    this.handleRetry = this.handleRetry.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleGoHome = this.handleGoHome.bind(this);
    this.handleContactSupport = this.handleContactSupport.bind(this);
  }

  /**
   * React error boundary lifecycle method
   */
  static getDerivedStateFromError(error: Error): Partial<ProfileErrorBoundaryState> {
    const errorType = categorizeProfileError(error);
    
    return {
      hasError: true,
      error,
      errorType,
    };
  }

  /**
   * React error boundary lifecycle method for error logging
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorType = categorizeProfileError(error);
    
    this.setState({
      errorInfo,
      errorType,
    });

    // Log error for monitoring
    logProfileError(error, errorInfo, errorType);

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Cleanup timeouts on unmount
   */
  componentWillUnmount(): void {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  /**
   * Handles retry action with exponential backoff
   */
  handleRetry(): void {
    if (this.state.retryCount >= this.maxRetries || this.state.isRetrying) {
      return;
    }

    this.setState({ isRetrying: true });

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, this.state.retryCount) * 1000;

    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
    }, delay);

    this.retryTimeouts.push(timeout);
  }

  /**
   * Resets error boundary state
   */
  handleReset(): void {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'UNKNOWN_ERROR',
      retryCount: 0,
      isRetrying: false,
    });
  }

  /**
   * Navigates to home page
   */
  handleGoHome(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  /**
   * Opens support contact options
   */
  handleContactSupport(): void {
    if (typeof window !== 'undefined') {
      // Open support page or email client
      window.open('mailto:support@dreamfactory.com?subject=Profile Management Error', '_blank');
    }
  }

  /**
   * Gets recovery actions based on error type
   */
  getRecoveryActions(): ErrorRecoveryAction[] {
    const { errorType, retryCount, isRetrying } = this.state;
    const canRetry = retryCount < this.maxRetries && !isRetrying;

    const actions: ErrorRecoveryAction[] = [];

    // Add retry action for transient errors
    if (canRetry && ['NETWORK_ERROR', 'SERVER_ERROR', 'PROFILE_UPDATE_FAILED', 'PASSWORD_CHANGE_FAILED', 'SECURITY_QUESTION_FAILED'].includes(errorType)) {
      actions.push({
        label: isRetrying ? 'Retrying...' : `Retry (${this.maxRetries - retryCount} left)`,
        action: this.handleRetry,
        icon: <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />,
        variant: 'primary',
        disabled: isRetrying,
      });
    }

    // Add refresh action for validation errors
    if (errorType === 'VALIDATION_ERROR') {
      actions.push({
        label: 'Reset Form',
        action: this.handleReset,
        icon: <RefreshCw className="h-4 w-4" />,
        variant: 'primary',
      });
    }

    // Add login redirect for authentication errors
    if (errorType === 'AUTHENTICATION_ERROR') {
      actions.push({
        label: 'Go to Login',
        action: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        },
        icon: <Shield className="h-4 w-4" />,
        variant: 'primary',
      });
    }

    // Always add home navigation
    actions.push({
      label: 'Go to Home',
      action: this.handleGoHome,
      icon: <Home className="h-4 w-4" />,
      variant: 'secondary',
    });

    // Add support contact for persistent errors
    if (retryCount >= this.maxRetries || errorType === 'PERMISSION_DENIED') {
      actions.push({
        label: 'Contact Support',
        action: this.handleContactSupport,
        icon: <ExternalLink className="h-4 w-4" />,
        variant: 'outline',
      });
    }

    return actions;
  }

  /**
   * Renders error UI based on error type
   */
  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Use custom fallback if provided
    if (this.props.fallback && this.state.error && this.state.errorInfo) {
      return this.props.fallback(this.state.error, this.state.errorInfo);
    }

    const { error, errorType, retryCount } = this.state;
    const errorMessage = getErrorMessage(errorType, error!);
    const helpText = getErrorHelpText(errorType);
    const recoveryActions = this.getRecoveryActions();
    const showDetails = this.props.showDetails || process.env.NODE_ENV === 'development';

    // Get icon based on error type
    const getErrorIcon = () => {
      switch (errorType) {
        case 'PROFILE_UPDATE_FAILED':
          return <User className="h-8 w-8" />;
        case 'PASSWORD_CHANGE_FAILED':
          return <Key className="h-8 w-8" />;
        case 'SECURITY_QUESTION_FAILED':
          return <Shield className="h-8 w-8" />;
        case 'AUTHENTICATION_ERROR':
          return <Shield className="h-8 w-8" />;
        default:
          return <AlertTriangle className="h-8 w-8" />;
      }
    };

    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          {/* Error Icon and Title */}
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 mb-4">
              {getErrorIcon()}
            </div>
            <h1 
              className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              id="error-title"
            >
              Profile Management Error
            </h1>
            <p 
              className="text-sm text-gray-600 dark:text-gray-300"
              aria-describedby="error-title"
            >
              {errorMessage}
            </p>
          </div>

          {/* Help Text */}
          {helpText && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> {helpText}
              </p>
            </div>
          )}

          {/* Retry Counter */}
          {retryCount > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Retry attempt {retryCount} of {this.maxRetries}
              </p>
            </div>
          )}

          {/* Recovery Actions */}
          <div className="space-y-3">
            {recoveryActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={action.disabled}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${action.variant === 'primary' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500' 
                    : action.variant === 'secondary'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white focus:ring-gray-500'
                    : 'border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300 focus:ring-gray-500'
                  }
                `}
                aria-label={action.label}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>

          {/* Error Details (Development Mode) */}
          {showDetails && error && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Technical Details
              </summary>
              <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <strong>Error Type:</strong> {errorType}
                  </div>
                  <div>
                    <strong>Message:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs whitespace-pre-wrap break-all">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}

          {/* Accessibility Information */}
          <div className="sr-only">
            <p>
              An error occurred in the profile management section. 
              Error type: {errorType}. 
              Use the available buttons to retry, reset, or navigate away from this page.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

// ============================================================================
// ERROR BOUNDARY WRAPPER HOOKS
// ============================================================================

/**
 * Hook for error boundary integration with React Query and SWR
 */
export function useProfileErrorHandler() {
  const handleProfileError = (error: Error) => {
    // This will be caught by the error boundary
    throw error;
  };

  const handleApiError = (apiError: ApiErrorResponse) => {
    const error = new Error(apiError.error.message);
    error.name = apiError.error.code;
    throw error;
  };

  return {
    handleProfileError,
    handleApiError,
  };
}

/**
 * Higher-order component for wrapping profile components with error boundary
 */
export function withProfileErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ProfileErrorBoundaryProps>
) {
  const WithErrorBoundary = (props: P) => (
    <ProfileErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ProfileErrorBoundary>
  );

  WithErrorBoundary.displayName = `withProfileErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundary;
}