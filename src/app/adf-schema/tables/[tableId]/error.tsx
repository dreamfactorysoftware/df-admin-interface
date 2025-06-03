'use client';

/**
 * Table Details Error Component
 * 
 * Error boundary component for table details page implementing React error boundary pattern.
 * Provides user-friendly error display with recovery options and detailed error information
 * for development environments. Maintains accessible design and consistent styling.
 * 
 * Features:
 * - React error boundary with graceful fallback UI
 * - Categorized error types with specific recovery actions
 * - WCAG 2.1 AA accessibility compliance with proper ARIA attributes
 * - Development mode detailed error information
 * - User-friendly error messages with actionable suggestions
 * - Responsive design with Tailwind CSS
 * 
 * @fileoverview Table details error boundary component
 * @version 1.0.0
 * @created 2024-12-28
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  ChevronLeftIcon,
  BugAntIcon,
  ServerIcon,
  KeyIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

/**
 * Error types for categorized error handling
 */
type ErrorType = 
  | 'network'
  | 'authentication' 
  | 'authorization'
  | 'not-found'
  | 'validation'
  | 'server'
  | 'unknown';

/**
 * Error information interface
 */
interface ErrorInfo {
  type: ErrorType;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  suggestions: string[];
  recoveryActions: Array<{
    label: string;
    action: () => void;
    variant: 'primary' | 'secondary';
  }>;
}

/**
 * Props interface for TableDetailsError
 */
interface TableDetailsErrorProps {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}

/**
 * Categorize error based on error object properties
 */
function categorizeError(error: Error & { status?: number }): ErrorType {
  const status = error.status;
  const message = error.message?.toLowerCase() || '';

  // HTTP status-based categorization
  if (status === 401) return 'authentication';
  if (status === 403) return 'authorization';
  if (status === 404) return 'not-found';
  if (status === 400) return 'validation';
  if (status && status >= 500) return 'server';

  // Message-based categorization
  if (message.includes('network') || message.includes('fetch')) return 'network';
  if (message.includes('unauthorized') || message.includes('login')) return 'authentication';
  if (message.includes('forbidden') || message.includes('permission')) return 'authorization';
  if (message.includes('not found') || message.includes('does not exist')) return 'not-found';
  if (message.includes('validation') || message.includes('invalid')) return 'validation';
  if (message.includes('server') || message.includes('internal')) return 'server';

  return 'unknown';
}

/**
 * Main TableDetailsError component
 */
export function TableDetailsError({ error, reset }: TableDetailsErrorProps) {
  const router = useRouter();

  // Log error for monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Table Details Error:', error);
    }
  }, [error]);

  // Categorize the error
  const errorType = categorizeError(error);

  // Get error information based on type
  const getErrorInfo = (): ErrorInfo => {
    const commonActions = [
      {
        label: 'Try Again',
        action: reset,
        variant: 'primary' as const,
      },
      {
        label: 'Go Back',
        action: () => router.back(),
        variant: 'secondary' as const,
      },
    ];

    switch (errorType) {
      case 'network':
        return {
          type: 'network',
          title: 'Network Connection Error',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
          icon: WifiIcon,
          suggestions: [
            'Check your internet connection',
            'Verify VPN or proxy settings',
            'Try refreshing the page',
            'Contact your system administrator if the problem persists',
          ],
          recoveryActions: commonActions,
        };

      case 'authentication':
        return {
          type: 'authentication',
          title: 'Authentication Required',
          description: 'You need to log in to access this table. Please authenticate and try again.',
          icon: KeyIcon,
          suggestions: [
            'Log in to your account',
            'Check if your session has expired',
            'Verify your credentials',
            'Contact an administrator for access',
          ],
          recoveryActions: [
            {
              label: 'Log In',
              action: () => router.push('/auth/login'),
              variant: 'primary',
            },
            ...commonActions,
          ],
        };

      case 'authorization':
        return {
          type: 'authorization',
          title: 'Access Denied',
          description: 'You do not have permission to access this table or perform this operation.',
          icon: ExclamationTriangleIcon,
          suggestions: [
            'Contact your administrator for access permissions',
            'Verify you have the correct role assigned',
            'Check if the table exists and you have read access',
            'Try accessing a different table or service',
          ],
          recoveryActions: [
            {
              label: 'Contact Admin',
              action: () => router.push('/admin-settings/users'),
              variant: 'primary',
            },
            ...commonActions,
          ],
        };

      case 'not-found':
        return {
          type: 'not-found',
          title: 'Table Not Found',
          description: 'The requested table could not be found. It may have been deleted or moved.',
          icon: ExclamationTriangleIcon,
          suggestions: [
            'Verify the table name is correct',
            'Check if the table exists in the database',
            'Refresh the schema discovery',
            'Try accessing the table list to find the correct name',
          ],
          recoveryActions: [
            {
              label: 'View Tables',
              action: () => router.push('/adf-schema/tables'),
              variant: 'primary',
            },
            ...commonActions,
          ],
        };

      case 'validation':
        return {
          type: 'validation',
          title: 'Validation Error',
          description: 'The provided data is invalid or incomplete. Please check your input and try again.',
          icon: ExclamationTriangleIcon,
          suggestions: [
            'Review the form data for errors',
            'Check required fields are completed',
            'Verify data formats and constraints',
            'Check for duplicate names or conflicts',
          ],
          recoveryActions: commonActions,
        };

      case 'server':
        return {
          type: 'server',
          title: 'Server Error',
          description: 'An internal server error occurred. The development team has been notified.',
          icon: ServerIcon,
          suggestions: [
            'Try again in a few moments',
            'Check if other features are working',
            'Contact support if the problem persists',
            'Save your work and refresh the page',
          ],
          recoveryActions: [
            ...commonActions,
            {
              label: 'Report Issue',
              action: () => window.open('mailto:support@dreamfactory.com', '_blank'),
              variant: 'secondary',
            },
          ],
        };

      default:
        return {
          type: 'unknown',
          title: 'Unexpected Error',
          description: 'An unexpected error occurred while loading the table details.',
          icon: BugAntIcon,
          suggestions: [
            'Try refreshing the page',
            'Clear your browser cache',
            'Check for browser console errors',
            'Report this issue to support',
          ],
          recoveryActions: [
            ...commonActions,
            {
              label: 'Report Bug',
              action: () => window.open('mailto:support@dreamfactory.com', '_blank'),
              variant: 'secondary',
            },
          ],
        };
    }
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Error Content */}
        <div className="min-h-[600px] flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                <Icon className="h-12 w-12 text-red-600 dark:text-red-500" aria-hidden="true" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {errorInfo.title}
            </h1>

            {/* Error Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {errorInfo.description}
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Development Error Details:
                </h3>
                <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                  {error.message}
                  {error.stack && '\n\nStack Trace:\n' + error.stack}
                  {error.digest && '\n\nError Digest: ' + error.digest}
                </pre>
              </div>
            )}

            {/* Recovery Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              {errorInfo.recoveryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={cn(
                    'inline-flex items-center px-6 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                    action.variant === 'primary'
                      ? 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-primary-500'
                  )}
                >
                  {action.label === 'Try Again' && (
                    <ArrowPathIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  {action.label === 'Go Back' && (
                    <ChevronLeftIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  {action.label.includes('Home') && (
                    <HomeIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  {action.label}
                </button>
              ))}
            </div>

            {/* Suggestions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-left">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
                Troubleshooting Suggestions:
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" role="alert" aria-live="assertive">
        Error occurred: {errorInfo.title}. {errorInfo.description}
      </div>
    </div>
  );
}

export default TableDetailsError;