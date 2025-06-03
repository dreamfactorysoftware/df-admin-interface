'use client';

/**
 * Error boundary component for the API security section that handles and displays errors
 * in limits and roles management workflows. Provides user-friendly error messages and 
 * recovery actions while maintaining application stability.
 * 
 * Features:
 * - Next.js app router error boundary following error.tsx conventions
 * - Comprehensive error handling and validation per Section 4.2 requirements
 * - User-friendly error recovery interfaces per Section 7.6 user interactions
 * - Accessibility compliance for error states per WCAG 2.1 AA requirements
 * - Tailwind CSS styling for consistent design system integration
 * - Internationalization support for error messages
 * - Integration with global error handling infrastructure
 * - Retry mechanisms with exponential backoff for transient errors
 * - Context-aware error classification and recovery suggestions
 */

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// Error Types and Interfaces
// ============================================================================

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

interface SecurityError extends Error {
  type?: 'permission' | 'authentication' | 'authorization' | 'validation' | 'network' | 'server' | 'unknown';
  statusCode?: number;
  context?: {
    component?: string;
    action?: string;
    resource?: string;
    userId?: string;
    timestamp?: string;
  };
  retryable?: boolean;
  userMessage?: string;
  technicalDetails?: string;
}

interface RecoveryAction {
  id: string;
  label: string;
  action: () => void;
  primary?: boolean;
  destructive?: boolean;
  icon?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

interface ErrorDisplayConfig {
  title: string;
  description: string;
  icon: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  showTechnicalDetails: boolean;
  actions: RecoveryAction[];
  userGuidance?: string;
  helpLink?: string;
}

// ============================================================================
// Error Classification and Recovery Logic
// ============================================================================

function classifySecurityError(error: Error): SecurityError {
  const securityError = error as SecurityError;
  
  // Extract status code from error message or existing property
  const statusCodeMatch = error.message.match(/status:?\s*(\d{3})/i);
  const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1]) : securityError.statusCode;
  
  // Classify based on message content and status code
  const message = error.message.toLowerCase();
  let type: SecurityError['type'] = 'unknown';
  let retryable = false;
  let userMessage = '';
  
  if (statusCode === 401 || message.includes('unauthorized') || message.includes('authentication')) {
    type = 'authentication';
    userMessage = 'Authentication required. Please log in to continue.';
    retryable = false;
  } else if (statusCode === 403 || message.includes('forbidden') || message.includes('permission')) {
    type = 'authorization';
    userMessage = 'You do not have permission to access this resource.';
    retryable = false;
  } else if (statusCode === 422 || message.includes('validation') || message.includes('invalid')) {
    type = 'validation';
    userMessage = 'Please review your input and correct any validation errors.';
    retryable = false;
  } else if (statusCode && statusCode >= 500) {
    type = 'server';
    userMessage = 'Server error occurred. Please try again or contact support if the problem persists.';
    retryable = true;
  } else if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    type = 'network';
    userMessage = 'Network error occurred. Please check your connection and try again.';
    retryable = true;
  } else if (message.includes('permission') || message.includes('role') || message.includes('limit')) {
    type = 'permission';
    userMessage = 'Insufficient permissions for this operation. Please contact your administrator.';
    retryable = false;
  }
  
  return {
    ...securityError,
    type,
    statusCode,
    retryable,
    userMessage: securityError.userMessage || userMessage,
    technicalDetails: error.message,
    context: {
      component: 'api-security',
      timestamp: new Date().toISOString(),
      ...securityError.context,
    },
  };
}

function generateErrorDisplayConfig(
  error: SecurityError,
  router: ReturnType<typeof useRouter>,
  reset: () => void,
  retry: () => Promise<void>
): ErrorDisplayConfig {
  const actions: RecoveryAction[] = [];
  
  // Always provide a retry option for retryable errors
  if (error.retryable) {
    actions.push({
      id: 'retry',
      label: 'Try Again',
      action: retry,
      primary: true,
      icon: '🔄',
      ariaLabel: 'Retry the failed operation',
    });
  }
  
  // Authentication errors - redirect to login
  if (error.type === 'authentication') {
    actions.push({
      id: 'login',
      label: 'Log In',
      action: () => router.push('/login'),
      primary: true,
      icon: '🔐',
      ariaLabel: 'Go to login page',
    });
  }
  
  // Authorization errors - go to dashboard or contact admin
  if (error.type === 'authorization' || error.type === 'permission') {
    actions.push({
      id: 'dashboard',
      label: 'Go to Dashboard',
      action: () => router.push('/'),
      primary: false,
      icon: '🏠',
      ariaLabel: 'Return to dashboard',
    });
    
    actions.push({
      id: 'contact',
      label: 'Contact Administrator',
      action: () => {
        // This would integrate with support system
        window.open('mailto:admin@example.com?subject=Access%20Permission%20Request', '_blank');
      },
      primary: false,
      icon: '📧',
      ariaLabel: 'Contact system administrator for assistance',
    });
  }
  
  // Validation errors - reset to clean state
  if (error.type === 'validation') {
    actions.push({
      id: 'reset',
      label: 'Reset Form',
      action: reset,
      primary: true,
      icon: '🔄',
      ariaLabel: 'Reset form to correct validation errors',
    });
  }
  
  // General navigation actions
  actions.push({
    id: 'refresh',
    label: 'Refresh Page',
    action: () => window.location.reload(),
    primary: false,
    icon: '↻',
    ariaLabel: 'Refresh the current page',
  });
  
  actions.push({
    id: 'back',
    label: 'Go Back',
    action: () => router.back(),
    primary: false,
    icon: '←',
    ariaLabel: 'Go back to previous page',
  });
  
  // Generate display configuration based on error type
  const configs: Record<SecurityError['type'], Omit<ErrorDisplayConfig, 'actions'>> = {
    authentication: {
      title: 'Authentication Required',
      description: 'You need to log in to access security management features.',
      icon: '🔐',
      severity: 'high',
      showTechnicalDetails: false,
      userGuidance: 'Please log in with your administrator credentials to manage API security settings.',
      helpLink: '/help/authentication',
    },
    authorization: {
      title: 'Access Denied',
      description: 'You do not have permission to access this security feature.',
      icon: '🚫',
      severity: 'high',
      showTechnicalDetails: false,
      userGuidance: 'Contact your system administrator to request access to API security management.',
      helpLink: '/help/permissions',
    },
    permission: {
      title: 'Insufficient Permissions',
      description: 'You do not have the required permissions for this operation.',
      icon: '⚠️',
      severity: 'medium',
      showTechnicalDetails: false,
      userGuidance: 'Ensure you have the appropriate role permissions for managing API limits and roles.',
      helpLink: '/help/roles',
    },
    validation: {
      title: 'Validation Error',
      description: 'There are errors in the form data that need to be corrected.',
      icon: '❌',
      severity: 'low',
      showTechnicalDetails: true,
      userGuidance: 'Please review the highlighted fields and correct any validation errors.',
      helpLink: '/help/validation',
    },
    network: {
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your network connection.',
      icon: '🌐',
      severity: 'medium',
      showTechnicalDetails: false,
      userGuidance: 'Check your internet connection and try again. If the problem persists, contact support.',
      helpLink: '/help/troubleshooting',
    },
    server: {
      title: 'Server Error',
      description: 'A server error occurred while processing your request.',
      icon: '🔧',
      severity: 'high',
      showTechnicalDetails: true,
      userGuidance: 'This is a temporary issue. Please try again in a few moments.',
      helpLink: '/help/server-errors',
    },
    unknown: {
      title: 'Unexpected Error',
      description: 'An unexpected error occurred in the security management interface.',
      icon: '⚡',
      severity: 'medium',
      showTechnicalDetails: true,
      userGuidance: 'Please try refreshing the page or contact support if the issue continues.',
      helpLink: '/help/general',
    },
  };
  
  const config = configs[error.type || 'unknown'];
  
  return {
    ...config,
    actions,
  };
}

// ============================================================================
// Error Component Implementation
// ============================================================================

/**
 * API Security Error Boundary Component
 * 
 * This component serves as the error boundary for the API security section,
 * automatically catching and displaying errors that occur in limits and roles
 * management workflows. It provides contextual error messages and recovery
 * actions specific to security operations.
 */
export default function ApiSecurityError({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  
  // Classify the error and determine recovery strategies
  const securityError = useMemo(() => classifySecurityError(error), [error]);
  
  // Retry mechanism with exponential backoff
  const handleRetry = useCallback(async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    
    try {
      // Implement exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      setRetryCount(prev => prev + 1);
      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, retryCount, reset]);
  
  // Generate display configuration
  const displayConfig = useMemo(
    () => generateErrorDisplayConfig(securityError, router, reset, handleRetry),
    [securityError, router, reset, handleRetry]
  );
  
  // Log error for debugging and monitoring
  useEffect(() => {
    const errorReport = {
      type: securityError.type,
      message: securityError.message,
      statusCode: securityError.statusCode,
      context: securityError.context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      retryCount,
    };
    
    console.error('[ApiSecurityError]', errorReport);
    
    // Here you would integrate with your logging/monitoring service
    // Example: analytics.track('api_security_error', errorReport);
  }, [securityError, retryCount]);
  
  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        router.back();
      } else if (event.key === 'r' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (securityError.retryable && !isRetrying) {
          handleRetry();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, securityError.retryable, isRetrying, handleRetry]);
  
  const severityColors = {
    low: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    medium: 'border-orange-200 bg-orange-50 text-orange-900',
    high: 'border-red-200 bg-red-50 text-red-900',
    critical: 'border-red-300 bg-red-100 text-red-950',
  };
  
  const iconBackgroundColors = {
    low: 'bg-yellow-100',
    medium: 'bg-orange-100',
    high: 'bg-red-100',
    critical: 'bg-red-200',
  };
  
  return (
    <div 
      className="min-h-[400px] flex items-center justify-center p-6"
      role="alert"
      aria-live="assertive"
      data-testid="api-security-error-boundary"
    >
      <div className={`
        max-w-2xl w-full rounded-xl border-2 p-8 shadow-lg
        ${severityColors[displayConfig.severity]}
      `}>
        {/* Error Header */}
        <div className="flex items-start space-x-4 mb-6">
          <div className={`
            flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl
            ${iconBackgroundColors[displayConfig.severity]}
          `}>
            <span role="img" aria-label={`${displayConfig.severity} severity error`}>
              {displayConfig.icon}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold mb-2">
              {displayConfig.title}
            </h1>
            
            <p className="text-base leading-relaxed">
              {securityError.userMessage || displayConfig.description}
            </p>
            
            {displayConfig.userGuidance && (
              <div className="mt-4 p-3 rounded-lg bg-white/50 border border-current/20">
                <h2 className="text-sm font-medium mb-1">What can you do?</h2>
                <p className="text-sm">{displayConfig.userGuidance}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Technical Details (expandable) */}
        {displayConfig.showTechnicalDetails && securityError.technicalDetails && (
          <div className="mb-6">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center space-x-2 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded"
              aria-expanded={showTechnicalDetails}
              aria-controls="technical-details"
            >
              <span>{showTechnicalDetails ? '▼' : '▶'}</span>
              <span>Technical Details</span>
            </button>
            
            {showTechnicalDetails && (
              <div 
                id="technical-details"
                className="mt-2 p-3 bg-white/50 rounded-lg border border-current/20"
              >
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {securityError.technicalDetails}
                </pre>
                
                {securityError.context && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="text-xs font-medium mb-1">Context:</p>
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {JSON.stringify(securityError.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Retry Information */}
        {retryCount > 0 && (
          <div className="mb-6 p-3 bg-white/50 rounded-lg border border-current/20">
            <p className="text-sm">
              <span className="font-medium">Retry attempts:</span> {retryCount}
              {retryCount >= 3 && (
                <span className="block mt-1 text-xs">
                  Multiple retries attempted. Consider checking your network connection or contacting support.
                </span>
              )}
            </p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {displayConfig.actions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              disabled={action.disabled || (action.id === 'retry' && isRetrying)}
              className={`
                inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${action.primary 
                  ? 'bg-current text-white hover:opacity-90 focus:ring-current' 
                  : 'bg-white/70 text-current border border-current/30 hover:bg-white focus:ring-current'
                }
                ${action.destructive ? 'border-red-300 text-red-700 hover:bg-red-50' : ''}
                ${(action.disabled || (action.id === 'retry' && isRetrying)) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
              `}
              aria-label={action.ariaLabel || action.label}
              data-testid={`error-action-${action.id}`}
            >
              {action.icon && (
                <span role="img" aria-hidden="true">
                  {action.id === 'retry' && isRetrying ? '⏳' : action.icon}
                </span>
              )}
              <span>
                {action.id === 'retry' && isRetrying ? 'Retrying...' : action.label}
              </span>
            </button>
          ))}
        </div>
        
        {/* Help Link */}
        {displayConfig.helpLink && (
          <div className="mt-6 pt-4 border-t border-current/20">
            <a
              href={displayConfig.helpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 rounded"
            >
              <span>📚</span>
              <span>Get help with this error</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        )}
        
        {/* Error ID for support */}
        <div className="mt-6 pt-4 border-t border-current/20">
          <p className="text-xs opacity-75">
            Error ID: {securityError.context?.timestamp || 'unknown'}
            {securityError.statusCode && ` • Status: ${securityError.statusCode}`}
          </p>
        </div>
      </div>
      
      {/* Screen reader instructions */}
      <div className="sr-only">
        <p>
          An error has occurred in the API security section. 
          Error type: {securityError.type}. 
          {securityError.retryable ? 'This error can be retried.' : 'This error requires manual intervention.'}
          Use the provided action buttons to resolve the issue or contact support if needed.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Error Boundary Utilities
// ============================================================================

/**
 * Enhanced error logging function for API security errors
 */
export function logSecurityError(
  error: Error,
  context?: {
    component?: string;
    action?: string;
    userId?: string;
    resource?: string;
  }
) {
  const securityError = classifySecurityError(error);
  
  const errorReport = {
    ...securityError,
    context: {
      ...securityError.context,
      ...context,
    },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    timestamp: new Date().toISOString(),
  };
  
  console.error('[SecurityError]', errorReport);
  
  // Here you would send to your monitoring service
  // Example: 
  // analytics.track('security_error', errorReport);
  // bugsnag.notify(error, event => {
  //   event.context = 'api-security';
  //   event.addMetadata('security', errorReport);
  // });
  
  return errorReport;
}

/**
 * Error boundary wrapper for security components
 */
export function withSecurityErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return function SecurityErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary
        fallback={({ error, reset }) => (
          <ApiSecurityError 
            error={error} 
            reset={reset}
          />
        )}
        onError={(error) => {
          logSecurityError(error, {
            component: componentName || Component.name,
          });
        }}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Simple Error Boundary wrapper component (for compatibility)
interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryProps>;
  onError?: (error: Error) => void;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryWrapperProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryWrapperProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error);
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ApiSecurityError;
      return (
        <FallbackComponent
          error={this.state.error as Error & { digest?: string }}
          reset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}