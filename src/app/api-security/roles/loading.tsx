/**
 * Loading component for the roles management section
 * 
 * Displays skeleton states and loading indicators while role data is being fetched.
 * Provides smooth user experience during data loading operations with accessible
 * skeleton UI patterns following WCAG 2.1 AA compliance standards.
 * 
 * Features:
 * - Next.js app router loading component conventions
 * - Tailwind CSS skeleton patterns replacing Angular Material progress indicators
 * - Accessibility attributes for screen readers
 * - Responsive design for desktop and mobile viewports
 * - Smooth loading transitions with DreamFactory brand styling
 */

import React from 'react';

/**
 * Skeleton component for individual table rows
 */
const SkeletonTableRow: React.FC = () => (
  <tr className="animate-pulse">
    {/* Role name column */}
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 sm:w-32"></div>
      </div>
    </td>
    
    {/* Description column - hidden on mobile */}
    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 lg:w-64"></div>
    </td>
    
    {/* Service access column - hidden on mobile */}
    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
      <div className="flex space-x-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
      </div>
    </td>
    
    {/* Users count column */}
    <td className="px-6 py-4 whitespace-nowrap text-center">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
    </td>
    
    {/* Actions column */}
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <div className="flex justify-end space-x-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
    </td>
  </tr>
);

/**
 * Skeleton component for table header
 */
const SkeletonTableHeader: React.FC = () => (
  <thead className="bg-gray-50 dark:bg-gray-800">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
      </th>
      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12 mx-auto animate-pulse"></div>
      </th>
      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 ml-auto animate-pulse"></div>
      </th>
    </tr>
  </thead>
);

/**
 * Skeleton component for page header with search and actions
 */
const SkeletonPageHeader: React.FC = () => (
  <div className="mb-6 space-y-4 animate-fade-in">
    {/* Page title and description */}
    <div className="space-y-2">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 sm:w-48 animate-pulse"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 sm:w-96 animate-pulse"></div>
    </div>
    
    {/* Search and actions bar */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Search bar */}
      <div className="flex-1 max-w-md">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
      </div>
      
      {/* Action buttons */}
      <div className="flex space-x-3">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-24 animate-pulse"></div>
        <div className="h-10 bg-primary-200 dark:bg-primary-800 rounded-md w-28 animate-pulse"></div>
      </div>
    </div>
  </div>
);

/**
 * Loading component for breadcrumbs
 */
const SkeletonBreadcrumbs: React.FC = () => (
  <nav 
    className="mb-4 animate-fade-in" 
    aria-label="Loading breadcrumb navigation"
  >
    <div className="flex items-center space-x-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
    </div>
  </nav>
);

/**
 * Loading spinner component for use in various contexts
 */
const LoadingSpinner: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={`${sizeClasses[size]} animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <svg 
        className="w-full h-full text-primary-500"
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
};

/**
 * Main loading component for the roles management page
 * 
 * This component serves as the loading state for Next.js app router,
 * automatically displayed while the page is loading. It provides a
 * comprehensive skeleton layout matching the expected roles page structure.
 */
export default function RolesLoading(): JSX.Element {
  return (
    <div 
      className="min-h-screen bg-white dark:bg-gray-900 p-4 sm:p-6 lg:p-8"
      role="status"
      aria-live="polite"
      aria-label="Loading roles management page"
    >
      {/* Screen reader announcement */}
      <div className="sr-only">
        Loading roles and permissions management interface. Please wait while we fetch your data.
      </div>

      {/* Breadcrumbs skeleton */}
      <SkeletonBreadcrumbs />

      {/* Page header skeleton */}
      <SkeletonPageHeader />

      {/* Main content area */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
        {/* Table container */}
        <div className="overflow-hidden">
          {/* Stats or summary cards - mobile responsive */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-6 bg-primary-100 dark:bg-primary-900 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Table skeleton */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <SkeletonTableHeader />
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Generate multiple skeleton rows */}
                {Array.from({ length: 8 }, (_, index) => (
                  <SkeletonTableRow key={index} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination skeleton */}
          <div className="bg-white dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Results info */}
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
              </div>
              
              {/* Pagination controls */}
              <div className="flex items-center space-x-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((page) => (
                    <div 
                      key={page}
                      className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    />
                  ))}
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator with spinner */}
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Loading roles...
          </span>
        </div>
      </div>
    </div>
  );
}