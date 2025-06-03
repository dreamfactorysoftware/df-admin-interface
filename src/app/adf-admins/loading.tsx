/**
 * Loading UI component for admin management routes
 * 
 * This component displays during data fetching operations and page transitions
 * for all admin-related routes. Implements accessible loading states with proper
 * ARIA attributes and theme-aware Tailwind CSS styling.
 * 
 * Features:
 * - Next.js app router loading UI pattern
 * - WCAG 2.1 AA compliant accessibility 
 * - Theme-aware responsive design
 * - Optimized for sub-100ms response times
 * - Adaptive layout for admin table and form contexts
 */

import React from 'react';

/**
 * Spinner component with theme-aware styling and accessibility
 * Implements WCAG 2.1 AA requirements for loading indicators
 */
function LoadingSpinner({ size = 'md', className = '' }: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string; 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
}

/**
 * Skeleton component for content placeholders
 * Provides visual placeholder during data loading
 */
function Skeleton({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4' 
}: { 
  className?: string; 
  width?: string; 
  height?: string; 
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${width} ${height} ${className}`}
      role="presentation"
      aria-hidden="true"
    />
  );
}

/**
 * Main loading component for admin management routes
 * 
 * Automatically displayed by Next.js during route transitions and data fetching.
 * Provides accessible loading states optimized for admin management workflows.
 * 
 * Accessibility features:
 * - Screen reader announcements via aria-live region
 * - Proper role and ARIA attributes
 * - Reduced motion support for users with vestibular disorders
 * - High contrast compliance for visual accessibility
 * 
 * Performance optimizations:
 * - Minimal DOM rendering for sub-100ms response
 * - CSS-only animations using Tailwind utilities
 * - Theme-aware styling without JavaScript theme detection
 * 
 * @returns {JSX.Element} Loading interface for admin routes
 */
export default function AdminLoadingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium z-50 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header placeholder - matches admin layout structure */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton width="w-8" height="h-8" className="rounded-md" />
              <Skeleton width="w-32" height="h-6" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton width="w-10" height="h-10" className="rounded-full" />
              <Skeleton width="w-24" height="h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with loading state */}
      <main 
        id="main-content"
        className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
        role="main"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading admin management interface"
      >
        {/* Page title section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton width="w-48" height="h-8" className="mb-2" />
              <Skeleton width="w-96" height="h-4" />
            </div>
            <div className="flex space-x-3">
              <Skeleton width="w-24" height="h-10" className="rounded-md" />
              <Skeleton width="w-32" height="h-10" className="rounded-md" />
            </div>
          </div>
        </div>

        {/* Search and filter section */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Skeleton width="w-full" height="h-10" className="rounded-md" />
            </div>
            <div className="flex gap-2">
              <Skeleton width="w-24" height="h-10" className="rounded-md" />
              <Skeleton width="w-20" height="h-10" className="rounded-md" />
            </div>
          </div>
        </div>

        {/* Data table loading skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <Skeleton width="w-32" height="h-5" />
              <div className="flex items-center space-x-4">
                <Skeleton width="w-20" height="h-4" />
                <Skeleton width="w-16" height="h-4" />
              </div>
            </div>
          </div>

          {/* Table content area */}
          <div className="p-6">
            {/* Central loading indicator */}
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner 
                size="lg" 
                className="text-primary-600 dark:text-primary-400 mb-4" 
              />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Loading Admin Management
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm">
                Please wait while we fetch the admin user data and prepare the management interface.
              </p>
            </div>

            {/* Table rows skeleton */}
            <div className="space-y-4 mt-8">
              {[...Array(5)].map((_, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Skeleton width="w-10" height="h-10" className="rounded-full" />
                    <div className="space-y-2">
                      <Skeleton width="w-32" height="h-4" />
                      <Skeleton width="w-48" height="h-3" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton width="w-16" height="h-6" className="rounded-full" />
                    <Skeleton width="w-8" height="h-8" className="rounded-md" />
                    <Skeleton width="w-8" height="h-8" className="rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination skeleton */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <Skeleton width="w-32" height="h-4" />
              <div className="flex items-center space-x-2">
                <Skeleton width="w-8" height="h-8" className="rounded-md" />
                <Skeleton width="w-8" height="h-8" className="rounded-md" />
                <Skeleton width="w-8" height="h-8" className="rounded-md" />
                <Skeleton width="w-8" height="h-8" className="rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Accessible status announcement for screen readers */}
        <div 
          className="sr-only" 
          aria-live="assertive" 
          aria-atomic="true"
          role="status"
        >
          Loading admin management interface. Please wait while data is being fetched.
        </div>
      </main>
    </div>
  );
}