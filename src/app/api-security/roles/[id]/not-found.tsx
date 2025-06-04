/**
 * Role Not Found Component
 * 
 * Not found component for the role editing page that displays when a role ID parameter
 * doesn't correspond to an existing role in the system. Provides clear messaging about 
 * the invalid role ID and navigation options to return to the roles list or create a new role.
 * 
 * Features:
 * - User-friendly error messaging for non-existent roles
 * - Navigation recovery options with Next.js Link components
 * - WCAG 2.1 AA compliant accessibility features
 * - Consistent Tailwind CSS styling with application theme
 * - Role ID display for debugging purposes
 * - Proper heading structure and navigation landmarks
 */

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// INLINE ALERT COMPONENT
// ============================================================================

interface InlineAlertProps {
  variant?: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

function InlineAlert({ 
  variant = 'error', 
  title, 
  description, 
  icon, 
  className, 
  children 
}: InlineAlertProps) {
  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
  };

  const iconStyles = {
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-yellow-500 dark:text-yellow-400',
    info: 'text-blue-500 dark:text-blue-400',
    success: 'text-green-500 dark:text-green-400'
  };

  const defaultIcons = {
    error: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L8.53 10.53a.75.75 0 00-1.06 1.061l2 2a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <div 
      className={cn(
        'border rounded-lg p-4',
        variantStyles[variant],
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <div className={cn('flex h-5 w-5', iconStyles[variant])}>
            {icon || defaultIcons[variant]}
          </div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {title}
          </h3>
          {description && (
            <div className="mt-2 text-sm opacity-90">
              {description}
            </div>
          )}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ROLE NOT FOUND COMPONENT
// ============================================================================

/**
 * RoleNotFound Component
 * 
 * Displays a user-friendly 404 error when a role ID doesn't exist.
 * Provides navigation options and debugging information.
 */
export default function RoleNotFound() {
  const params = useParams();
  const roleId = params?.id as string;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </div>
          
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Role Not Found
          </h1>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The role you're looking for doesn't exist or may have been removed.
          </p>
        </div>

        {/* Error Details Alert */}
        <InlineAlert 
          variant="error"
          title="Invalid Role ID"
          description={
            roleId 
              ? `The role ID "${roleId}" could not be found in the system.`
              : 'No role ID was provided in the request.'
          }
          className="mt-6"
        >
          <div className="mt-2 text-xs opacity-75">
            <strong>Role ID:</strong> {roleId || 'Not provided'}
          </div>
        </InlineAlert>

        {/* Navigation Options */}
        <nav className="space-y-4" aria-label="Error recovery navigation">
          <div className="space-y-3">
            <Link href="/api-security/roles" className="block">
              <Button 
                fullWidth 
                variant="default"
                className="justify-center"
                aria-label="Return to roles list page"
              >
                <svg 
                  className="-ml-1 mr-2 h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 10h16M4 14h16M4 18h16" 
                  />
                </svg>
                View All Roles
              </Button>
            </Link>

            <Link href="/api-security/roles/create" className="block">
              <Button 
                fullWidth 
                variant="outline"
                className="justify-center"
                aria-label="Create a new role"
              >
                <svg 
                  className="-ml-1 mr-2 h-4 w-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
                  />
                </svg>
                Create New Role
              </Button>
            </Link>
          </div>

          {/* Secondary Navigation */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/api-security" className="block">
              <Button 
                fullWidth 
                variant="ghost"
                size="sm"
                className="justify-center text-gray-600 dark:text-gray-400"
                aria-label="Go to API security dashboard"
              >
                <svg 
                  className="-ml-1 mr-2 h-3 w-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
                API Security Dashboard
              </Button>
            </Link>
          </div>
        </nav>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            If you believe this is an error, please check the role ID or contact your administrator.
          </p>
        </div>

        {/* Accessibility Features */}
        <div className="sr-only" aria-live="polite">
          Role with ID {roleId || 'unknown'} was not found. 
          Navigation options are available to return to the roles list or create a new role.
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { InlineAlert };
export type { InlineAlertProps };