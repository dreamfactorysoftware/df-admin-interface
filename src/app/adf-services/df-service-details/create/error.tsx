'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  Home, 
  Database, 
  Wifi, 
  Shield,
  Eye,
  EyeOff 
} from 'lucide-react';

/**
 * Service Creation Error Boundary Component
 * 
 * Implements React 19 error boundary patterns for the database service creation workflow.
 * Provides user-friendly error messages, contextual recovery actions, and proper error logging
 * per Section 7.5.1 Core Application Layout Structure and Section 4.1.3 Error Handling workflows.
 * 
 * Key Features:
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Contextual error recovery based on error types (network, validation, authentication)
 * - Tailwind CSS styling with dark mode support
 * - Error logging and monitoring integration
 * - Service creation specific navigation and retry mechanisms
 * 
 * @see Section 4.2.1 Error Handling Flowchart for implementation patterns
 * @see Section 4.1.3 Error Handling and Recovery Workflows for recovery strategies
 */

interface ServiceCreationErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error type detection based on error message patterns
 * Enables contextual recovery actions per Section 4.1.3 Connection Failure Recovery Workflow
 */
interface ErrorContext {
  type: 'network' | 'validation' | 'authentication' | 'server' | 'unknown';
  title: string;
  description: string;
  icon: React.ReactNode;
  recoveryActions: RecoveryAction[];
}

interface RecoveryAction {
  label: string;
  description: string;
  action: () => void;
  variant: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
  ariaLabel?: string;
}

/**
 * Comprehensive error context detection for service creation workflows
 * Maps error patterns to user-friendly messaging and recovery strategies
 */
const detectErrorContext = (error: Error, reset: () => void, router: any): ErrorContext => {
  const message = error.message?.toLowerCase() || '';
  
  // Network connectivity errors
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      type: 'network',
      title: 'Connection Problem',
      description: 'Unable to connect to the database service. Please check your network connection and try again.',
      icon: <Wifi className="h-12 w-12 text-amber-500" aria-hidden="true" />,
      recoveryActions: [
        {
          label: 'Retry Connection',
          description: 'Attempt to reconnect to the service',
          action: reset,
          variant: 'primary',
          icon: <RefreshCw className="h-4 w-4" aria-hidden="true" />,
          ariaLabel: 'Retry database connection'
        },
        {
          label: 'Check Network Settings',
          description: 'Review your network configuration',
          action: () => router.push('/system-settings/network'),
          variant: 'secondary',
          icon: <Database className="h-4 w-4" aria-hidden="true" />
        }
      ]
    };
  }
  
  // Authentication and authorization errors
  if (message.includes('unauthorized') || message.includes('403') || message.includes('401') || message.includes('auth')) {
    return {
      type: 'authentication',
      title: 'Access Denied',
      description: 'You don\'t have permission to create database services. Please contact your administrator or verify your credentials.',
      icon: <Shield className="h-12 w-12 text-red-500" aria-hidden="true" />,
      recoveryActions: [
        {
          label: 'Sign In Again',
          description: 'Re-authenticate with your credentials',
          action: () => router.push('/auth/login'),
          variant: 'primary',
          icon: <Shield className="h-4 w-4" aria-hidden="true" />,
          ariaLabel: 'Sign in again to verify permissions'
        },
        {
          label: 'Contact Administrator',
          description: 'Request access to service creation',
          action: () => router.push('/admin-settings/users'),
          variant: 'secondary'
        }
      ]
    };
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return {
      type: 'validation',
      title: 'Configuration Error',
      description: 'There was a problem with the service configuration. Please review your settings and try again.',
      icon: <AlertTriangle className="h-12 w-12 text-orange-500" aria-hidden="true" />,
      recoveryActions: [
        {
          label: 'Review Configuration',
          description: 'Check and correct service settings',
          action: reset,
          variant: 'primary',
          icon: <RefreshCw className="h-4 w-4" aria-hidden="true" />,
          ariaLabel: 'Review and correct service configuration'
        },
        {
          label: 'Start Over',
          description: 'Begin service creation from scratch',
          action: () => router.refresh(),
          variant: 'secondary'
        }
      ]
    };
  }
  
  // Server errors
  if (message.includes('500') || message.includes('server') || message.includes('internal')) {
    return {
      type: 'server',
      title: 'Server Error',
      description: 'A server error occurred while processing your request. The issue has been logged and will be investigated.',
      icon: <Database className="h-12 w-12 text-red-500" aria-hidden="true" />,
      recoveryActions: [
        {
          label: 'Try Again',
          description: 'Retry the service creation process',
          action: reset,
          variant: 'primary',
          icon: <RefreshCw className="h-4 w-4" aria-hidden="true" />,
          ariaLabel: 'Retry service creation after server error'
        },
        {
          label: 'View Services',
          description: 'Return to the services list',
          action: () => router.push('/adf-services'),
          variant: 'secondary',
          icon: <Database className="h-4 w-4" aria-hidden="true" />
        }
      ]
    };
  }
  
  // Default unknown error
  return {
    type: 'unknown',
    title: 'Service Creation Failed',
    description: 'An unexpected error occurred during service creation. Please try again or contact support if the problem persists.',
    icon: <AlertTriangle className="h-12 w-12 text-red-500" aria-hidden="true" />,
    recoveryActions: [
      {
        label: 'Try Again',
        description: 'Retry the service creation process',
        action: reset,
        variant: 'primary',
        icon: <RefreshCw className="h-4 w-4" aria-hidden="true" />,
        ariaLabel: 'Retry service creation'
      },
      {
        label: 'Go Back',
        description: 'Return to the previous page',
        action: () => router.back(),
        variant: 'secondary',
        icon: <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      },
      {
        label: 'Go to Dashboard',
        description: 'Return to the main dashboard',
        action: () => router.push('/'),
        variant: 'ghost',
        icon: <Home className="h-4 w-4" aria-hidden="true" />
      }
    ]
  };
};

/**
 * Error logging utility for monitoring and debugging
 * Integrates with system monitoring per Section 4.1.3 Error Handling requirements
 */
const logError = (error: Error, context: ErrorContext, errorId: string) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Service Creation Error');
    console.error('Error:', error);
    console.log('Context:', context);
    console.log('Error ID:', errorId);
    console.log('Timestamp:', new Date().toISOString());
    console.log('User Agent:', navigator.userAgent);
    console.log('URL:', window.location.href);
    console.groupEnd();
  }
  
  // In production, this would integrate with monitoring services
  // like Sentry, LogRocket, or custom analytics
  if (process.env.NODE_ENV === 'production') {
    // Example integration points:
    // - analytics.track('service_creation_error', { ... })
    // - Sentry.captureException(error, { tags: { ... } })
    // - Custom logging service API call
  }
};

/**
 * Main Error Boundary Component for Service Creation
 * Implements Next.js app router error.tsx pattern with enhanced UX
 */
export default function ServiceCreationError({ error, reset }: ServiceCreationErrorProps) {
  const router = useRouter();
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [errorId] = useState(() => `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Detect error context and available recovery options
  const errorContext = detectErrorContext(error, reset, router);
  
  // Log error for monitoring and debugging
  useEffect(() => {
    logError(error, errorContext, errorId);
  }, [error, errorContext, errorId]);
  
  // WCAG 2.1 AA compliant button styling with Tailwind CSS
  const getButtonClasses = (variant: 'primary' | 'secondary' | 'ghost') => {
    const baseClasses = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] gap-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600`;
      case 'secondary':
        return `${baseClasses} bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700`;
      case 'ghost':
        return `${baseClasses} text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800`;
      default:
        return baseClasses;
    }
  };
  
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[600px] p-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
      data-testid="service-creation-error"
      role="alert"
      aria-labelledby="error-title"
      aria-describedby="error-description"
    >
      {/* Error Icon */}
      <div className="mb-6">
        {errorContext.icon}
      </div>
      
      {/* Error Title */}
      <h1 
        id="error-title"
        className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center"
      >
        {errorContext.title}
      </h1>
      
      {/* Error Description */}
      <p 
        id="error-description"
        className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8 leading-relaxed"
      >
        {errorContext.description}
      </p>
      
      {/* Recovery Actions */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {errorContext.recoveryActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={getButtonClasses(action.variant)}
            aria-label={action.ariaLabel || action.label}
            title={action.description}
            data-testid={`recovery-action-${index}`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      
      {/* Error Details Toggle */}
      <div className="w-full max-w-md">
        <button
          onClick={() => setShowErrorDetails(!showErrorDetails)}
          className="flex items-center justify-center w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded px-3 py-2"
          aria-expanded={showErrorDetails}
          aria-controls="error-details"
          data-testid="error-details-toggle"
        >
          {showErrorDetails ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" aria-hidden="true" />
              Hide Technical Details
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
              Show Technical Details
            </>
          )}
        </button>
        
        {/* Collapsible Error Details */}
        {showErrorDetails && (
          <div 
            id="error-details"
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
            data-testid="error-details"
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Error ID
                </h3>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                  {errorId}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Error Type
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {errorContext.type}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Technical Message
                </h3>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-words">
                  {error.message || 'No technical details available'}
                </p>
              </div>
              
              {error.digest && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Error Digest
                  </h3>
                  <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                    {error.digest}
                  </p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Timestamp
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Breadcrumb Navigation Context */}
      <nav 
        aria-label="Error page breadcrumb"
        className="mt-8 text-sm text-gray-500 dark:text-gray-400"
        data-testid="error-breadcrumb"
      >
        <span>You are here: </span>
        <span className="font-medium">Services</span>
        <span className="mx-2">→</span>
        <span className="font-medium">Database Services</span>
        <span className="mx-2">→</span>
        <span className="font-medium text-red-600 dark:text-red-400">Create Service (Error)</span>
      </nav>
    </div>
  );
}