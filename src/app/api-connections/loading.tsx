/**
 * Loading component for the API connections route segment
 * 
 * Displays animated skeleton elements while data is being fetched.
 * Provides optimized loading states for service lists, connection status 
 * indicators, and dashboard metrics to maintain smooth user experience 
 * during data loading operations.
 * 
 * Features:
 * - Tailwind CSS-based skeleton loading animations
 * - WCAG 2.1 AA accessibility compliance with ARIA labels
 * - Responsive design across all supported browsers
 * - Optimized for React 19 and Next.js 15.1+ app router
 */

import React from 'react';

/**
 * Next.js loading component for the API connections route segment
 * 
 * This component is automatically rendered by Next.js App Router when
 * the page component is loading. It provides immediate visual feedback
 * while maintaining accessibility standards.
 * 
 * @returns Loading skeleton UI for API connections page
 */
export default function APIConnectionsLoading(): React.ReactElement {
  return (
    <div 
      className="space-y-6 animate-pulse" 
      data-testid="api-connections-loading"
      role="status"
      aria-label="Loading API connections dashboard"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading API connections dashboard. Please wait while we fetch your database services and connection status.
      </div>

      {/* Page Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-3">
          {/* Page title skeleton */}
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-48 sm:w-64"></div>
          {/* Page description skeleton */}
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-80 sm:w-96"></div>
        </div>
        {/* Action button skeleton */}
        <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded-md w-36 sm:w-40"></div>
      </div>

      {/* Connection Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div 
            key={`status-card-${index}`}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-3"
            aria-label={`Loading connection status card ${index + 1} of 4`}
          >
            {/* Card icon */}
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            {/* Card title */}
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-24"></div>
            {/* Card value */}
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-16"></div>
            {/* Card trend indicator */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-20"></div>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="space-y-4">
          {/* Section title */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-32"></div>
          
          {/* Quick action buttons grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div 
                key={`quick-action-${index}`}
                className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                aria-label={`Loading quick action ${index + 1} of 6`}
              >
                {/* Action icon */}
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0"></div>
                {/* Action label */}
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Table header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Table title */}
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-40"></div>
            
            {/* Table controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-md w-full sm:w-64"></div>
              {/* Filter button */}
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-24"></div>
            </div>
          </div>
        </div>

        {/* Table content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Table header row */}
          <div className="hidden sm:grid sm:grid-cols-5 gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            {Array.from({ length: 5 }).map((_, index) => (
              <div 
                key={`table-header-${index}`}
                className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md"
                aria-label={`Loading table header column ${index + 1} of 5`}
              ></div>
            ))}
          </div>

          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <div 
              key={`table-row-${rowIndex}`}
              className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-5 sm:gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              aria-label={`Loading service row ${rowIndex + 1} of 6`}
            >
              {/* Service name/icon */}
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0"></div>
                <div className="space-y-1 flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-24 sm:w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-16 sm:w-20 sm:hidden"></div>
                </div>
              </div>

              {/* Service type */}
              <div className="flex sm:block items-center justify-between sm:justify-start">
                <span className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">Type:</span>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-20"></div>
              </div>

              {/* Connection status */}
              <div className="flex sm:block items-center justify-between sm:justify-start">
                <span className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">Status:</span>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
              </div>

              {/* Last connected */}
              <div className="flex sm:block items-center justify-between sm:justify-start">
                <span className="text-sm text-gray-500 dark:text-gray-400 sm:hidden">Last Connected:</span>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-20"></div>
              </div>

              {/* Actions */}
              <div className="flex sm:justify-end items-center gap-2">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Table pagination */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Results info */}
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-32"></div>
            
            {/* Pagination controls */}
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="px-2 text-gray-400">...</div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="space-y-4">
          {/* Section title */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-36"></div>
          
          {/* Activity items */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div 
                key={`activity-${index}`}
                className="flex items-start space-x-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50"
                aria-label={`Loading recent activity ${index + 1} of 4`}
              >
                {/* Activity icon */}
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0 mt-0.5"></div>
                
                <div className="flex-1 space-y-2">
                  {/* Activity description */}
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-full"></div>
                  {/* Activity timestamp */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completion announcement for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading complete. API connections dashboard is now ready.
      </div>
    </div>
  );
}