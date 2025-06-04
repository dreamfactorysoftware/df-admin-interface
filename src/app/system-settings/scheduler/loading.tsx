/**
 * Loading UI component for the scheduler management section.
 * 
 * This component displays skeleton states and loading indicators while scheduler 
 * task data is being fetched. Implements Tailwind CSS animations and responsive 
 * design patterns to provide smooth user experience during data loading operations.
 * 
 * Features:
 * - Skeleton layout matching actual scheduler table structure
 * - WCAG 2.1 AA compliant loading animations
 * - SSR and client-side navigation support
 * - Progressive loading indicators for large datasets
 * - Responsive design across all supported browsers
 * - React Query loading state integration
 */

import React from 'react';

/**
 * Skeleton component for individual table cells with animation
 */
const SkeletonCell = ({ 
  width = 'w-full', 
  height = 'h-4',
  rounded = 'rounded',
  className = '' 
}: {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}) => (
  <div 
    className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${width} ${height} ${rounded} ${className}`}
    role="presentation"
    aria-hidden="true"
  />
);

/**
 * Skeleton component for action buttons
 */
const SkeletonButton = ({ size = 'w-8 h-8' }: { size?: string }) => (
  <div 
    className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${size} rounded-full`}
    role="presentation"
    aria-hidden="true"
  />
);

/**
 * Skeleton component for the top action bar
 */
const SkeletonActionBar = () => (
  <div 
    className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
    role="presentation"
    aria-label="Loading scheduler management actions"
  >
    {/* Left side - Action buttons */}
    <div className="flex items-center space-x-3">
      <SkeletonButton size="w-10 h-10" />
      <SkeletonButton size="w-10 h-10" />
    </div>
    
    {/* Right side - Search input */}
    <div className="flex items-center">
      <div className="w-64 md:w-80">
        <SkeletonCell width="w-full" height="h-10" rounded="rounded-md" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton component for table header
 */
const SkeletonTableHeader = () => (
  <thead className="bg-gray-50 dark:bg-gray-800">
    <tr>
      {/* Column headers matching scheduler table structure */}
      <th className="px-6 py-3 text-left">
        <SkeletonCell width="w-16" height="h-4" />
      </th>
      <th className="px-6 py-3 text-left">
        <SkeletonCell width="w-8" height="h-4" />
      </th>
      <th className="px-6 py-3 text-left">
        <SkeletonCell width="w-20" height="h-4" />
      </th>
      <th className="px-6 py-3 text-left hidden md:table-cell">
        <SkeletonCell width="w-24" height="h-4" />
      </th>
      <th className="px-6 py-3 text-left hidden lg:table-cell">
        <SkeletonCell width="w-20" height="h-4" />
      </th>
      <th className="px-6 py-3 text-left hidden lg:table-cell">
        <SkeletonCell width="w-24" height="h-4" />
      </th>
      <th className="px-6 py-3 text-left hidden xl:table-cell">
        <SkeletonCell width="w-20" height="h-4" />
      </th>
      <th className="px-6 py-3 text-left hidden xl:table-cell">
        <SkeletonCell width="w-24" height="h-4" />
      </th>
      <th className="px-6 py-3 text-left hidden xl:table-cell">
        <SkeletonCell width="w-12" height="h-4" />
      </th>
      <th className="px-6 py-3 text-right">
        <SkeletonCell width="w-16" height="h-4" className="ml-auto" />
      </th>
    </tr>
  </thead>
);

/**
 * Skeleton component for individual table row
 */
const SkeletonTableRow = ({ index }: { index: number }) => (
  <tr 
    className={`border-b border-gray-200 dark:border-gray-700 ${
      index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
    }`}
  >
    {/* Active status - boolean indicator */}
    <td className="px-6 py-4">
      <SkeletonCell width="w-4" height="h-4" rounded="rounded-full" />
    </td>
    
    {/* ID */}
    <td className="px-6 py-4">
      <SkeletonCell width="w-8" height="h-4" />
    </td>
    
    {/* Name */}
    <td className="px-6 py-4">
      <SkeletonCell width="w-24 sm:w-32" height="h-4" />
    </td>
    
    {/* Description - hidden on mobile */}
    <td className="px-6 py-4 hidden md:table-cell">
      <SkeletonCell width="w-32 lg:w-48" height="h-4" />
    </td>
    
    {/* Service - hidden on smaller screens */}
    <td className="px-6 py-4 hidden lg:table-cell">
      <SkeletonCell width="w-20" height="h-4" />
    </td>
    
    {/* Component - hidden on smaller screens */}
    <td className="px-6 py-4 hidden lg:table-cell">
      <SkeletonCell width="w-24" height="h-4" />
    </td>
    
    {/* Method - hidden on smaller screens */}
    <td className="px-6 py-4 hidden xl:table-cell">
      <SkeletonCell width="w-16" height="h-4" />
    </td>
    
    {/* Frequency - hidden on smaller screens */}
    <td className="px-6 py-4 hidden xl:table-cell">
      <SkeletonCell width="w-20" height="h-4" />
    </td>
    
    {/* Log - hidden on smaller screens */}
    <td className="px-6 py-4 hidden xl:table-cell">
      <SkeletonCell width="w-4" height="h-4" rounded="rounded-full" />
    </td>
    
    {/* Actions */}
    <td className="px-6 py-4">
      <div className="flex items-center justify-end space-x-2">
        <SkeletonButton size="w-6 h-6" />
        <SkeletonButton size="w-6 h-6" />
      </div>
    </td>
  </tr>
);

/**
 * Skeleton component for pagination
 */
const SkeletonPagination = () => (
  <div 
    className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
    role="presentation"
    aria-label="Loading pagination controls"
  >
    {/* Results info */}
    <div className="flex items-center">
      <SkeletonCell width="w-32 sm:w-48" height="h-4" />
    </div>
    
    {/* Page size selector and navigation */}
    <div className="flex items-center space-x-4">
      {/* Page size selector - hidden on mobile */}
      <div className="hidden sm:flex items-center space-x-2">
        <SkeletonCell width="w-16" height="h-4" />
        <SkeletonCell width="w-16" height="h-8" rounded="rounded-md" />
      </div>
      
      {/* Navigation buttons */}
      <div className="flex items-center space-x-1">
        <SkeletonButton size="w-8 h-8" />
        <SkeletonButton size="w-8 h-8" />
        <SkeletonButton size="w-8 h-8" />
        <SkeletonButton size="w-8 h-8" />
      </div>
    </div>
  </div>
);

/**
 * Main loading component for the scheduler management page
 */
export default function SchedulerLoading() {
  // Generate array of row indices for skeleton rows
  // Using 8 rows to simulate a typical page size while loading
  const skeletonRows = Array.from({ length: 8 }, (_, index) => index);

  return (
    <div 
      className="h-full bg-white dark:bg-gray-900"
      role="status"
      aria-live="polite"
      aria-label="Loading scheduler management interface"
    >
      {/* Screen reader announcement */}
      <div className="sr-only">
        Loading scheduler task data, please wait...
      </div>
      
      {/* Main content container */}
      <div className="flex flex-col h-full">
        {/* Action bar */}
        <SkeletonActionBar />
        
        {/* Table container with responsive overflow */}
        <div className="flex-1 overflow-hidden">
          <div className="overflow-x-auto h-full">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <SkeletonTableHeader />
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {skeletonRows.map((index) => (
                  <SkeletonTableRow key={index} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        <SkeletonPagination />
      </div>
      
      {/* Progressive loading indicator for slow networks */}
      <div className="fixed bottom-4 right-4 z-50">
        <div 
          className="bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-pulse"
          role="status"
          aria-label="Loading in progress"
        >
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium hidden sm:inline">
            Loading scheduler tasks...
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Type definitions for skeleton component props
 * These ensure type safety while maintaining flexibility
 */
export interface SkeletonProps {
  /** Custom width class */
  width?: string;
  /** Custom height class */
  height?: string;
  /** Border radius class */
  rounded?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Performance considerations:
 * - Uses CSS animations (animate-pulse) for better performance than JavaScript animations
 * - Leverages Tailwind's optimized CSS for minimal bundle impact
 * - Responsive design prevents layout shifts during loading
 * - Proper semantic structure maintains accessibility during loading states
 * 
 * Accessibility features:
 * - ARIA live regions announce loading state changes
 * - Screen reader friendly loading messages
 * - Proper role attributes for skeleton elements
 * - Focus management considerations for when real content loads
 * 
 * Integration notes:
 * - Compatible with React Query loading states
 * - Supports both SSR and client-side navigation
 * - Maintains consistent styling with the actual scheduler table
 * - Progressive enhancement for slow network conditions
 */