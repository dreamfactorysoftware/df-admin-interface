/**
 * Loading UI component for the scheduler management section
 * 
 * This component displays skeleton states and loading indicators while scheduler task data
 * is being fetched. It implements Tailwind CSS animations and responsive design patterns
 * to provide smooth user experience during scheduler data loading operations.
 * 
 * Features:
 * - Skeleton layouts that match the actual scheduler table structure
 * - WCAG 2.1 AA compliant loading animations and accessibility attributes
 * - Support for SSR and client-side navigation scenarios
 * - Progressive loading indicators for large dataset scenarios
 * - Responsive design across all supported viewport sizes
 * - Integration with React Query loading states
 * 
 * @component
 * @example
 * // Used automatically by Next.js App Router when loading.tsx is present
 * // in the same directory as page.tsx
 */

import React from 'react';

/**
 * Skeleton component for individual table cells
 * Provides consistent skeleton animation across different cell types
 */
const SkeletonCell: React.FC<{ 
  className?: string; 
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  'aria-label'?: string;
}> = ({ 
  className = '', 
  width = 'full',
  'aria-label': ariaLabel
}) => {
  const widthClasses = {
    xs: 'w-8',      // For icons/status indicators
    sm: 'w-12',     // For IDs
    md: 'w-24',     // For short text fields
    lg: 'w-32',     // For medium text fields
    xl: 'w-48',     // For long text fields like descriptions
    full: 'w-full'  // For flexible content
  };

  return (
    <div 
      className={`h-4 loading-skeleton ${widthClasses[width]} ${className}`}
      role="status"
      aria-label={ariaLabel || "Loading content"}
      aria-live="polite"
    />
  );
};

/**
 * Skeleton component for action buttons
 * Represents the circular action buttons in the actions column
 */
const SkeletonActionButton: React.FC = () => (
  <div 
    className="w-8 h-8 loading-skeleton rounded-full"
    role="status"
    aria-label="Loading action button"
  />
);

/**
 * Skeleton component for status icons
 * Represents active/inactive status indicators and log status icons
 */
const SkeletonStatusIcon: React.FC = () => (
  <div 
    className="w-5 h-5 loading-skeleton rounded-sm"
    role="status"
    aria-label="Loading status indicator"
  />
);

/**
 * Main loading component for the scheduler management page
 * 
 * This component creates a skeleton layout that matches the structure of the
 * actual scheduler table, including:
 * - Top action bar with create button and search field
 * - Table headers for all scheduler columns
 * - Multiple skeleton rows representing loading data
 * - Bottom pagination controls
 * 
 * The skeleton layout is responsive and maintains proper accessibility attributes
 * for screen readers and other assistive technologies.
 */
export default function SchedulerLoading(): React.JSX.Element {
  return (
    <div 
      className="w-full space-y-6 animate-fade-in"
      role="status"
      aria-label="Loading scheduler management page"
      aria-live="polite"
    >
      {/* Screen reader announcement for loading state */}
      <div className="sr-only" aria-live="assertive">
        Loading scheduler tasks. Please wait...
      </div>

      {/* Top Action Bar Skeleton */}
      <div 
        className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm theme-transition"
        role="region"
        aria-label="Loading action bar"
      >
        {/* Left side: Action buttons */}
        <div className="flex items-center space-x-3">
          {/* Create new scheduler task button skeleton */}
          <div 
            className="w-10 h-10 loading-skeleton rounded-full"
            role="status"
            aria-label="Loading create button"
          />
          
          {/* Refresh button skeleton */}
          <div 
            className="w-10 h-10 loading-skeleton rounded-full"
            role="status"
            aria-label="Loading refresh button"
          />
        </div>

        {/* Right side: Search field skeleton */}
        <div 
          className="w-64 h-10 loading-skeleton rounded-md"
          role="status"
          aria-label="Loading search field"
        />
      </div>

      {/* Table Container Skeleton */}
      <div 
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden theme-transition"
        role="region"
        aria-label="Loading scheduler table"
      >
        {/* Table Header Skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-800">
            {/* Active Status Column */}
            <div className="col-span-1 flex justify-center">
              <SkeletonCell width="xs" aria-label="Loading active status header" />
            </div>
            
            {/* ID Column */}
            <div className="col-span-1">
              <SkeletonCell width="sm" aria-label="Loading ID header" />
            </div>
            
            {/* Name Column */}
            <div className="col-span-2">
              <SkeletonCell width="md" aria-label="Loading name header" />
            </div>
            
            {/* Description Column */}
            <div className="col-span-3">
              <SkeletonCell width="lg" aria-label="Loading description header" />
            </div>
            
            {/* Service Column */}
            <div className="col-span-1">
              <SkeletonCell width="md" aria-label="Loading service header" />
            </div>
            
            {/* Component Column */}
            <div className="col-span-1">
              <SkeletonCell width="md" aria-label="Loading component header" />
            </div>
            
            {/* Method Column */}
            <div className="col-span-1">
              <SkeletonCell width="sm" aria-label="Loading method header" />
            </div>
            
            {/* Frequency Column */}
            <div className="col-span-1">
              <SkeletonCell width="md" aria-label="Loading frequency header" />
            </div>
            
            {/* Log Column */}
            <div className="col-span-1 flex justify-center">
              <SkeletonCell width="xs" aria-label="Loading log header" />
            </div>
          </div>
        </div>

        {/* Table Body Skeleton - Multiple rows to simulate loading data */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* Generate 8 skeleton rows for realistic loading appearance */}
          {Array.from({ length: 8 }, (_, index) => (
            <div 
              key={`skeleton-row-${index}`}
              className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
              role="row"
              aria-label={`Loading scheduler task ${index + 1}`}
            >
              {/* Active Status - Icon skeleton */}
              <div className="col-span-1 flex justify-center items-center">
                <SkeletonStatusIcon />
              </div>
              
              {/* ID - Short number */}
              <div className="col-span-1 flex items-center">
                <SkeletonCell width="sm" />
              </div>
              
              {/* Name - Medium text */}
              <div className="col-span-2 flex items-center">
                <SkeletonCell width="lg" />
              </div>
              
              {/* Description - Long text with varied widths for realism */}
              <div className="col-span-3 flex items-center">
                <SkeletonCell 
                  width={index % 3 === 0 ? 'full' : index % 2 === 0 ? 'xl' : 'lg'} 
                />
              </div>
              
              {/* Service - Medium text */}
              <div className="col-span-1 flex items-center">
                <SkeletonCell width="md" />
              </div>
              
              {/* Component - Medium text */}
              <div className="col-span-1 flex items-center">
                <SkeletonCell width="md" />
              </div>
              
              {/* Method - Short text (GET, POST, etc.) */}
              <div className="col-span-1 flex items-center">
                <SkeletonCell width="sm" />
              </div>
              
              {/* Frequency - Medium text */}
              <div className="col-span-1 flex items-center">
                <SkeletonCell width="md" />
              </div>
              
              {/* Log Status - Icon skeleton */}
              <div className="col-span-1 flex justify-center items-center">
                <SkeletonStatusIcon />
              </div>
            </div>
          ))}
        </div>

        {/* Actions Column - Positioned absolutely to overlay the right side */}
        <div className="absolute right-4 top-20 space-y-6">
          {Array.from({ length: 8 }, (_, index) => (
            <div 
              key={`action-skeleton-${index}`}
              className="flex items-center justify-end space-x-2 h-12"
            >
              <SkeletonActionButton />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Pagination Skeleton */}
      <div 
        className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm theme-transition"
        role="region"
        aria-label="Loading pagination controls"
      >
        {/* Pagination info text skeleton */}
        <div className="flex items-center space-x-2">
          <SkeletonCell width="md" />
          <span className="text-gray-500 dark:text-gray-400">of</span>
          <SkeletonCell width="sm" />
          <span className="text-gray-500 dark:text-gray-400">entries</span>
        </div>

        {/* Pagination controls skeleton */}
        <div className="flex items-center space-x-2">
          {/* First page button */}
          <div className="w-8 h-8 loading-skeleton rounded" />
          
          {/* Previous page button */}
          <div className="w-8 h-8 loading-skeleton rounded" />
          
          {/* Page numbers */}
          <div className="flex space-x-1">
            {Array.from({ length: 5 }, (_, index) => (
              <div 
                key={`page-skeleton-${index}`}
                className="w-8 h-8 loading-skeleton rounded"
              />
            ))}
          </div>
          
          {/* Next page button */}
          <div className="w-8 h-8 loading-skeleton rounded" />
          
          {/* Last page button */}
          <div className="w-8 h-8 loading-skeleton rounded" />
        </div>

        {/* Page size selector skeleton */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">Show</span>
          <div className="w-16 h-8 loading-skeleton rounded" />
          <span className="text-gray-500 dark:text-gray-400 text-sm">per page</span>
        </div>
      </div>

      {/* Loading Progress Indicator for Slow Networks */}
      <div 
        className="flex items-center justify-center space-x-3 p-4"
        role="status"
        aria-label="Loading progress indicator"
      >
        {/* Spinner for visual feedback */}
        <div className="w-6 h-6 loading-spinner" />
        
        {/* Loading text with animation */}
        <div className="text-sm text-gray-600 dark:text-gray-300 animate-pulse">
          Loading scheduler tasks...
        </div>

        {/* Progress dots animation */}
        <div className="flex space-x-1">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={`dot-${index}`}
              className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"
              style={{
                animationDelay: `${index * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Accessibility: Provide context for screen readers */}
      <div 
        className="sr-only" 
        aria-live="polite"
        role="status"
      >
        The scheduler management interface is loading. This page will show a table 
        of scheduled tasks with options to create, edit, and delete scheduler tasks. 
        Please wait while the data is being fetched.
      </div>
    </div>
  );
}

// Export type for TypeScript support
export type SchedulerLoadingProps = Record<string, never>;