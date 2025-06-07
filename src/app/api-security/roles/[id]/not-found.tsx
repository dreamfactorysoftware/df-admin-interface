'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * Not Found component for role editing page.
 * 
 * Displays when a role ID parameter doesn't correspond to an existing role
 * in the system. Provides clear messaging about the invalid role ID and 
 * navigation options to return to the roles list or create a new role.
 * 
 * Features:
 * - Next.js app router not-found conventions
 * - WCAG 2.1 AA accessibility compliance
 * - User-friendly error messaging with debugging information
 * - Recovery navigation options
 * - Consistent UI patterns with Tailwind CSS styling
 * 
 * @returns JSX.Element The not found component
 */
export default function RoleNotFound() {
  const params = useParams();
  const roleId = params?.id as string;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Main container with proper landmark */}
        <main 
          role="main" 
          aria-labelledby="not-found-heading"
          className="space-y-6"
        >
          {/* Visual indicator */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            {/* Main heading */}
            <h1 
              id="not-found-heading"
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            >
              Role Not Found
            </h1>
            
            {/* Descriptive text */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The role you're looking for doesn't exist or may have been deleted.
            </p>
          </div>

          {/* Error details alert */}
          <Alert variant="error" className="text-left">
            <Alert.Icon />
            <Alert.Content>
              <Alert.Title>Invalid Role ID</Alert.Title>
              <Alert.Description className="mt-2 space-y-2">
                <p>
                  The role ID <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">{roleId}</code> does not correspond to an existing role in the system.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This may happen if the role was recently deleted or if you followed an outdated link.
                </p>
              </Alert.Description>
            </Alert.Content>
          </Alert>

          {/* Navigation options */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              What would you like to do?
            </h2>
            
            {/* Primary action - Return to roles list */}
            <Link 
              href="/api-security/roles"
              className="block w-full"
              aria-label="Navigate back to the roles management list"
            >
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full justify-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  />
                </svg>
                Back to Roles List
              </Button>
            </Link>

            {/* Secondary action - Create new role */}
            <Link 
              href="/api-security/roles/create"
              className="block w-full"
              aria-label="Create a new role"
            >
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full justify-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
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

            {/* Tertiary action - Go to dashboard */}
            <Link 
              href="/"
              className="block w-full"
              aria-label="Navigate to the main dashboard"
            >
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full justify-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Go to Dashboard
              </Button>
            </Link>
          </div>

          {/* Help text */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              If you believe this is an error, please contact your system administrator.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}