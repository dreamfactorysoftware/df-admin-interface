'use client';

import React, { Component, ReactNode } from 'react';
import { RefreshCcw, AlertTriangle, Shield, Users, Home, ArrowLeft } from 'lucide-react';

// Types for error classification and handling
interface AdminError {
  type: 'validation' | 'permission' | 'network' | 'server' | 'unknown';
  code?: string;
  message: string;
  field?: string;
  context?: Record<string, any>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AdminError | null;
  errorId: string | null;
  retryCount: number;
  isRetrying: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AdminError, errorInfo: React.ErrorInfo) => void;
}

// Error classification utility matching Angular parseError patterns
function classifyAdminError(error: Error): AdminError {
  const message = error.message || 'An unexpected error occurred';
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR'
    };
  }
  
  // Permission errors
  if (message.includes('403') || message.includes('unauthorized') || message.includes('permission')) {
    return {
      type: 'permission',
      message: 'You do not have permission to create administrator accounts. Please contact your system administrator.',
      code: 'PERMISSION_DENIED'
    };
  }
  
  // Validation errors - matching Angular parseError patterns
  if (message.includes('Duplicate entry') && message.includes('user_email_unique')) {
    return {
      type: 'validation',
      message: 'This email address is already registered. Please use a different email address.',
      code: 'DUPLICATE_EMAIL',
      field: 'email'
    };
  }
  
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return {
      type: 'validation',
      message: 'Please check your input and correct any validation errors.',
      code: 'VALIDATION_ERROR'
    };
  }
  
  // Server errors
  if (message.includes('500') || message.includes('server') || message.includes('internal')) {
    return {
      type: 'server',
      message: 'The server encountered an error. Please try again in a few moments.',
      code: 'SERVER_ERROR'
    };
  }
  
  // Unknown errors
  return {
    type: 'unknown',
    message: message || 'An unexpected error occurred while creating the administrator account.',
    code: 'UNKNOWN_ERROR'
  };
}

// Error logging utility (interface for future implementation)
function logError(error: AdminError, errorInfo: React.ErrorInfo, context: Record<string, any> = {}) {
  const errorLog = {
    ...error,
    stack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    context: {
      route: '/adf-admins/create',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      ...context
    }
  };
  
  // Console logging for development
  console.error('Admin Creation Error:', errorLog);
  
  // TODO: Integrate with error-logger.ts when available
  // errorLogger.logError(errorLog);
}

// Recovery suggestions based on error type
function getRecoveryActions(error: AdminError): Array<{ label: string; action: string; primary?: boolean }> {
  switch (error.type) {
    case 'network':
      return [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Check Connection', action: 'check-network' },
        { label: 'Go Back', action: 'back' }
      ];
    
    case 'permission':
      return [
        { label: 'Contact Administrator', action: 'contact-admin', primary: true },
        { label: 'View Admin List', action: 'admin-list' },
        { label: 'Go Home', action: 'home' }
      ];
    
    case 'validation':
      return [
        { label: 'Go Back to Form', action: 'back', primary: true },
        { label: 'Clear Form', action: 'clear-form' }
      ];
    
    case 'server':
      return [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Wait and Retry', action: 'delayed-retry' },
        { label: 'Go Back', action: 'back' }
      ];
    
    default:
      return [
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Go Back', action: 'back' },
        { label: 'Go Home', action: 'home' }
      ];
  }
}

// Error icon component with animation
function ErrorIcon({ type }: { type: AdminError['type'] }) {
  const iconClass = "w-16 h-16 mx-auto mb-4 animate-pulse";
  
  switch (type) {
    case 'permission':
      return <Shield className={`${iconClass} text-red-500`} aria-hidden="true" />;
    case 'validation':
      return <Users className={`${iconClass} text-amber-500`} aria-hidden="true" />;
    case 'network':
      return <RefreshCcw className={`${iconClass} text-blue-500`} aria-hidden="true" />;
    default:
      return <AlertTriangle className={`${iconClass} text-red-500`} aria-hidden="true" />;
  }
}

// Action button component
function ActionButton({ 
  label, 
  action, 
  primary = false, 
  loading = false, 
  onClick 
}: { 
  label: string; 
  action: string; 
  primary?: boolean; 
  loading?: boolean; 
  onClick: (action: string) => void; 
}) {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const primaryClasses = "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500";
  const secondaryClasses = "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:focus:ring-gray-400";
  
  return (
    <button
      className={`${baseClasses} ${primary ? primaryClasses : secondaryClasses}`}
      onClick={() => onClick(action)}
      disabled={loading}
      aria-label={loading ? `${label} - Loading` : label}
    >
      {loading && (
        <RefreshCcw className="w-4 h-4 mr-2 animate-spin inline" aria-hidden="true" />
      )}
      {label}
    </button>
  );
}

// Main error boundary component
export default class AdminCreateErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const classifiedError = classifyAdminError(error);
    const errorId = `admin-create-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error: classifiedError,
      errorId,
      isRetrying: false
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const classifiedError = classifyAdminError(error);
    
    // Log error for monitoring and debugging
    logError(classifiedError, errorInfo, {
      retryCount: this.state.retryCount,
      errorId: this.state.errorId
    });
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(classifiedError, errorInfo);
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }
    
    this.setState({ isRetrying: true });
    
    // Exponential backoff for retries
    const delay = Math.pow(2, this.state.retryCount) * 1000; // 1s, 2s, 4s
    
    const timeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
    }, delay);
    
    this.retryTimeouts.push(timeout);
  };

  handleAction = (action: string) => {
    switch (action) {
      case 'retry':
        this.handleRetry();
        break;
      case 'delayed-retry':
        // Longer delay for server errors
        this.setState({ isRetrying: true });
        const timeout = setTimeout(() => {
          this.handleRetry();
        }, 5000);
        this.retryTimeouts.push(timeout);
        break;
      case 'back':
        if (typeof window !== 'undefined') {
          window.history.back();
        }
        break;
      case 'admin-list':
        if (typeof window !== 'undefined') {
          window.location.href = '/adf-admins';
        }
        break;
      case 'home':
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        break;
      case 'check-network':
        // Open network settings or provide guidance
        alert('Please check your internet connection and try again.');
        break;
      case 'contact-admin':
        // Could integrate with help system
        alert('Please contact your system administrator for assistance.');
        break;
      case 'clear-form':
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { error } = this.state;
      const actions = getRecoveryActions(error);
      const canRetry = this.state.retryCount < this.maxRetries && 
                      (error.type === 'network' || error.type === 'server');

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Error announcement for screen readers */}
            <div 
              role="alert" 
              aria-live="assertive" 
              className="sr-only"
              aria-describedby="error-title error-description"
            >
              Admin creation error: {error.message}
            </div>
            
            <div className="text-center">
              {/* Error icon */}
              <ErrorIcon type={error.type} />
              
              {/* Error title */}
              <h1 
                id="error-title"
                className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100"
              >
                {error.type === 'permission' && 'Access Denied'}
                {error.type === 'validation' && 'Validation Error'}
                {error.type === 'network' && 'Connection Error'}
                {error.type === 'server' && 'Server Error'}
                {error.type === 'unknown' && 'Unexpected Error'}
              </h1>
              
              {/* Error description */}
              <p 
                id="error-description"
                className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
              >
                {error.message}
              </p>
              
              {/* Error details for debugging */}
              {error.code && (
                <details className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    Technical Details
                  </summary>
                  <div className="mt-2 text-left bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    <p><strong>Error Code:</strong> {error.code}</p>
                    {error.field && <p><strong>Field:</strong> {error.field}</p>}
                    {this.state.errorId && <p><strong>Error ID:</strong> {this.state.errorId}</p>}
                    <p><strong>Retry Count:</strong> {this.state.retryCount}/{this.maxRetries}</p>
                  </div>
                </details>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="mt-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {actions.map((action, index) => (
                  <ActionButton
                    key={`${action.action}-${index}`}
                    label={action.label}
                    action={action.action}
                    primary={action.primary}
                    loading={this.state.isRetrying && (action.action === 'retry' || action.action === 'delayed-retry')}
                    onClick={this.handleAction}
                  />
                ))}
              </div>
              
              {/* Retry information */}
              {canRetry && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Retry {this.state.retryCount + 1} of {this.maxRetries} attempts
                  </p>
                </div>
              )}
              
              {/* Maximum retries reached */}
              {this.state.retryCount >= this.maxRetries && error.type !== 'permission' && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mr-2" aria-hidden="true" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Maximum retry attempts reached. Please contact support if the issue persists.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation helpers */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center space-x-6 text-sm">
                <button
                  onClick={() => this.handleAction('admin-list')}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  aria-label="Return to administrator list"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                  Admin List
                </button>
                <button
                  onClick={() => this.handleAction('home')}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  aria-label="Return to home page"
                >
                  <Home className="w-4 h-4 mr-1" aria-hidden="true" />
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render children when no error
    return this.props.children;
  }
}

// Export types for use by other components
export type { AdminError, ErrorBoundaryState, ErrorBoundaryProps };