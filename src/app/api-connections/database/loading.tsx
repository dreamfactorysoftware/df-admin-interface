/**
 * Loading component for the database services route segment
 * 
 * Displays animated skeleton elements while service data is being fetched.
 * Provides optimized loading states for service tables, connection status indicators,
 * and action buttons to maintain smooth user experience during data loading operations
 * with proper accessibility features.
 * 
 * @author DreamFactory Team
 * @since 2024-12-19
 */

import React from 'react';

/**
 * Database Services Loading Component
 * 
 * Implements Next.js app router loading UI patterns with Tailwind CSS-based
 * skeleton loading animations. Provides WCAG 2.1 AA accessibility compliance
 * with proper loading announcements and ARIA labels.
 */
export default function DatabaseServicesLoading() {
  return (
    <div 
      className="space-y-6 animate-fade-in" 
      data-testid="database-services-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading database services"
    >
      {/* Screen reader announcement */}
      <span className="sr-only">
        Loading database services. Please wait while we fetch your database connections and API services.
      </span>

      {/* Page Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {/* Page title skeleton */}
          <div 
            className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"
            aria-hidden="true"
          />
          {/* Page description skeleton */}
          <div 
            className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-80 animate-pulse"
            aria-hidden="true"
          />
        </div>
        {/* Create service button skeleton */}
        <div 
          className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-40 animate-pulse"
          aria-hidden="true"
        />
      </div>

      {/* Service Metrics Dashboard Skeleton */}
      <div 
        className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse border border-gray-200 dark:border-gray-700"
        aria-hidden="true"
      />

      {/* Filters and Search Bar Skeleton */}
      <div className="flex gap-4 items-center">
        {/* Search input skeleton */}
        <div 
          className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"
          aria-hidden="true"
        />
        {/* Filter button skeleton */}
        <div 
          className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
          aria-hidden="true"
        />
        {/* Sort dropdown skeleton */}
        <div 
          className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"
          aria-hidden="true"
        />
      </div>

      {/* Bulk Actions Bar Skeleton */}
      <div 
        className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
        aria-hidden="true"
      />

      {/* Services Table Skeleton */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse"
        aria-hidden="true"
      >
        {/* Table header skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-6 gap-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-18" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        </div>

        {/* Table rows skeleton */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="p-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                {/* Service name column */}
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  </div>
                </div>
                
                {/* Database type column */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                
                {/* Connection status column */}
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                </div>
                
                {/* API endpoints column */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                
                {/* Last updated column */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                
                {/* Actions column */}
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
        <div className="flex items-center space-x-2">
          {/* Pagination buttons skeleton */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div 
              key={index} 
              className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" 
            />
          ))}
        </div>
      </div>

      {/* Loading timeout accessibility feature */}
      <div className="sr-only" aria-live="assertive">
        {/* This will be announced if loading takes longer than expected */}
        If loading takes more than 10 seconds, please refresh the page or check your network connection.
      </div>
    </div>
  );
}

/**
 * Loading component display name for React DevTools
 */
DatabaseServicesLoading.displayName = 'DatabaseServicesLoading';