/**
 * Admin Management Error Boundary Component
 * 
 * Error boundary component for admin management routes that handles and displays error states
 * with user-friendly messaging and recovery options. Implements comprehensive error handling
 * with logging, user feedback, and graceful degradation patterns using React 19 error boundary
 * capabilities for admin-specific error scenarios.
 * 
 * Features:
 * - Next.js App Router error boundary following Next.js 15.1 conventions
 * - React 19 error boundary capabilities with enhanced error capture
 * - Admin-specific error recovery workflows for CRUD operations
 * - Comprehensive error logging and reporting integration
 * - WCAG 2.1 AA compliant error interface with proper ARIA attributes
 * - Contextual error messaging for admin operations and permission errors
 * - Graceful degradation with retry mechanisms for admin data fetching failures
 * - Integration with DreamFactory Admin Interface error patterns
 * 
 * @fileoverview Next.js error boundary for admin management routes
 * @version 1.0.0
 * @see Technical Specification Section 4.2 - Error Handling and Validation
 * @see Technical Specification Section 5.1 - High-Level Architecture
 * @see React/Next.js Integration Requirements
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  UsersIcon,
  ShieldExclamationIcon,
  ServerIcon,
  WifiIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Error types specific to admin management operations
 * Categorizes errors for appropriate handling and messaging
 */
export type AdminErrorType = 
  | 'permission_denied'
  | 'resource_not_found'
  | 'validation_error'
  | 'network_error'
  | 'server_error'
  | 'authentication_error'
  | 'rate_limit_error'
  | 'timeout_error'
  | 'unknown_error';

/**
 * Admin operation context for error categorization
 * Helps determine appropriate error messages and recovery actions
 */
export type AdminOperationContext =
  | 'list_admins'
  | 'create_admin'
  | 'update_admin'
  | 'delete_admin'
  | 'admin_details'
  | 'admin_permissions'
  | 'bulk_operations'
  | 'import_export'
  | 'role_assignment'
  | 'password_reset'
  | 'session_management'
  | 'unknown_operation';

/**
 * Enhanced error information for admin-specific error handling
 * Extends standard Error with admin context and recovery options
 */
export interface AdminError extends Error {
  type?: AdminErrorType;
  operation?: AdminOperationContext;
  statusCode?: number;
  timestamp?: Date;
  userId?: string;
  adminId?: string;
  retryable?: boolean;
  recoveryActions?: string[];
  technicalDetails?: Record<string, unknown>;
}

/**
 * Error boundary component props with admin-specific extensions
 * Supports customization of error handling behavior
 */
export interface AdminErrorBoundaryProps {
  /**
   * Child components protected by error boundary
   */
  children: React.ReactNode;
  
  /**
   * Current admin operation context for targeted error handling
   */
  operationContext?: AdminOperationContext;
  
  /**
   * Custom error handler for additional processing
   */
  onError?: (error: AdminError, errorInfo: React.ErrorInfo) => void;
  
  /**
   * Custom recovery actions for specific error types
   */
  recoveryActions?: Record<AdminErrorType, () => void>;
  
  /**
   * Whether to show technical error details (development mode)
   */
  showTechnicalDetails?: boolean;
  
  /**
   * Custom fallback component override
   */
  fallback?: React.ComponentType<{ error: AdminError; reset: () => void }>;
}

/**
 * Next.js Error Boundary Props (required by App Router)
 * Standard interface for Next.js error boundary components
 */
interface NextErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// =============================================================================
// ERROR CATEGORIZATION AND MESSAGING
// =============================================================================

/**
 * Error type detection based on error properties and context
 * Categorizes errors for appropriate handling and user messaging
 */
const categorizeAdminError = (error: Error, operation?: AdminOperationContext): AdminErrorType => {
  // Network and connectivity errors
  if (error.message.includes('fetch') || 
      error.message.includes('network') || 
      error.message.includes('NetworkError') ||
      error.name === 'NetworkError') {
    return 'network_error';
  }
  
  // Authentication and permission errors
  if (error.message.includes('401') || 
      error.message.includes('Unauthorized') ||
      error.message.includes('authentication')) {
    return 'authentication_error';
  }
  
  if (error.message.includes('403') || 
      error.message.includes('Forbidden') ||
      error.message.includes('permission') ||
      error.message.includes('access denied')) {
    return 'permission_denied';
  }
  
  // Resource not found errors
  if (error.message.includes('404') || 
      error.message.includes('Not Found') ||
      error.message.includes('not found')) {
    return 'resource_not_found';
  }
  
  // Validation errors
  if (error.message.includes('400') || 
      error.message.includes('Bad Request') ||
      error.message.includes('validation') ||
      error.message.includes('invalid')) {
    return 'validation_error';
  }
  
  // Rate limiting errors
  if (error.message.includes('429') || 
      error.message.includes('Too Many Requests') ||
      error.message.includes('rate limit')) {
    return 'rate_limit_error';
  }
  
  // Timeout errors
  if (error.message.includes('timeout') || 
      error.message.includes('TIMEOUT') ||
      error.name === 'TimeoutError') {
    return 'timeout_error';
  }
  
  // Server errors
  if (error.message.includes('500') || 
      error.message.includes('502') || 
      error.message.includes('503') || 
      error.message.includes('504') ||
      error.message.includes('Internal Server Error') ||
      error.message.includes('Server Error')) {
    return 'server_error';
  }
  
  return 'unknown_error';
};

/**
 * Generate user-friendly error messages for admin operations
 * Provides contextual messaging based on error type and operation
 */
const getAdminErrorMessage = (
  errorType: AdminErrorType, 
  operation: AdminOperationContext
): { title: string; description: string; icon: React.ComponentType<any> } => {
  const operationLabels: Record<AdminOperationContext, string> = {
    list_admins: 'loading administrator list',
    create_admin: 'creating administrator account',
    update_admin: 'updating administrator information',
    delete_admin: 'deleting administrator account',
    admin_details: 'loading administrator details',
    admin_permissions: 'managing administrator permissions',
    bulk_operations: 'performing bulk operations',
    import_export: 'importing/exporting administrator data',
    role_assignment: 'assigning administrator roles',
    password_reset: 'resetting administrator password',
    session_management: 'managing administrator sessions',
    unknown_operation: 'performing administrator operation',
  };

  const operationLabel = operationLabels[operation] || 'performing operation';

  switch (errorType) {
    case 'permission_denied':
      return {
        title: 'Access Denied',
        description: `You don't have permission to access this administrator feature. Please contact your system administrator if you believe this is an error.`,
        icon: ShieldExclamationIcon,
      };

    case 'resource_not_found':
      return {
        title: 'Administrator Not Found',
        description: `The requested administrator account could not be found. It may have been deleted or moved. Please check the administrator list and try again.`,
        icon: UsersIcon,
      };

    case 'validation_error':
      return {
        title: 'Invalid Information',
        description: `There was an issue with the administrator information provided. Please check your input and ensure all required fields are completed correctly.`,
        icon: ExclamationCircleIcon,
      };

    case 'network_error':
      return {
        title: 'Connection Problem',
        description: `Unable to connect to the DreamFactory server while ${operationLabel}. Please check your internet connection and try again.`,
        icon: WifiIcon,
      };

    case 'server_error':
      return {
        title: 'Server Error',
        description: `The DreamFactory server encountered an error while ${operationLabel}. This is usually temporary. Please try again in a few moments.`,
        icon: ServerIcon,
      };

    case 'authentication_error':
      return {
        title: 'Authentication Required',
        description: `Your session has expired or is invalid. Please log in again to continue managing administrators.`,
        icon: ShieldExclamationIcon,
      };

    case 'rate_limit_error':
      return {
        title: 'Too Many Requests',
        description: `You've made too many requests in a short time. Please wait a moment before trying to manage administrators again.`,
        icon: ClockIcon,
      };

    case 'timeout_error':
      return {
        title: 'Request Timeout',
        description: `The operation timed out while ${operationLabel}. This might be due to server load. Please try again.`,
        icon: ClockIcon,
      };

    default:
      return {
        title: 'Unexpected Error',
        description: `An unexpected error occurred while ${operationLabel}. Please try again or contact support if the problem persists.`,
        icon: ExclamationTriangleIcon,
      };
  }
};

/**
 * Determine recovery actions based on error type and context
 * Provides contextual recovery options for different error scenarios
 */
const getRecoveryActions = (
  errorType: AdminErrorType,
  operation: AdminOperationContext
): Array<{ label: string; action: string; icon?: React.ComponentType<any>; primary?: boolean }> => {
  const baseActions = [
    { 
      label: 'Try Again', 
      action: 'retry', 
      icon: ArrowPathIcon, 
      primary: true 
    },
    { 
      label: 'Go to Admin List', 
      action: 'navigate_list', 
      icon: UsersIcon 
    },
    { 
      label: 'Return Home', 
      action: 'navigate_home', 
      icon: HomeIcon 
    },
  ];

  switch (errorType) {
    case 'permission_denied':
      return [
        { 
          label: 'Go to Admin List', 
          action: 'navigate_list', 
          icon: UsersIcon, 
          primary: true 
        },
        { 
          label: 'Return Home', 
          action: 'navigate_home', 
          icon: HomeIcon 
        },
      ];

    case 'authentication_error':
      return [
        { 
          label: 'Log In Again', 
          action: 'navigate_login', 
          icon: ShieldExclamationIcon, 
          primary: true 
        },
        { 
          label: 'Return Home', 
          action: 'navigate_home', 
          icon: HomeIcon 
        },
      ];

    case 'resource_not_found':
      return [
        { 
          label: 'Go to Admin List', 
          action: 'navigate_list', 
          icon: UsersIcon, 
          primary: true 
        },
        { 
          label: 'Return Home', 
          action: 'navigate_home', 
          icon: HomeIcon 
        },
      ];

    case 'rate_limit_error':
      return [
        { 
          label: 'Wait and Retry', 
          action: 'retry_delayed', 
          icon: ClockIcon, 
          primary: true 
        },
        { 
          label: 'Go to Admin List', 
          action: 'navigate_list', 
          icon: UsersIcon 
        },
      ];

    default:
      return baseActions;
  }
};

// =============================================================================
// ERROR LOGGING UTILITY
// =============================================================================

/**
 * Enhanced error logging for admin operations
 * Integrates with error reporting service and provides structured logging
 */
const logAdminError = async (error: AdminError, errorInfo?: React.ErrorInfo) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    type: error.type || 'unknown_error',
    operation: error.operation || 'unknown_operation',
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    userId: error.userId,
    adminId: error.adminId,
    pathname: window.location.pathname,
    userAgent: navigator.userAgent,
    componentStack: errorInfo?.componentStack,
    technicalDetails: error.technicalDetails,
    digest: (error as any).digest,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Admin Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.table(errorLog);
    console.groupEnd();
  }

  try {
    // Send to error logging service (implementation would depend on chosen service)
    // Example: await errorLogger.logError(errorLog);
    
    // For now, we'll store in session storage for development
    const existingLogs = JSON.parse(sessionStorage.getItem('admin-error-logs') || '[]');
    existingLogs.push(errorLog);
    
    // Keep only last 10 error logs to prevent storage bloat
    if (existingLogs.length > 10) {
      existingLogs.splice(0, existingLogs.length - 10);
    }
    
    sessionStorage.setItem('admin-error-logs', JSON.stringify(existingLogs));
  } catch (loggingError) {
    console.error('Failed to log admin error:', loggingError);
  }
};

// =============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// =============================================================================

/**
 * Admin Management Error Boundary Component
 * 
 * Next.js App Router error boundary component that provides comprehensive error handling
 * for admin management routes. Implements React 19 error boundary capabilities with
 * admin-specific error categorization, user-friendly messaging, and recovery workflows.
 * 
 * Key Features:
 * - Admin-specific error categorization and messaging
 * - Contextual recovery actions based on operation type
 * - WCAG 2.1 AA compliant error interface
 * - Comprehensive error logging and reporting
 * - Graceful degradation with retry mechanisms
 * - Integration with Next.js App Router conventions
 * 
 * @param error - Error object from Next.js error boundary
 * @param reset - Reset function to attempt recovery
 */
export default function AdminErrorBoundary({ error, reset }: NextErrorProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // State for enhanced error handling
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  
  // Determine operation context from pathname
  const operationContext: AdminOperationContext = React.useMemo(() => {
    if (pathname.includes('/create')) return 'create_admin';
    if (pathname.includes('/edit') || pathname.includes('/update')) return 'update_admin';
    if (pathname.includes('/delete')) return 'delete_admin';
    if (pathname.match(/\/adf-admins\/[^/]+$/)) return 'admin_details';
    if (pathname.includes('/permissions')) return 'admin_permissions';
    if (pathname.includes('/roles')) return 'role_assignment';
    if (pathname.includes('/import') || pathname.includes('/export')) return 'import_export';
    if (pathname.includes('/bulk')) return 'bulk_operations';
    if (pathname.includes('/password')) return 'password_reset';
    if (pathname.includes('/sessions')) return 'session_management';
    if (pathname === '/adf-admins') return 'list_admins';
    return 'unknown_operation';
  }, [pathname]);

  // Enhance error with admin context
  const adminError: AdminError = React.useMemo(() => {
    const enhancedError = error as AdminError;
    enhancedError.type = categorizeAdminError(error, operationContext);
    enhancedError.operation = operationContext;
    enhancedError.timestamp = new Date();
    enhancedError.retryable = ['network_error', 'server_error', 'timeout_error'].includes(
      enhancedError.type
    );
    
    return enhancedError;
  }, [error, operationContext]);

  // Get contextual error messaging
  const errorMessage = getAdminErrorMessage(adminError.type!, adminError.operation!);
  
  // Get recovery actions
  const recoveryActions = getRecoveryActions(adminError.type!, adminError.operation!);

  // Log error on mount
  useEffect(() => {
    logAdminError(adminError);
  }, [adminError]);

  // Auto-focus error container for accessibility
  const errorContainerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errorContainerRef.current) {
      errorContainerRef.current.focus();
    }
  }, []);

  /**
   * Enhanced retry mechanism with backoff
   * Implements progressive delays for retry attempts
   */
  const handleRetry = useCallback(async (delayed = false) => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    
    try {
      if (delayed) {
        // Progressive backoff: 1s, 2s, 4s, etc.
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      setRetryCount(prev => prev + 1);
      reset();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  }, [reset, retryCount, isRetrying]);

  /**
   * Navigation handler for recovery actions
   * Provides safe navigation with error boundary reset
   */
  const handleNavigation = useCallback((action: string) => {
    try {
      switch (action) {
        case 'navigate_list':
          router.push('/adf-admins');
          break;
        case 'navigate_home':
          router.push('/');
          break;
        case 'navigate_login':
          router.push('/login');
          break;
        case 'retry':
          handleRetry();
          break;
        case 'retry_delayed':
          handleRetry(true);
          break;
        default:
          console.warn(`Unknown navigation action: ${action}`);
      }
    } catch (navigationError) {
      console.error('Navigation failed:', navigationError);
      // Fallback to home page
      router.push('/');
    }
  }, [router, handleRetry]);

  /**
   * Toggle technical details visibility
   * Allows developers to see detailed error information
   */
  const toggleTechnicalDetails = useCallback(() => {
    setShowTechnicalDetails(prev => !prev);
  }, []);

  return (
    <div 
      ref={errorContainerRef}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4"
      role="alert"
      aria-live="assertive"
      aria-labelledby="error-title"
      aria-describedby="error-description"
      tabIndex={-1}
    >
      <div className="max-w-2xl w-full space-y-6">
        {/* Error Alert */}
        <Alert 
          type="error" 
          variant="filled"
          size="lg"
          className="shadow-lg"
        >
          <Alert.Icon>
            <errorMessage.icon className="h-6 w-6" />
          </Alert.Icon>
          
          <Alert.Content>
            <Alert.Content.Title id="error-title">
              {errorMessage.title}
            </Alert.Content.Title>
            
            <Alert.Content.Description id="error-description">
              {errorMessage.description}
            </Alert.Content.Description>
            
            {/* Additional context for screen readers */}
            <div className="sr-only">
              Error occurred in admin management section. 
              Operation: {adminError.operation?.replace(/_/g, ' ')}. 
              Error type: {adminError.type?.replace(/_/g, ' ')}.
              {retryCount > 0 && ` Retry attempt ${retryCount}.`}
            </div>
          </Alert.Content>
        </Alert>

        {/* Recovery Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            What would you like to do?
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {recoveryActions.map(({ label, action, icon: ActionIcon, primary }) => (
              <Button
                key={action}
                variant={primary ? "primary" : "secondary"}
                size="md"
                onClick={() => handleNavigation(action)}
                disabled={isRetrying && action.includes('retry')}
                loading={isRetrying && action.includes('retry')}
                icon={ActionIcon && <ActionIcon className="h-4 w-4" />}
                className="flex-1"
                ariaLabel={`${label}${isRetrying && action.includes('retry') ? ' - retrying' : ''}`}
              >
                {label}
              </Button>
            ))}
          </div>
          
          {retryCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {retryCount === 1 ? '1 retry attempt' : `${retryCount} retry attempts`}
            </p>
          )}
        </div>

        {/* Technical Details (Development Mode) */}
        {(process.env.NODE_ENV === 'development' || showTechnicalDetails) && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Technical Details
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTechnicalDetails}
                ariaLabel={showTechnicalDetails ? 'Hide technical details' : 'Show technical details'}
              >
                {showTechnicalDetails ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showTechnicalDetails && (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-300">Error Type:</div>
                  <div className="text-gray-600 dark:text-gray-400 font-mono">
                    {adminError.type}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-300">Operation:</div>
                  <div className="text-gray-600 dark:text-gray-400 font-mono">
                    {adminError.operation}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-300">Error Message:</div>
                  <div className="text-gray-600 dark:text-gray-400 font-mono break-all">
                    {adminError.message}
                  </div>
                </div>
                
                {adminError.digest && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-700 dark:text-gray-300">Error Digest:</div>
                    <div className="text-gray-600 dark:text-gray-400 font-mono break-all">
                      {adminError.digest}
                    </div>
                  </div>
                )}
                
                <div className="text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-300">Pathname:</div>
                  <div className="text-gray-600 dark:text-gray-400 font-mono">
                    {pathname}
                  </div>
                </div>
                
                <div className="text-sm">
                  <div className="font-medium text-gray-700 dark:text-gray-300">Timestamp:</div>
                  <div className="text-gray-600 dark:text-gray-400 font-mono">
                    {adminError.timestamp?.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accessibility Instructions */}
        <div className="sr-only" aria-live="polite">
          Use the buttons above to recover from this error. 
          You can try the operation again, navigate to the admin list, 
          or return to the home page. 
          If you continue to experience problems, please contact your system administrator.
        </div>
      </div>
    </div>
  );
}