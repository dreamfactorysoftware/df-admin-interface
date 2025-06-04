/**
 * Loading component for the database services route segment
 * Displays animated skeleton elements while service data is being fetched
 * 
 * Provides optimized loading states for:
 * - Service tables and listings
 * - Connection status indicators
 * - Action buttons and controls
 * - Metrics and statistics
 * 
 * Features:
 * - WCAG 2.1 AA accessibility compliance
 * - Responsive design across all supported browsers
 * - Tailwind CSS-based animations
 * - Optimized for < 3 second loading targets
 */

'use client';

import { Database, Plus, Search, Filter } from 'lucide-react';

export default function DatabaseServicesLoading() {
  return (
    <div 
      className="space-y-6" 
      data-testid="database-services-loading"
      role="status" 
      aria-label="Loading database services"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        Loading database services, please wait...
      </div>

      {/* Page Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          {/* Page title skeleton */}
          <div 
            className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"
            aria-hidden="true"
          ></div>
          
          {/* Page description skeleton */}
          <div 
            className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-80 animate-pulse"
            aria-hidden="true"
          ></div>
        </div>
        
        {/* Create service button skeleton */}
        <div 
          className="h-10 bg-primary-200 dark:bg-primary-700 rounded-lg w-40 animate-pulse flex items-center justify-center"
          aria-hidden="true"
        >
          <Plus className="h-4 w-4 text-primary-400 dark:text-primary-500" />
        </div>
      </div>

      {/* Service Metrics Dashboard Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
            aria-hidden="true"
          >
            {/* Metric icon and value */}
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
            </div>
            
            {/* Metric label */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            
            {/* Metric trend indicator */}
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Filters and Search Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input skeleton */}
        <div className="flex-1 relative">
          <div 
            className="h-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse flex items-center px-3"
            aria-hidden="true"
          >
            <Search className="h-4 w-4 text-gray-400 mr-3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
          </div>
        </div>
        
        {/* Filter button skeleton */}
        <div 
          className="h-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-32 animate-pulse flex items-center justify-center"
          aria-hidden="true"
        >
          <Filter className="h-4 w-4 text-gray-400 mr-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
        </div>
        
        {/* Status filter skeleton */}
        <div 
          className="h-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg w-28 animate-pulse"
          aria-hidden="true"
        ></div>
      </div>

      {/* Bulk Actions Bar Skeleton */}
      <div 
        className="h-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse flex items-center px-4"
        aria-hidden="true"
      >
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        <div className="ml-auto flex space-x-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
        </div>
      </div>

      {/* Services Table Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table header */}
        <div 
          className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3"
          aria-hidden="true"
        >
          <div className="grid grid-cols-12 gap-4">
            {/* Checkbox column */}
            <div className="col-span-1">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            
            {/* Service name column */}
            <div className="col-span-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
            
            {/* Database type column */}
            <div className="col-span-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
            
            {/* Status column */}
            <div className="col-span-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
            </div>
            
            {/* Tables column */}
            <div className="col-span-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14 animate-pulse"></div>
            </div>
            
            {/* Actions column */}
            <div className="col-span-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Table rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={rowIndex} className="px-6 py-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Checkbox */}
                <div className="col-span-1">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                {/* Service name with icon */}
                <div className="col-span-3 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex items-center justify-center">
                    <Database className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
                
                {/* Database type */}
                <div className="col-span-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse"></div>
                </div>
                
                {/* Connection status */}
                <div className="col-span-2 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                </div>
                
                {/* Tables count */}
                <div className="col-span-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
                </div>
                
                {/* Actions */}
                <div className="col-span-2 flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table footer with pagination */}
        <div 
          className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between">
            {/* Results info */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            
            {/* Pagination controls */}
            <div className="flex items-center space-x-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="flex space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  ></div>
                ))}
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Database services are loading. This may take a few moments.
      </div>
    </div>
  );
}