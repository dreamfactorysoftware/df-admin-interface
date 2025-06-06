/**
 * @fileoverview Loading component for roles management section
 * 
 * Displays accessible skeleton states and loading indicators while role data is being fetched.
 * Provides smooth user experience during data loading operations with WCAG 2.1 AA compliant
 * skeleton UI patterns and responsive design.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

import React from 'react';

/**
 * Skeleton component for individual content blocks
 * Implements WCAG 2.1 AA compliant loading states with proper contrast and animation
 */
function SkeletonBlock({ 
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded-md',
  'aria-label': ariaLabel = 'Loading content'
}: {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${width} ${height} ${rounded} ${className}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    />
  );
}

/**
 * Loading spinner component for inline loading states
 * Provides accessible spinner with proper ARIA attributes
 */
function LoadingSpinner({ 
  size = 'w-6 h-6',
  className = '',
  'aria-label': ariaLabel = 'Loading data'
}: {
  size?: string;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      className={`${size} ${className} animate-spin`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <svg 
        className="w-full h-full text-primary-600 dark:text-primary-400" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true"
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
    </div>
  );
}

/**
 * Table skeleton component for roles data table
 * Displays a loading state that mimics the actual table structure
 */
function TableSkeleton() {
  return (
    <div 
      className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      role="status"
      aria-label="Loading roles table"
      aria-live="polite"
    >
      {/* Table Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SkeletonBlock width="w-32" height="h-5" aria-label="Loading table title" />
            <SkeletonBlock width="w-16" height="h-5" rounded="rounded-full" aria-label="Loading item count" />
          </div>
          <div className="flex items-center space-x-3">
            <SkeletonBlock width="w-24" height="h-9" rounded="rounded-md" aria-label="Loading search field" />
            <SkeletonBlock width="w-20" height="h-9" rounded="rounded-md" aria-label="Loading filter button" />
            <SkeletonBlock width="w-24" height="h-9" rounded="rounded-md" aria-label="Loading create button" />
          </div>
        </div>
      </div>

      {/* Table Column Headers */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-12 gap-4 px-6 py-3">
          <div className="col-span-1">
            <SkeletonBlock width="w-4" height="h-4" aria-label="Loading checkbox header" />
          </div>
          <div className="col-span-3">
            <SkeletonBlock width="w-16" height="h-4" aria-label="Loading role name header" />
          </div>
          <div className="col-span-2">
            <SkeletonBlock width="w-12" height="h-4" aria-label="Loading type header" />
          </div>
          <div className="col-span-3">
            <SkeletonBlock width="w-20" height="h-4" aria-label="Loading description header" />
          </div>
          <div className="col-span-2">
            <SkeletonBlock width="w-16" height="h-4" aria-label="Loading status header" />
          </div>
          <div className="col-span-1">
            <SkeletonBlock width="w-12" height="h-4" aria-label="Loading actions header" />
          </div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: 8 }).map((_, index) => (
          <div 
            key={index} 
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <div className="col-span-1 flex items-center">
              <SkeletonBlock width="w-4" height="h-4" aria-label={`Loading row ${index + 1} checkbox`} />
            </div>
            <div className="col-span-3 flex items-center space-x-3">
              <SkeletonBlock width="w-8" height="h-8" rounded="rounded-full" aria-label={`Loading row ${index + 1} avatar`} />
              <div className="space-y-1">
                <SkeletonBlock width="w-24" height="h-4" aria-label={`Loading row ${index + 1} role name`} />
                <SkeletonBlock width="w-16" height="h-3" aria-label={`Loading row ${index + 1} role ID`} />
              </div>
            </div>
            <div className="col-span-2 flex items-center">
              <SkeletonBlock width="w-16" height="h-6" rounded="rounded-full" aria-label={`Loading row ${index + 1} type badge`} />
            </div>
            <div className="col-span-3 flex items-center">
              <div className="space-y-1">
                <SkeletonBlock width="w-32" height="h-4" aria-label={`Loading row ${index + 1} description line 1`} />
                <SkeletonBlock width="w-24" height="h-3" aria-label={`Loading row ${index + 1} description line 2`} />
              </div>
            </div>
            <div className="col-span-2 flex items-center">
              <SkeletonBlock width="w-20" height="h-6" rounded="rounded-full" aria-label={`Loading row ${index + 1} status badge`} />
            </div>
            <div className="col-span-1 flex items-center space-x-1">
              <SkeletonBlock width="w-6" height="h-6" rounded="rounded-md" aria-label={`Loading row ${index + 1} edit action`} />
              <SkeletonBlock width="w-6" height="h-6" rounded="rounded-md" aria-label={`Loading row ${index + 1} delete action`} />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SkeletonBlock width="w-16" height="h-4" aria-label="Loading pagination info" />
            <SkeletonBlock width="w-24" height="h-4" aria-label="Loading total count" />
          </div>
          <div className="flex items-center space-x-2">
            <SkeletonBlock width="w-8" height="h-8" rounded="rounded-md" aria-label="Loading previous page button" />
            <SkeletonBlock width="w-8" height="h-8" rounded="rounded-md" aria-label="Loading page 1" />
            <SkeletonBlock width="w-8" height="h-8" rounded="rounded-md" aria-label="Loading page 2" />
            <SkeletonBlock width="w-8" height="h-8" rounded="rounded-md" aria-label="Loading page 3" />
            <SkeletonBlock width="w-8" height="h-8" rounded="rounded-md" aria-label="Loading next page button" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile skeleton component for responsive design
 * Displays card-based layout for mobile viewports
 */
function MobileSkeleton() {
  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <SkeletonBlock width="w-32" height="h-6" aria-label="Loading mobile page title" />
          <SkeletonBlock width="w-20" height="h-4" aria-label="Loading mobile subtitle" />
        </div>
        <SkeletonBlock width="w-10" height="h-10" rounded="rounded-full" aria-label="Loading mobile menu button" />
      </div>

      {/* Search and Filter Bar */}
      <div className="space-y-3">
        <SkeletonBlock width="w-full" height="h-10" rounded="rounded-lg" aria-label="Loading mobile search field" />
        <div className="flex space-x-3">
          <SkeletonBlock width="w-20" height="h-8" rounded="rounded-full" aria-label="Loading mobile filter 1" />
          <SkeletonBlock width="w-24" height="h-8" rounded="rounded-full" aria-label="Loading mobile filter 2" />
          <SkeletonBlock width="w-16" height="h-8" rounded="rounded-full" aria-label="Loading mobile filter 3" />
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            role="status"
            aria-label={`Loading role card ${index + 1}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <SkeletonBlock width="w-10" height="h-10" rounded="rounded-full" aria-label={`Loading card ${index + 1} avatar`} />
                <div className="space-y-1">
                  <SkeletonBlock width="w-28" height="h-5" aria-label={`Loading card ${index + 1} title`} />
                  <SkeletonBlock width="w-20" height="h-4" aria-label={`Loading card ${index + 1} subtitle`} />
                </div>
              </div>
              <SkeletonBlock width="w-16" height="h-6" rounded="rounded-full" aria-label={`Loading card ${index + 1} status`} />
            </div>
            <SkeletonBlock width="w-full" height="h-4" aria-label={`Loading card ${index + 1} description`} />
            <div className="flex items-center justify-between">
              <SkeletonBlock width="w-20" height="h-6" rounded="rounded-full" aria-label={`Loading card ${index + 1} type`} />
              <div className="flex space-x-2">
                <SkeletonBlock width="w-8" height="h-8" rounded="rounded-md" aria-label={`Loading card ${index + 1} edit`} />
                <SkeletonBlock width="w-8" height="h-8" rounded="rounded-md" aria-label={`Loading card ${index + 1} delete`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Pagination */}
      <div className="flex items-center justify-center space-x-2 pt-4">
        <SkeletonBlock width="w-8" height="h-8" rounded="rounded-md" aria-label="Loading mobile previous button" />
        <SkeletonBlock width="w-8" height="h-8" rounded="rounded-md" aria-label="Loading mobile page indicator" />
        <SkeletonBlock width="w-8" height="h-8" rounded="rounded-md" aria-label="Loading mobile next button" />
      </div>
    </div>
  );
}

/**
 * Main loading component for roles management section
 * 
 * This component serves as the loading.tsx file for the Next.js app router,
 * automatically displayed while the page.tsx component is loading.
 * 
 * Features:
 * - WCAG 2.1 AA compliant with proper ARIA attributes
 * - Responsive design with different layouts for mobile and desktop
 * - Smooth Tailwind CSS animations with reduced motion support
 * - Screen reader friendly with descriptive labels
 * - Dark mode support with theme-aware styling
 * 
 * @returns {JSX.Element} Loading state component
 */
export default function RolesLoading(): JSX.Element {
  return (
    <div 
      className="animate-fade-in p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-gray-900"
      role="status"
      aria-label="Loading roles management page"
      aria-live="polite"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading roles management interface. Please wait while we fetch your role data.
      </div>

      {/* Page Header Loading */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <SkeletonBlock 
              width="w-48 sm:w-64" 
              height="h-8 sm:h-10" 
              aria-label="Loading page title"
            />
            <SkeletonBlock 
              width="w-64 sm:w-80" 
              height="h-4 sm:h-5" 
              aria-label="Loading page description"
            />
          </div>
          
          {/* Header Actions - Hidden on mobile */}
          <div className="hidden sm:flex items-center space-x-3">
            <LoadingSpinner 
              size="w-5 h-5" 
              aria-label="Loading roles data"
            />
            <SkeletonBlock 
              width="w-24" 
              height="h-10" 
              rounded="rounded-md"
              aria-label="Loading refresh button"
            />
            <SkeletonBlock 
              width="w-28" 
              height="h-10" 
              rounded="rounded-md"
              aria-label="Loading create role button"
            />
          </div>
        </div>

        {/* Breadcrumb Loading */}
        <div className="flex items-center space-x-2 text-sm">
          <SkeletonBlock width="w-16" height="h-4" aria-label="Loading breadcrumb home" />
          <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">/</span>
          <SkeletonBlock width="w-24" height="h-4" aria-label="Loading breadcrumb security" />
          <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">/</span>
          <SkeletonBlock width="w-16" height="h-4" aria-label="Loading breadcrumb roles" />
        </div>
      </div>

      {/* Responsive Content Loading */}
      {/* Desktop and Tablet View */}
      <div className="hidden sm:block">
        <TableSkeleton />
      </div>

      {/* Mobile View */}
      <div className="block sm:hidden">
        <MobileSkeleton />
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <SkeletonBlock 
          width="w-14" 
          height="h-14" 
          rounded="rounded-full"
          className="shadow-lg"
          aria-label="Loading floating action button"
        />
      </div>

      {/* Global Loading Overlay for Critical Operations */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-10 dark:bg-opacity-20 pointer-events-none z-40 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex items-center space-x-4 max-w-sm mx-4">
          <LoadingSpinner 
            size="w-8 h-8" 
            aria-label="Global loading indicator"
          />
          <div className="space-y-2">
            <SkeletonBlock width="w-32" height="h-4" aria-label="Loading status message" />
            <SkeletonBlock width="w-24" height="h-3" aria-label="Loading progress indicator" />
          </div>
        </div>
      </div>

      {/* Accessibility Enhancement - Reduced Motion Support */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse, .animate-spin, .animate-fade-in {
            animation: none;
          }
          .animate-pulse {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Export skeleton components for reuse in other loading states
 */
export { SkeletonBlock, LoadingSpinner, TableSkeleton, MobileSkeleton };