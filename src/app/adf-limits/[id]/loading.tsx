/**
 * Next.js Loading UI Component for Edit Limits Dynamic Route
 * 
 * Provides skeleton loading states while the page component and limit data are being fetched.
 * Implements consistent loading patterns with Tailwind CSS animations and accessibility features
 * for screen readers during SSR hydration and data loading operations.
 * 
 * Features:
 * - Next.js 15.1+ app router loading UI patterns for suspense boundaries
 * - Tailwind CSS 4.1+ with consistent theme injection and animation utilities
 * - WCAG 2.1 AA compliance for loading states and screen reader accessibility
 * - Responsive design that works across all supported screen sizes
 * - Visual consistency matching the limit-form component layout
 */

import React from 'react';

/**
 * Skeleton component for animated loading placeholders
 * Provides accessible loading animations with proper ARIA attributes
 */
const Skeleton: React.FC<{ 
  className?: string; 
  'aria-label'?: string;
}> = ({ className = '', 'aria-label': ariaLabel = 'Loading content' }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    role="status"
    aria-label={ariaLabel}
    aria-live="polite"
  />
);

/**
 * Card component wrapper for consistent layout structure
 * Matches the design system patterns used throughout the application
 */
const Card: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
    {children}
  </div>
);

/**
 * Loading component for the edit limits dynamic route
 * 
 * Provides skeleton loading states that match the structure of the limit-form component
 * with proper accessibility features and responsive design.
 * 
 * @returns JSX element representing the loading state
 */
export default function Loading(): JSX.Element {
  return (
    <div 
      className="container mx-auto px-4 py-6 space-y-6"
      role="main"
      aria-label="Loading limit details"
    >
      {/* Screen reader announcement for loading state */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        Loading limit configuration details, please wait...
      </div>

      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <Skeleton 
          className="h-8 w-48 sm:w-64" 
          aria-label="Loading page title"
        />
        <Skeleton 
          className="h-4 w-full max-w-md" 
          aria-label="Loading page description"
        />
      </div>

      {/* Main Content Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Form Header */}
          <div className="space-y-3">
            <Skeleton 
              className="h-6 w-32" 
              aria-label="Loading form section title"
            />
            <div className="border-b border-gray-200 dark:border-gray-600">
              <Skeleton className="h-px w-full" />
            </div>
          </div>

          {/* Form Fields Grid - Responsive Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Limit Name Field */}
              <div className="space-y-2">
                <Skeleton 
                  className="h-4 w-20" 
                  aria-label="Loading field label"
                />
                <Skeleton 
                  className="h-10 w-full" 
                  aria-label="Loading text input field"
                />
              </div>

              {/* Limit Type Field */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton 
                  className="h-10 w-full" 
                  aria-label="Loading dropdown field"
                />
              </div>

              {/* Rate Limit Value Field */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton 
                  className="h-10 w-full" 
                  aria-label="Loading number input field"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Time Period Field */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton 
                  className="h-10 w-full" 
                  aria-label="Loading select field"
                />
              </div>

              {/* Service Field */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton 
                  className="h-10 w-full" 
                  aria-label="Loading service selector"
                />
              </div>

              {/* Status Toggle */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <div className="flex items-center space-x-3">
                  <Skeleton 
                    className="h-6 w-11 rounded-full" 
                    aria-label="Loading toggle switch"
                  />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Options Section */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-36" />
            
            {/* Collapsible Section Content */}
            <div className="pl-4 space-y-4 border-l-2 border-gray-100 dark:border-gray-600">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <Skeleton 
              className="h-10 w-full sm:w-20" 
              aria-label="Loading cancel button"
            />
            <Skeleton 
              className="h-10 w-full sm:w-32" 
              aria-label="Loading save button"
            />
          </div>
        </div>
      </Card>

      {/* Additional Information Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}