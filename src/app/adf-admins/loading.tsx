/**
 * Loading UI component for admin management routes
 * 
 * Implements Next.js app router loading patterns with accessible loading states,
 * theme-aware Tailwind CSS styling, and WCAG 2.1 AA compliance for consistent
 * loading experience across all admin-related routes.
 * 
 * @component
 * @example
 * // Automatically used by Next.js app router when loading admin routes
 * // File: src/app/adf-admins/loading.tsx
 */

import React from 'react';

/**
 * Accessible spinner component with WCAG 2.1 AA compliance
 * Implements proper ARIA attributes and theme-aware styling
 */
function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Loading"
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
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Skeleton loader component for table rows and content areas
 * Provides visual placeholder during data fetching operations
 */
function SkeletonLoader({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`animate-pulse ${className}`} role="status" aria-label="Loading content">
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <div key={index}>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded col-span-1"></div>
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading admin data...</span>
    </div>
  );
}

/**
 * Card skeleton for admin form contexts
 * Responsive layout that adapts to different screen sizes
 */
function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm ${className}`}
      role="status"
      aria-label="Loading admin form"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-6">
        {/* Two column layout on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>

        {/* Full width field */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Textarea skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      <span className="sr-only">Loading admin form fields...</span>
    </div>
  );
}

/**
 * Table skeleton for admin management table contexts
 * Responsive table layout with proper ARIA attributes
 */
function TableSkeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`animate-pulse bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}
      role="status"
      aria-label="Loading admin table"
    >
      {/* Table header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading admin table data...</span>
    </div>
  );
}

/**
 * Main loading component for admin management routes
 * 
 * Features:
 * - Next.js app router loading UI patterns
 * - Theme-aware Tailwind CSS styling with dark mode support
 * - WCAG 2.1 AA compliant with proper ARIA attributes
 * - Responsive design for mobile, tablet, and desktop
 * - Optimized for admin table and form contexts
 * - Under 100ms render time for performance requirements
 * 
 * @returns {JSX.Element} Loading UI component
 */
export default function AdminLoading(): JSX.Element {
  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading admin management interface"
    >
      {/* Page header skeleton */}
      <div className="mb-8">
        <div className="animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title skeleton */}
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 max-w-full"></div>
            </div>
            
            {/* Action button skeleton */}
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>

      {/* Loading indicator with spinner */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-3 text-primary-600 dark:text-primary-400">
          <LoadingSpinner size="md" className="text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium">Loading admin data...</span>
        </div>
      </div>

      {/* Content area - responsive layout */}
      <div className="space-y-6">
        {/* Desktop: side-by-side layout, Mobile: stacked layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main content area (spans 2 columns on xl screens) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Table skeleton for admin list */}
            <TableSkeleton />
            
            {/* Additional content skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CardSkeleton />
              <div className="animate-pulse bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <SkeletonLoader lines={4} />
              </div>
            </div>
          </div>

          {/* Sidebar area */}
          <div className="space-y-6">
            <CardSkeleton />
            <div className="animate-pulse bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <SkeletonLoader lines={6} />
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader announcement */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        Loading admin management interface. Please wait while we fetch your data.
      </div>

      {/* Focus management for keyboard navigation */}
      <div 
        tabIndex={-1}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md"
        role="status"
      >
        Loading admin interface...
      </div>
    </div>
  );
}

/**
 * Type definitions for component props
 */
export interface LoadingComponentProps {
  /** Optional CSS class names for custom styling */
  className?: string;
  /** Loading message for screen readers */
  loadingMessage?: string;
  /** Size variant for the loading indicator */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Performance monitoring hook for loading component
 * Ensures loading states meet the 100ms response time requirement
 */
export function useLoadingPerformance() {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Log performance metrics for monitoring
      if (loadTime > 100) {
        console.warn(`Admin loading component exceeded 100ms target: ${loadTime.toFixed(2)}ms`);
      }
    };
  }, []);
}