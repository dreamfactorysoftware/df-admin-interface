/**
 * Loading component for role creation page
 * 
 * Displays skeleton states and loading indicators while the role creation form
 * and dependencies are being loaded. Provides smooth user experience during
 * initial page load and data fetching operations with accessible skeleton UI
 * patterns and WCAG 2.1 AA compliance.
 * 
 * Features:
 * - Next.js app router loading conventions
 * - Accessible skeleton UI with proper ARIA labels
 * - Tailwind CSS animations for smooth transitions
 * - Responsive design for all supported breakpoints
 * - Semantic HTML structure matching role creation form
 */

import React from 'react';

/**
 * Skeleton component for creating loading placeholders
 * Provides consistent skeleton styling with accessibility attributes
 */
function Skeleton({ 
  className = '',
  children,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      role="status"
      aria-label="Loading..."
      {...props}
    >
      {children && <span className="sr-only">{children}</span>}
    </div>
  );
}

/**
 * Loading spinner component for dynamic content areas
 * Used for sections that require more complex loading animations
 */
function LoadingSpinner({ 
  className = '',
  size = 'md' 
}: { 
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Role creation page loading component
 * 
 * Creates skeleton states that match the structure of the role creation form:
 * - Page header and description
 * - Alert placeholder
 * - Form fields (name, active toggle, description textarea)
 * - Service access configuration section
 * - Lookup keys section
 * - Action buttons
 */
export default function RoleCreateLoading() {
  return (
    <div 
      className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading role creation form"
    >
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 sm:w-64">
          Loading page title
        </Skeleton>
        <Skeleton className="h-4 w-full max-w-2xl">
          Loading page description
        </Skeleton>
      </div>

      {/* Alert Placeholder */}
      <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4">
        <Skeleton className="h-5 w-3/4 sm:w-1/2">
          Loading alert area
        </Skeleton>
      </div>

      {/* Main Form Container */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <div className="space-y-6">
          
          {/* Role Name Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16">
              Loading name label
            </Skeleton>
            <Skeleton className="h-12 w-full rounded-md">
              Loading name input field
            </Skeleton>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-3">
            <Skeleton className="h-6 w-12 rounded-full">
              Loading active toggle
            </Skeleton>
            <Skeleton className="h-4 w-16">
              Loading active label
            </Skeleton>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24">
              Loading description label
            </Skeleton>
            <Skeleton className="h-24 w-full rounded-md">
              Loading description textarea
            </Skeleton>
          </div>

          {/* Service Access Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32">
                Loading service access title
              </Skeleton>
              <LoadingSpinner size="sm" className="text-gray-400" />
            </div>
            
            {/* Service Access Loading Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-3 rounded-md border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20">
                      Loading service name
                    </Skeleton>
                    <Skeleton className="h-6 w-12 rounded-full">
                      Loading service toggle
                    </Skeleton>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16">
                      Loading access level
                    </Skeleton>
                    <div className="flex space-x-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-6 w-16 rounded">
                          Loading permission
                        </Skeleton>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lookup Keys Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28">
                Loading lookup keys title
              </Skeleton>
              <Skeleton className="h-4 w-full max-w-xl">
                Loading lookup keys description
              </Skeleton>
            </div>
            
            {/* Lookup Keys Loading Table */}
            <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
              <div className="bg-gray-50 dark:bg-gray-800 p-4">
                <div className="flex space-x-4">
                  <Skeleton className="h-4 w-16">
                    Loading key header
                  </Skeleton>
                  <Skeleton className="h-4 w-20">
                    Loading value header
                  </Skeleton>
                  <Skeleton className="h-4 w-16">
                    Loading actions header
                  </Skeleton>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4">
                    <Skeleton className="h-8 w-32">
                      Loading lookup key
                    </Skeleton>
                    <Skeleton className="h-8 w-40">
                      Loading lookup value
                    </Skeleton>
                    <Skeleton className="h-8 w-20 rounded">
                      Loading action button
                    </Skeleton>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4">
                <Skeleton className="h-8 w-32 rounded">
                  Loading add key button
                </Skeleton>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6 sm:flex-row sm:justify-between sm:space-x-4 sm:space-y-0">
            <Skeleton className="h-10 w-24 rounded">
              Loading cancel button
            </Skeleton>
            <Skeleton className="h-10 w-20 rounded">
              Loading save button
            </Skeleton>
          </div>
        </div>
      </div>

      {/* Screen Reader Status */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        Loading role creation form. Please wait while the form components and data are being loaded.
      </div>
    </div>
  );
}