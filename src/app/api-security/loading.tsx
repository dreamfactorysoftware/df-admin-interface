/**
 * Loading component for API Security section
 * 
 * Displays skeleton states and loading indicators while security data is being fetched.
 * Provides smooth user experience during data loading operations for both limits and roles management.
 * 
 * Features:
 * - WCAG 2.1 AA compliant accessibility attributes for screen readers
 * - Tailwind CSS animation classes for smooth loading transitions
 * - Responsive design patterns for all supported breakpoints
 * - Skeleton UI patterns replacing Angular Material progress indicators
 */

import React from 'react';

/**
 * Skeleton component for individual loading elements
 * Provides consistent styling for loading placeholders across the security interface
 */
function Skeleton({ 
  className = "", 
  children, 
  ...props 
}: { 
  className?: string; 
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-secondary-200 dark:bg-secondary-700 rounded ${className}`}
      role="status"
      aria-label="Loading content"
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Loading spinner component for active loading states
 * Used for button loading states and real-time operations
 */
function LoadingSpinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div 
      className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Next.js App Router loading component for API Security section
 * 
 * Renders skeleton UI for both limits and roles management interfaces
 * Follows mobile-first responsive design patterns with proper accessibility
 */
export default function ApiSecurityLoading() {
  return (
    <div 
      className="space-y-6 p-4 sm:p-6 lg:p-8"
      role="main"
      aria-label="Loading API security interface"
    >
      {/* Screen reader announcement */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        Loading API security management interface. Please wait while we fetch your security settings.
      </div>

      {/* Header section skeleton */}
      <div className="space-y-4">
        {/* Page title skeleton */}
        <Skeleton className="h-8 w-48 sm:w-64" aria-label="Loading page title" />
        
        {/* Action buttons skeleton */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Skeleton className="h-11 w-32 sm:w-36" aria-label="Loading primary action button" />
          <Skeleton className="h-11 w-28 sm:w-32" aria-label="Loading secondary action button" />
        </div>
      </div>

      {/* Navigation tabs skeleton */}
      <div className="border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex space-x-8 overflow-x-auto">
          <Skeleton className="h-10 w-16 sm:w-20" aria-label="Loading tab option" />
          <Skeleton className="h-10 w-16 sm:w-20" aria-label="Loading tab option" />
          <Skeleton className="h-10 w-20 sm:w-24" aria-label="Loading tab option" />
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary content area (roles/limits table) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and filter controls */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full sm:w-64" aria-label="Loading search input" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" aria-label="Loading filter option" />
              <Skeleton className="h-10 w-20" aria-label="Loading filter option" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 p-4 border-b border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800">
              <Skeleton className="h-5 w-16" aria-label="Loading table header" />
              <Skeleton className="h-5 w-20" aria-label="Loading table header" />
              <Skeleton className="h-5 w-12" aria-label="Loading table header" />
              <Skeleton className="h-5 w-16 hidden sm:block" aria-label="Loading table header" />
              <Skeleton className="h-5 w-14 hidden lg:block" aria-label="Loading table header" />
            </div>

            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, index) => (
              <div 
                key={index}
                className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4 p-4 border-b border-secondary-100 dark:border-secondary-700 last:border-b-0"
              >
                <Skeleton className="h-5 w-full" aria-label={`Loading table row ${index + 1} data`} />
                <Skeleton className="h-5 w-full" aria-label={`Loading table row ${index + 1} data`} />
                <Skeleton className="h-5 w-3/4" aria-label={`Loading table row ${index + 1} data`} />
                <Skeleton className="h-5 w-full hidden sm:block" aria-label={`Loading table row ${index + 1} data`} />
                <div className="hidden lg:flex gap-2">
                  <Skeleton className="h-6 w-6 rounded" aria-label="Loading action button" />
                  <Skeleton className="h-6 w-6 rounded" aria-label="Loading action button" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton className="h-5 w-32" aria-label="Loading pagination info" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded" aria-label="Loading pagination button" />
              <Skeleton className="h-9 w-9 rounded" aria-label="Loading pagination button" />
              <Skeleton className="h-9 w-9 rounded" aria-label="Loading pagination button" />
              <Skeleton className="h-9 w-9 rounded" aria-label="Loading pagination button" />
            </div>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="space-y-6">
          {/* Quick actions card */}
          <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6">
            <Skeleton className="h-6 w-24 mb-4" aria-label="Loading card title" />
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" aria-label="Loading quick action button" />
              <Skeleton className="h-9 w-full" aria-label="Loading quick action button" />
              <Skeleton className="h-9 w-full" aria-label="Loading quick action button" />
            </div>
          </div>

          {/* Statistics card */}
          <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6">
            <Skeleton className="h-6 w-20 mb-4" aria-label="Loading statistics title" />
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <Skeleton className="h-8 w-12 mx-auto mb-2" aria-label="Loading statistic value" />
                <Skeleton className="h-4 w-16 mx-auto" aria-label="Loading statistic label" />
              </div>
              <div className="text-center">
                <Skeleton className="h-8 w-12 mx-auto mb-2" aria-label="Loading statistic value" />
                <Skeleton className="h-4 w-16 mx-auto" aria-label="Loading statistic label" />
              </div>
            </div>
          </div>

          {/* Recent activity card */}
          <div className="bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6">
            <Skeleton className="h-6 w-28 mb-4" aria-label="Loading activity title" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" aria-label={`Loading activity item ${index + 1} icon`} />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" aria-label={`Loading activity item ${index + 1} description`} />
                    <Skeleton className="h-3 w-20" aria-label={`Loading activity item ${index + 1} timestamp`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay for real-time operations */}
      <div 
        className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Processing security operation"
        id="security-loading-overlay"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4 text-primary-600" />
            <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
              Processing Security Changes
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Please wait while we update your security settings...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}