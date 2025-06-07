/**
 * API Security Loading Component
 * 
 * Next.js loading component for the security section that displays skeleton states
 * and loading indicators while security data is being fetched. Provides smooth
 * user experience during data loading operations for both limits and roles management.
 * 
 * Features:
 * - WCAG 2.1 AA compliant loading states with screen reader support
 * - Responsive skeleton UI for desktop and mobile viewports
 * - Smooth Tailwind CSS animations and transitions
 * - Accessible loading indicators with proper ARIA attributes
 * - Security-specific content placeholders for limits and roles
 */

'use client';

import React from 'react';

/**
 * Skeleton component for creating loading placeholders
 * Implements WCAG 2.1 AA compliant loading animations
 */
function Skeleton({ 
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  ...props 
}: {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
  [key: string]: any;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${width} ${height} ${rounded} ${className}`}
      aria-hidden="true"
      role="presentation"
      {...props}
    />
  );
}

/**
 * Loading spinner component with accessibility support
 * Provides visual and screen reader feedback during loading operations
 */
function LoadingSpinner({ 
  size = 'md',
  className = '',
  label = 'Loading...'
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg
        className={`animate-spin text-primary-600 ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
        role="presentation"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Security overview loading skeleton
 * Displays placeholder content for the main security dashboard
 */
function SecurityOverviewSkeleton() {
  return (
    <div className="space-y-6" role="region" aria-label="Loading security overview">
      {/* Page header skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <Skeleton width="w-48" height="h-8" className="mb-2" />
        <Skeleton width="w-96" height="h-4" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton width="w-20" height="h-4" />
              <Skeleton width="w-6" height="h-6" rounded="rounded-full" />
            </div>
            <Skeleton width="w-24" height="h-8" />
            <Skeleton width="w-32" height="h-3" />
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <Skeleton width="w-40" height="h-6" className="mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
              <Skeleton width="w-8" height="h-8" rounded="rounded-lg" />
              <Skeleton width="w-32" height="h-5" />
              <Skeleton width="w-full" height="h-4" />
              <Skeleton width="w-20" height="h-8" rounded="rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Security navigation loading skeleton
 * Provides placeholder for the security section navigation
 */
function SecurityNavSkeleton() {
  return (
    <nav className="space-y-2" role="navigation" aria-label="Loading security navigation">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 px-3 py-2">
          <Skeleton width="w-5" height="h-5" rounded="rounded" />
          <Skeleton width="w-24" height="h-4" />
        </div>
      ))}
    </nav>
  );
}

/**
 * Main loading component for the API Security section
 * Implements Next.js app router loading.tsx conventions
 */
export default function ApiSecurityLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Screen reader announcement */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        Loading API security configuration. Please wait...
      </div>

      {/* Main loading layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar skeleton - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Skeleton width="w-8" height="h-8" rounded="rounded-lg" />
              <Skeleton width="w-32" height="h-6" />
            </div>
            <SecurityNavSkeleton />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 lg:ml-0">
          {/* Mobile header with loading state */}
          <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Skeleton width="w-6" height="h-6" rounded="rounded" />
                <Skeleton width="w-32" height="h-6" />
              </div>
              <LoadingSpinner size="sm" label="Loading security data" />
            </div>
          </div>

          {/* Page content */}
          <main className="p-4 md:p-6 lg:p-8">
            {/* Loading state indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                <LoadingSpinner size="md" label="Loading security configuration" />
                <span className="text-sm font-medium" aria-live="polite">
                  Loading security configuration...
                </span>
              </div>
            </div>

            {/* Security overview skeleton */}
            <SecurityOverviewSkeleton />

            {/* Recent activity skeleton */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton width="w-36" height="h-6" />
                <Skeleton width="w-20" height="h-8" rounded="rounded-md" />
              </div>
              
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton width="w-64" height="h-4" />
                      <Skeleton width="w-32" height="h-3" />
                    </div>
                    <Skeleton width="w-16" height="h-3" />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Loading overlay for enhanced accessibility */}
      <div
        className="fixed inset-0 bg-black bg-opacity-10 pointer-events-none z-40"
        aria-hidden="true"
        role="presentation"
      />

      {/* Focus trap for screen readers during loading */}
      <div
        className="sr-only"
        tabIndex={-1}
        aria-label="Security section is loading"
        role="status"
        aria-live="polite"
      >
        API security management interface is loading. You will be notified when the content is ready.
      </div>
    </div>
  );
}