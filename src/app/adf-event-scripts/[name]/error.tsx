'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Server, Network, Lock, FileX, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Error boundary component for event script edit route
 * 
 * Implements React 19 error boundary patterns with comprehensive error handling
 * for script editing operations. Provides graceful degradation, recovery options,
 * and accessibility compliance per WCAG 2.1 AA standards.
 * 
 * Handles specific error scenarios:
 * - Script loading failures and API communication errors
 * - Form validation errors and submission failures  
 * - Storage service connection and authentication issues
 * - Update conflicts and concurrent modification errors
 * - Network connectivity and timeout issues
 * - Permission and authorization errors
 * 
 * Features:
 * - Contextual error messages with clear resolution guidance
 * - Multiple recovery paths including retry, reload, and navigation
 * - Comprehensive error tracking and monitoring integration
 * - Accessible error UI with proper ARIA announcements
 * - Progressive enhancement with JavaScript-free fallbacks
 * 
 * @see Section 4.2 Error Handling and Validation
 * @see Section 5.1 High-Level Architecture - Error Boundary Patterns
 * @see React/Next.js Integration Requirements for React 19 error boundaries
 */

// ============================================================================
// ERROR CLASSIFICATION AND DETECTION
// ============================================================================

/**
 * Error categories for contextual handling and user messaging
 */
export enum ErrorCategory {
  SCRIPT_LOADING = 'script_loading',
  SCRIPT_SAVING = 'script_saving', 
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  STORAGE_SERVICE = 'storage_service',
  UPDATE_CONFLICT = 'update_conflict',
  UNKNOWN = 'unknown'
}

/**
 * Detailed error information for enhanced user guidance
 */
interface ErrorDetails {
  category: ErrorCategory;
  title: string;
  message: string;
  suggestions: string[];
  recoveryActions: RecoveryAction[];
  retryable: boolean;
  reportable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  statusCode?: number;
  context?: Record<string, any>;
}

/**
 * Recovery action configuration for user-guided error resolution
 */
interface RecoveryAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void | Promise<void>;
  primary?: boolean;
  destructive?: boolean;
  loading?: boolean;
}

/**
 * Error boundary props from Next.js app router
 */
interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// ============================================================================
// ERROR CLASSIFICATION LOGIC
// ============================================================================

/**
 * Classifies errors based on error message, stack trace, and context
 * Provides specific handling strategies for different error types
 */
function classifyError(error: Error): ErrorDetails {
  const message = error.message?.toLowerCase() || '';
  const stack = error.stack?.toLowerCase() || '';
  
  // Script loading and fetching errors
  if (message.includes('failed to fetch') || 
      message.includes('script not found') ||
      message.includes('network error') ||
      stack.includes('script-fetch') ||
      stack.includes('useSWR') ||
      stack.includes('react-query')) {
    return {
      category: ErrorCategory.SCRIPT_LOADING,
      title: 'Script Loading Failed',
      message: 'Unable to load the event script data. This may be due to network connectivity issues or the script may have been deleted.',
      suggestions: [
        'Check your internet connection and try refreshing the page',
        'Verify the script still exists in the system',
        'Contact your administrator if the problem persists'
      ],
      recoveryActions: [],
      retryable: true,
      reportable: true,
      severity: 'medium'
    };
  }
  
  // Script saving and persistence errors
  if (message.includes('save failed') ||
      message.includes('update failed') ||
      message.includes('patch failed') ||
      message.includes('put failed') ||
      stack.includes('script-save') ||
      stack.includes('form-submit')) {
    return {
      category: ErrorCategory.SCRIPT_SAVING,
      title: 'Script Save Failed',
      message: 'Unable to save your script changes. Your work may be temporarily lost if you navigate away.',
      suggestions: [
        'Copy your script content to a safe location before trying again',
        'Check for network connectivity issues',
        'Verify you have permission to modify this script',
        'Try saving again in a few moments'
      ],
      recoveryActions: [],
      retryable: true,
      reportable: true,
      severity: 'high'
    };
  }
  
  // Form validation errors
  if (message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      stack.includes('zod') ||
      stack.includes('react-hook-form') ||
      stack.includes('validation-schema')) {
    return {
      category: ErrorCategory.VALIDATION,
      title: 'Validation Error',
      message: 'Some form fields contain invalid data that prevented the script from being processed.',
      suggestions: [
        'Review all form fields for validation errors',
        'Ensure required fields are filled out completely',
        'Check that field formats match the expected patterns',
        'Save your script content before making corrections'
      ],
      recoveryActions: [],
      retryable: false,
      reportable: false,
      severity: 'low'
    };
  }
  
  // Network connectivity errors
  if (message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('fetch') && message.includes('failed') ||
      stack.includes('network-error') ||
      stack.includes('timeout')) {
    return {
      category: ErrorCategory.NETWORK,
      title: 'Network Connection Error',
      message: 'Unable to connect to the DreamFactory server. Please check your network connection.',
      suggestions: [
        'Check your internet connection',
        'Verify the DreamFactory server is running and accessible',
        'Try refreshing the page in a few moments',
        'Contact your system administrator if issues persist'
      ],
      recoveryActions: [],
      retryable: true,
      reportable: true,
      severity: 'medium'
    };
  }
  
  // Authentication errors
  if (message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('401') ||
      message.includes('token') && message.includes('expired') ||
      stack.includes('auth-error') ||
      stack.includes('unauthorized')) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      title: 'Authentication Required',
      message: 'Your session has expired or authentication is required to access this script.',
      suggestions: [
        'Sign in again to continue working',
        'Check if your session has expired',
        'Verify your account has access to event scripts'
      ],
      recoveryActions: [],
      retryable: false,
      reportable: false,
      severity: 'medium'
    };
  }
  
  // Authorization/permission errors
  if (message.includes('forbidden') ||
      message.includes('permission') ||
      message.includes('access denied') ||
      message.includes('403') ||
      stack.includes('permission-error') ||
      stack.includes('forbidden')) {
    return {
      category: ErrorCategory.AUTHORIZATION,
      title: 'Access Denied',
      message: 'You do not have sufficient permissions to edit this event script.',
      suggestions: [
        'Contact your administrator to request script editing permissions',
        'Verify your role includes event script management capabilities',
        'Check if the script is locked by another user'
      ],
      recoveryActions: [],
      retryable: false,
      reportable: false,
      severity: 'medium'
    };
  }
  
  // Storage service errors
  if (message.includes('storage') ||
      message.includes('service') && message.includes('unavailable') ||
      message.includes('backend') ||
      stack.includes('storage-service') ||
      stack.includes('service-error')) {
    return {
      category: ErrorCategory.STORAGE_SERVICE,
      title: 'Storage Service Error',
      message: 'The underlying storage service is experiencing issues. Script data may be temporarily unavailable.',
      suggestions: [
        'Wait a few moments and try again',
        'Check the storage service configuration',
        'Contact your administrator for service status updates'
      ],
      recoveryActions: [],
      retryable: true,
      reportable: true,
      severity: 'high'
    };
  }
  
  // Update conflict errors
  if (message.includes('conflict') ||
      message.includes('concurrent') ||
      message.includes('modified') ||
      message.includes('409') ||
      stack.includes('conflict-error') ||
      stack.includes('concurrent-modification')) {
    return {
      category: ErrorCategory.UPDATE_CONFLICT,
      title: 'Update Conflict',
      message: 'This script has been modified by another user while you were editing. Your changes cannot be saved to prevent data loss.',
      suggestions: [
        'Copy your current changes to a safe location',
        'Refresh the page to see the latest version',
        'Compare your changes with the current version',
        'Reapply your changes after reviewing conflicts'
      ],
      recoveryActions: [],
      retryable: false,
      reportable: false,
      severity: 'high'
    };
  }
  
  // Unknown/generic errors
  return {
    category: ErrorCategory.UNKNOWN,
    title: 'Unexpected Error',
    message: 'An unexpected error occurred while working with the event script. This may be a temporary issue.',
    suggestions: [
      'Try refreshing the page to resolve temporary issues',
      'Save any unsaved work before proceeding',
      'Report this error if it continues to occur'
    ],
    recoveryActions: [],
    retryable: true,
    reportable: true,
    severity: 'medium'
  };
}

// ============================================================================
// ERROR LOGGING AND MONITORING
// ============================================================================

/**
 * Logs error details for monitoring and debugging
 * Integrates with production error tracking systems
 */
async function logError(error: Error, errorDetails: ErrorDetails, context?: Record<string, any>) {
  try {
    // Create comprehensive error report
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        digest: (error as any).digest
      },
      details: errorDetails,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        route: '/adf-event-scripts/[name]',
        component: 'ErrorBoundary',
        ...context
      },
      user: {
        // Add user context if available from auth
        sessionId: sessionStorage.getItem('session_id'),
        userId: sessionStorage.getItem('user_id')
      }
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Event Script Error Boundary');
      console.error('Error Details:', errorDetails);
      console.error('Original Error:', error);
      console.error('Full Report:', errorReport);
      console.groupEnd();
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && errorDetails.reportable) {
      // Integration with error monitoring service
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport)
      }).catch(err => {
        console.warn('Failed to report error to monitoring service:', err);
      });
    }
    
  } catch (loggingError) {
    console.warn('Error logging failed:', loggingError);
  }
}

// ============================================================================
// ERROR RECOVERY MECHANISMS
// ============================================================================

/**
 * Provides intelligent recovery actions based on error type
 */
function getRecoveryActions(
  errorDetails: ErrorDetails, 
  reset: () => void,
  navigate: (path: string) => void
): RecoveryAction[] {
  const baseActions: RecoveryAction[] = [];
  
  // Retry action for retryable errors
  if (errorDetails.retryable) {
    baseActions.push({
      id: 'retry',
      label: 'Try Again',
      description: 'Retry the operation that failed',
      icon: RefreshCw,
      action: reset,
      primary: true
    });
  }
  
  // Reload page action
  baseActions.push({
    id: 'reload',
    label: 'Reload Page',
    description: 'Refresh the page to restore functionality',
    icon: RefreshCw,
    action: () => window.location.reload()
  });
  
  // Navigation actions based on error type
  switch (errorDetails.category) {
    case ErrorCategory.AUTHENTICATION:
      baseActions.unshift({
        id: 'login',
        label: 'Sign In',
        description: 'Go to login page to authenticate',
        icon: Lock,
        action: () => navigate('/login'),
        primary: true
      });
      break;
      
    case ErrorCategory.AUTHORIZATION:
      baseActions.push({
        id: 'dashboard',
        label: 'Go to Dashboard',
        description: 'Return to the main dashboard',
        icon: Home,
        action: () => navigate('/dashboard')
      });
      break;
      
    case ErrorCategory.SCRIPT_LOADING:
      baseActions.push({
        id: 'script-list',
        label: 'View All Scripts',
        description: 'Return to the event scripts list',
        icon: ArrowLeft,
        action: () => navigate('/adf-event-scripts')
      });
      break;
      
    case ErrorCategory.UPDATE_CONFLICT:
      baseActions.unshift({
        id: 'view-latest',
        label: 'View Latest Version',
        description: 'Reload to see the current script version',
        icon: FileX,
        action: () => window.location.reload(),
        primary: true
      });
      break;
  }
  
  // Report error action for reportable errors
  if (errorDetails.reportable && errorDetails.severity !== 'low') {
    baseActions.push({
      id: 'report',
      label: 'Report Issue',
      description: 'Send error report to support team',
      icon: Bug,
      action: async () => {
        try {
          await navigator.clipboard?.writeText(
            `Error Report: ${errorDetails.title}\nCategory: ${errorDetails.category}\nTime: ${new Date().toISOString()}\nPage: ${window.location.href}`
          );
          // Show success toast/announcement
          announceToScreenReader('Error details copied to clipboard for support ticket');
        } catch (err) {
          console.warn('Could not copy error details:', err);
        }
      }
    });
  }
  
  return baseActions;
}

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Announces messages to screen readers for accessibility
 */
function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only absolute -top-px -left-px w-px h-px overflow-hidden';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}

/**
 * Gets appropriate icon for error category
 */
function getErrorIcon(category: ErrorCategory): React.ComponentType<{ className?: string }> {
  switch (category) {
    case ErrorCategory.SCRIPT_LOADING:
    case ErrorCategory.SCRIPT_SAVING:
      return FileX;
    case ErrorCategory.VALIDATION:
      return AlertTriangle;
    case ErrorCategory.NETWORK:
      return Network;
    case ErrorCategory.AUTHENTICATION:
    case ErrorCategory.AUTHORIZATION:
      return Lock;
    case ErrorCategory.STORAGE_SERVICE:
      return Server;
    case ErrorCategory.UPDATE_CONFLICT:
      return Save;
    default:
      return AlertTriangle;
  }
}

/**
 * Gets appropriate color scheme for error severity
 */
function getErrorColors(severity: ErrorDetails['severity']) {
  switch (severity) {
    case 'low':
      return {
        background: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900',
        icon: 'text-yellow-600 dark:text-yellow-400',
        title: 'text-yellow-900 dark:text-yellow-100',
        text: 'text-yellow-800 dark:text-yellow-200'
      };
    case 'medium':
      return {
        background: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900',
        icon: 'text-orange-600 dark:text-orange-400',
        title: 'text-orange-900 dark:text-orange-100',
        text: 'text-orange-800 dark:text-orange-200'
      };
    case 'high':
    case 'critical':
      return {
        background: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
        icon: 'text-red-600 dark:text-red-400',
        title: 'text-red-900 dark:text-red-100',
        text: 'text-red-800 dark:text-red-200'
      };
  }
}

// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Event Script Edit Route Error Boundary
 * 
 * Provides comprehensive error handling for script editing operations
 * with contextual recovery options and accessibility compliance
 */
export default function EventScriptErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Navigation helper (simulated - would use Next.js router in real implementation)
  const navigate = (path: string) => {
    window.location.href = path;
  };
  
  // Initialize error analysis and recovery options
  useEffect(() => {
    const details = classifyError(error);
    setErrorDetails(details);
    
    // Generate recovery actions
    const actions = getRecoveryActions(details, reset, navigate);
    setRecoveryActions(actions);
    
    // Log error for monitoring
    logError(error, details, {
      scriptName: window.location.pathname.split('/').pop(),
      errorBoundary: 'EventScriptErrorBoundary'
    });
    
    // Announce error to screen readers
    announceToScreenReader(
      `Error occurred: ${details.title}. ${details.message}`,
      'assertive'
    );
  }, [error, reset]);
  
  // Enhanced retry handler with loading state
  const handleRetry = async (action: RecoveryAction) => {
    if (action.id === 'retry') {
      setIsRetrying(true);
      announceToScreenReader('Retrying operation...', 'polite');
      
      // Add small delay for better UX
      setTimeout(() => {
        action.action();
        setIsRetrying(false);
      }, 500);
    } else {
      await action.action();
    }
  };
  
  if (!errorDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  const colors = getErrorColors(errorDetails.severity);
  const ErrorIcon = getErrorIcon(errorDetails.category);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className={cn(
          "rounded-xl border-2 p-8 shadow-lg",
          colors.background
        )}>
          {/* Error Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className={cn("flex-shrink-0 p-2 rounded-lg bg-white/60 dark:bg-black/20", colors.icon)}>
              <ErrorIcon className="h-8 w-8" aria-hidden="true" />
            </div>
            
            <div className="flex-1">
              <h1 className={cn("text-2xl font-bold mb-2", colors.title)}>
                {errorDetails.title}
              </h1>
              
              <p className={cn("text-lg leading-relaxed", colors.text)}>
                {errorDetails.message}
              </p>
              
              {/* Error ID for support reference */}
              {(error as any).digest && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                  Error ID: {(error as any).digest}
                </p>
              )}
            </div>
          </div>
          
          {/* Suggestions Section */}
          {errorDetails.suggestions.length > 0 && (
            <div className="mb-8">
              <h2 className={cn("text-lg font-semibold mb-3", colors.title)}>
                How to resolve this:
              </h2>
              
              <ul className={cn("space-y-2", colors.text)} role="list">
                {errorDetails.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center text-sm font-medium mt-0.5">
                      {index + 1}
                    </span>
                    <span className="flex-1">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recovery Actions */}
          <div className="space-y-4">
            <h2 className={cn("text-lg font-semibold", colors.title)}>
              Recovery Options:
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recoveryActions.map((action) => {
                const ActionIcon = action.icon;
                const isLoading = action.id === 'retry' && isRetrying;
                
                return (
                  <Button
                    key={action.id}
                    variant={action.primary ? "primary" : action.destructive ? "error" : "secondary"}
                    className="h-auto p-4 justify-start text-left"
                    loading={isLoading}
                    disabled={isLoading}
                    onClick={() => handleRetry(action)}
                    aria-describedby={`action-${action.id}-desc`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <ActionIcon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{action.label}</div>
                        <div 
                          id={`action-${action.id}-desc`}
                          className="text-sm opacity-80 mt-1"
                        >
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
          
          {/* Technical Details (Collapsible for Development) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-8 p-4 bg-black/10 dark:bg-white/10 rounded-lg">
              <summary className={cn("font-medium cursor-pointer", colors.title)}>
                Technical Details (Development)
              </summary>
              <div className="mt-3 space-y-2 text-sm font-mono">
                <div><strong>Error:</strong> {error.name}</div>
                <div><strong>Message:</strong> {error.message}</div>
                <div><strong>Category:</strong> {errorDetails.category}</div>
                <div><strong>Severity:</strong> {errorDetails.severity}</div>
                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 text-xs overflow-auto max-h-32 bg-black/20 dark:bg-white/20 p-2 rounded">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
        
        {/* Accessibility Information */}
        <div className="sr-only">
          <h2>Error Recovery Information</h2>
          <p>
            An error occurred while editing the event script. 
            Error type: {errorDetails.title}. 
            Severity: {errorDetails.severity}. 
            Use the recovery options above to resolve the issue.
          </p>
        </div>
      </div>
    </div>
  );
}