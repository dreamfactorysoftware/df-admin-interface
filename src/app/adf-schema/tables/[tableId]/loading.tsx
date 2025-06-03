/**
 * Next.js Loading Component for Table Details Page
 * 
 * Provides skeleton UI during data fetching operations for table details functionality.
 * Implements responsive design patterns with Tailwind CSS and maintains WCAG 2.1 AA
 * accessibility standards with proper ARIA labels and loading announcements.
 * 
 * Features:
 * - Skeleton loading states for all major page sections
 * - Responsive breakpoint handling (mobile, tablet, desktop)
 * - WCAG 2.1 AA compliant accessibility features
 * - Optimized animation performance with CSS transforms
 * - Screen reader announcements for loading states
 * 
 * @see Section 7.5.1 - Segment-level loading implementation
 * @see Section 7.7.1 - WCAG 2.1 AA compliance requirements
 * @see Section 7.5.2 - Responsive design patterns
 */

import React from 'react';

/**
 * Loading component for table details page
 * Displays skeleton UI while data is being fetched
 */
export default function TableDetailsLoading() {
  return (
    <div 
      className="space-y-6 animate-fade-in" 
      data-testid="table-details-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading table details"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        Loading table details and schema information. Please wait.
      </div>

      {/* Page Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title and Breadcrumb Area */}
        <div className="space-y-3">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            <div className="h-4 w-1 bg-gray-300 dark:bg-gray-600"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-4 w-1 bg-gray-300 dark:bg-gray-600"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          </div>
          
          {/* Page title skeleton */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 lg:w-80 animate-pulse"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 lg:w-64 animate-pulse"></div>
          </div>
        </div>

        {/* Action buttons area */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-32 animate-pulse"></div>
          <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-full sm:w-28 animate-pulse"></div>
        </div>
      </div>

      {/* Tab Navigation Section */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 overflow-x-auto">
          {/* Tab skeleton items */}
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 pb-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Primary Content Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Form/Content Card */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-6">
              {/* Section title */}
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
              
              {/* Form fields grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    {/* Field label */}
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    {/* Field input */}
                    <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 animate-pulse"></div>
                  </div>
                ))}
              </div>
              
              {/* Description field (full width) */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Data Table Section (for fields/relationships) */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                <div className="flex gap-3">
                  <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  <div className="h-9 bg-primary-200 dark:bg-primary-700 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Table content */}
            <div className="p-6">
              {/* Table headers */}
              <div className="grid grid-cols-4 gap-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
              
              {/* Table rows */}
              <div className="space-y-3 pt-3">
                {Array.from({ length: 8 }).map((_, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-4 gap-4 py-2">
                    {Array.from({ length: 4 }).map((_, colIndex) => (
                      <div 
                        key={colIndex} 
                        className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
                        style={{ 
                          animationDelay: `${(rowIndex * 4 + colIndex) * 50}ms` 
                        }}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Section (Desktop Only) */}
        <div className="hidden xl:block space-y-6">
          {/* Info Panel */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              
              {/* Info items */}
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Panel */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              
              {/* Action buttons */}
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar (Mobile Only) */}
      <div className="xl:hidden sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-3">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
          <div className="h-12 bg-primary-200 dark:bg-primary-700 rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* Loading Progress Indicator */}
      <div className="fixed bottom-4 right-4 z-50 lg:bottom-6 lg:right-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center space-x-3">
            {/* Spinner */}
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 dark:border-primary-400"></div>
            {/* Loading text */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Loading table details...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}