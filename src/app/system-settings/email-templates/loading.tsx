import React from 'react';

/**
 * Loading UI component for email templates section that displays skeleton states 
 * and loading indicators while email template data is being fetched.
 * 
 * Implements Tailwind CSS animations and responsive design patterns following 
 * Next.js app router loading.tsx convention. Provides skeleton states that match 
 * the email template table layout with proper accessibility support.
 * 
 * Features:
 * - Skeleton states for top action bar (create/refresh buttons, search input)
 * - Skeleton states for table header and rows matching email template structure
 * - WCAG 2.1 AA compliant animations with reduced motion support
 * - SSR-compatible loading states
 * - Responsive design for different screen sizes
 * - Accessible loading announcements for screen readers
 */
export default function EmailTemplatesLoading() {
  return (
    <div 
      className="email-templates-loading w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
      role="status"
      aria-label="Loading email templates"
      aria-live="polite"
    >
      {/* Screen reader announcement */}
      <div className="sr-only">
        Loading email templates, please wait...
      </div>

      {/* Top Action Bar Skeleton */}
      <div className="top-action-bar-skeleton mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Action buttons skeleton */}
        <div className="flex items-center gap-3">
          {/* Create button skeleton */}
          <div 
            className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
            aria-hidden="true"
          />
          
          {/* Refresh button skeleton */}
          <div 
            className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
            aria-hidden="true"
          />
          
          {/* Additional action buttons placeholder */}
          <div 
            className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
            aria-hidden="true"
          />
        </div>

        {/* Search input skeleton */}
        <div className="w-full sm:w-80">
          <div 
            className="h-14 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse border border-gray-300 dark:border-gray-600"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Table Container Skeleton */}
      <div className="table-container bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {/* Table Header Skeleton */}
        <div className="table-header border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-12 gap-4 p-4">
            {/* Name column header */}
            <div className="col-span-4">
              <div 
                className="h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
                aria-hidden="true"
              />
            </div>
            
            {/* Description column header */}
            <div className="col-span-6">
              <div 
                className="h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
                aria-hidden="true"
              />
            </div>
            
            {/* Actions column header */}
            <div className="col-span-2">
              <div 
                className="h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="table-body">
          {/* Generate 8 skeleton rows for typical loading state */}
          {Array.from({ length: 8 }, (_, index) => (
            <div 
              key={`skeleton-row-${index}`}
              className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-900/50'
              }`}
              aria-hidden="true"
            >
              {/* Name cell skeleton */}
              <div className="col-span-4 flex items-center">
                <div className="space-y-2 w-full">
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    style={{ 
                      width: `${Math.floor(Math.random() * 40) + 60}%`,
                      animationDelay: `${index * 100}ms` 
                    }}
                  />
                </div>
              </div>

              {/* Description cell skeleton */}
              <div className="col-span-6 flex items-center">
                <div className="space-y-2 w-full">
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    style={{ 
                      width: `${Math.floor(Math.random() * 50) + 50}%`,
                      animationDelay: `${index * 150}ms` 
                    }}
                  />
                  {/* Longer descriptions for some rows */}
                  {index % 3 === 0 && (
                    <div 
                      className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
                      style={{ 
                        width: `${Math.floor(Math.random() * 30) + 30}%`,
                        animationDelay: `${index * 200}ms` 
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Actions cell skeleton */}
              <div className="col-span-2 flex items-center justify-end">
                <div className="flex items-center gap-2">
                  {/* Edit button skeleton */}
                  <div 
                    className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    style={{ animationDelay: `${index * 50}ms` }}
                  />
                  
                  {/* Delete button skeleton */}
                  <div 
                    className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    style={{ animationDelay: `${index * 75}ms` }}
                  />
                  
                  {/* More actions menu skeleton */}
                  <div 
                    className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
                    style={{ animationDelay: `${index * 25}ms` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Footer/Pagination Skeleton */}
        <div className="table-footer border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Rows per page selector skeleton */}
            <div className="flex items-center gap-2">
              <div 
                className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
                aria-hidden="true"
              />
              <div 
                className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                aria-hidden="true"
              />
            </div>

            {/* Page info skeleton */}
            <div className="flex items-center gap-4">
              <div 
                className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"
                aria-hidden="true"
              />
              
              {/* Pagination controls skeleton */}
              <div className="flex items-center gap-1">
                <div 
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  aria-hidden="true"
                />
                <div 
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator for slow network conditions */}
      <div className="loading-indicator mt-6 flex items-center justify-center">
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          {/* Spinning indicator */}
          <div 
            className="w-5 h-5 border-2 border-blue-200 dark:border-blue-700 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"
            aria-hidden="true"
          />
          
          {/* Loading text */}
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            Loading email templates...
          </span>
        </div>
      </div>

      {/* Accessibility styles for reduced motion */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .email-templates-loading .animate-pulse,
          .email-templates-loading .animate-spin {
            animation: none !important;
          }
          
          .email-templates-loading .animate-pulse {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}