/**
 * Loading component for the API connections route segment that displays animated 
 * skeleton elements while data is being fetched. Provides optimized loading states 
 * for service lists, connection status indicators, and dashboard metrics to maintain 
 * smooth user experience during data loading operations.
 * 
 * Features:
 * - WCAG 2.1 AA accessibility compliance with proper ARIA labels
 * - Responsive design for mobile, tablet, and desktop viewports
 * - Tailwind CSS-based skeleton animations with shimmer effects
 * - Optimized for API connections dashboard and service management
 * 
 * @returns React component rendering loading skeleton for API connections page
 */

import type { Metadata } from 'next';

// Loading skeleton animation styles
const skeletonAnimation = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]";

/**
 * API Connections Loading Component
 * 
 * Displays structured loading placeholders for:
 * - Page header with title and actions
 * - Service connection metrics cards
 * - Database services table
 * - Connection status indicators
 * 
 * Implements Next.js app router loading UI patterns per Section 7.5.1
 */
export default function APIConnectionsLoading() {
  return (
    <div 
      className="space-y-6" 
      data-testid="api-connections-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading API connections data"
    >
      {/* Screen reader announcement for loading state */}
      <div className="sr-only" aria-atomic="true">
        Loading API connections and database services. Please wait while we fetch your data.
      </div>

      {/* Page Header Loading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          {/* Page title skeleton */}
          <div 
            className={`h-8 w-48 sm:w-56 rounded ${skeletonAnimation}`}
            aria-label="Loading page title"
          />
          {/* Page description skeleton */}
          <div 
            className={`h-5 w-64 sm:w-80 rounded ${skeletonAnimation}`}
            aria-label="Loading page description"
          />
        </div>
        {/* Action button skeleton */}
        <div 
          className={`h-10 w-32 sm:w-40 rounded-md ${skeletonAnimation}`}
          aria-label="Loading action button"
        />
      </div>

      {/* Connection Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div 
            key={`metric-card-${index}`}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 space-y-3"
            aria-label={`Loading connection metric ${index + 1}`}
          >
            {/* Metric icon */}
            <div className={`h-8 w-8 rounded ${skeletonAnimation}`} />
            {/* Metric value */}
            <div className={`h-6 w-16 rounded ${skeletonAnimation}`} />
            {/* Metric label */}
            <div className={`h-4 w-20 rounded ${skeletonAnimation}`} />
          </div>
        ))}
      </div>

      {/* Services Table Loading */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Table title */}
            <div className={`h-6 w-32 sm:w-40 rounded ${skeletonAnimation}`} />
            
            {/* Filter and search controls */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {/* Search input */}
              <div className={`h-10 w-full sm:w-64 rounded-md ${skeletonAnimation}`} />
              {/* Filter dropdown */}
              <div className={`h-10 w-full sm:w-32 rounded-md ${skeletonAnimation}`} />
            </div>
          </div>
        </div>

        {/* Table content */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* Table header row for desktop */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-900">
            <div className={`col-span-3 h-4 rounded ${skeletonAnimation}`} />
            <div className={`col-span-2 h-4 rounded ${skeletonAnimation}`} />
            <div className={`col-span-2 h-4 rounded ${skeletonAnimation}`} />
            <div className={`col-span-2 h-4 rounded ${skeletonAnimation}`} />
            <div className={`col-span-2 h-4 rounded ${skeletonAnimation}`} />
            <div className={`col-span-1 h-4 rounded ${skeletonAnimation}`} />
          </div>

          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div 
              key={`service-row-${index}`}
              className="px-4 sm:px-6 py-4"
              aria-label={`Loading database service ${index + 1}`}
            >
              {/* Mobile layout */}
              <div className="sm:hidden space-y-3">
                {/* Service name and status */}
                <div className="flex items-center justify-between">
                  <div className={`h-5 w-32 rounded ${skeletonAnimation}`} />
                  <div className={`h-6 w-16 rounded-full ${skeletonAnimation}`} />
                </div>
                {/* Service details */}
                <div className="space-y-2">
                  <div className={`h-4 w-24 rounded ${skeletonAnimation}`} />
                  <div className={`h-4 w-28 rounded ${skeletonAnimation}`} />
                  <div className={`h-4 w-20 rounded ${skeletonAnimation}`} />
                </div>
                {/* Action buttons */}
                <div className="flex space-x-2">
                  <div className={`h-8 w-16 rounded ${skeletonAnimation}`} />
                  <div className={`h-8 w-16 rounded ${skeletonAnimation}`} />
                  <div className={`h-8 w-8 rounded ${skeletonAnimation}`} />
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-4 items-center">
                {/* Service name with icon */}
                <div className="col-span-3 flex items-center space-x-3">
                  <div className={`h-8 w-8 rounded ${skeletonAnimation}`} />
                  <div className={`h-5 w-24 rounded ${skeletonAnimation}`} />
                </div>
                {/* Database type */}
                <div className="col-span-2">
                  <div className={`h-4 w-16 rounded ${skeletonAnimation}`} />
                </div>
                {/* Status */}
                <div className="col-span-2">
                  <div className={`h-6 w-20 rounded-full ${skeletonAnimation}`} />
                </div>
                {/* Last tested */}
                <div className="col-span-2">
                  <div className={`h-4 w-18 rounded ${skeletonAnimation}`} />
                </div>
                {/* Endpoints */}
                <div className="col-span-2">
                  <div className={`h-4 w-12 rounded ${skeletonAnimation}`} />
                </div>
                {/* Actions */}
                <div className="col-span-1">
                  <div className={`h-8 w-8 rounded ${skeletonAnimation}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table pagination */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Results count */}
            <div className={`h-4 w-32 sm:w-40 rounded ${skeletonAnimation}`} />
            {/* Pagination controls */}
            <div className="flex items-center space-x-2">
              <div className={`h-8 w-8 rounded ${skeletonAnimation}`} />
              <div className={`h-8 w-8 rounded ${skeletonAnimation}`} />
              <div className={`h-8 w-8 rounded ${skeletonAnimation}`} />
              <div className={`h-8 w-8 rounded ${skeletonAnimation}`} />
              <div className={`h-8 w-8 rounded ${skeletonAnimation}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="space-y-4">
            {/* Section title */}
            <div className={`h-5 w-32 rounded ${skeletonAnimation}`} />
            
            {/* Activity items */}
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`activity-${index}`} className="flex items-start space-x-3">
                <div className={`h-8 w-8 rounded-full ${skeletonAnimation} flex-shrink-0 mt-1`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-3/4 rounded ${skeletonAnimation}`} />
                  <div className={`h-3 w-1/2 rounded ${skeletonAnimation}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connection Health */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="space-y-4">
            {/* Section title */}
            <div className={`h-5 w-36 rounded ${skeletonAnimation}`} />
            
            {/* Health indicators */}
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`health-${index}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-4 w-4 rounded-full ${skeletonAnimation}`} />
                  <div className={`h-4 w-24 rounded ${skeletonAnimation}`} />
                </div>
                <div className={`h-4 w-8 rounded ${skeletonAnimation}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading completion announcement for screen readers */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {/* This will be dynamically updated when loading completes */}
      </div>
    </div>
  );
}