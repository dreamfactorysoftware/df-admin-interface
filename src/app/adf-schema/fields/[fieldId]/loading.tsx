/**
 * Next.js Loading Component for Field Editing Interface
 * 
 * Provides accessible skeleton UI during field data fetching operations with:
 * - WCAG 2.1 AA compliant loading announcements and ARIA labels
 * - Responsive design patterns across all supported breakpoints
 * - Tailwind CSS animation utilities for smooth loading states
 * - Form skeleton structure matching field editing interface layout
 * - Optimized rendering performance during field metadata loading
 * 
 * This loading component replaces Angular Material loading indicators
 * with modern React/Next.js patterns and enhanced accessibility features.
 */

import React from 'react';

/**
 * Loading skeleton component for field editing interface
 * 
 * Implements skeleton UI that mirrors the field form structure:
 * - Field basic information section
 * - Field constraints and validation section  
 * - Function usage configuration section
 * - Action buttons section
 * 
 * @returns {JSX.Element} Accessible loading skeleton with form structure
 */
export default function FieldEditingLoading(): JSX.Element {
  return (
    <div 
      className="space-y-8 animate-pulse" 
      data-testid="field-editing-loading"
      role="status"
      aria-label="Loading field configuration form"
      aria-live="polite"
    >
      {/* Screen reader announcement for loading state */}
      <div className="sr-only" aria-atomic="true">
        Loading field configuration data. Please wait while we fetch the field metadata and validation rules.
      </div>

      {/* Page Header Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            {/* Page title skeleton */}
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 sm:w-80" />
            {/* Breadcrumb skeleton */}
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96 max-w-full" />
          </div>
          {/* Action buttons skeleton */}
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-24" />
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 space-y-8">
          
          {/* Field Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40" />
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            
            {/* Field name and type row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
              </div>
            </div>

            {/* Field properties grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Length/Precision */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
              </div>
              {/* Scale */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
              </div>
              {/* Default Value */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
              </div>
            </div>

            {/* Field options toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="h-5 w-9 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Field Constraints Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>

            {/* Validation rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Min/Max Values */}
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
                  </div>
                </div>
              </div>

              {/* Picklist Values */}
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
              </div>
            </div>

            {/* Regular Expression Pattern */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36" />
              <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Function Usage Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36" />
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>

            {/* Function configuration grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pre-process Functions */}
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-process Functions */}
              <div className="space-y-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Field Documentation Section */}
          <div className="space-y-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            
            {/* Label and Description */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="h-11 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              {/* Secondary action buttons */}
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
            <div className="flex space-x-3">
              {/* Primary action buttons */}
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Progress Indicator */}
      <div className="flex items-center justify-center mt-8">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Loading field configuration...
          </span>
        </div>
      </div>

      {/* Hidden live region for screen reader updates */}
      <div 
        aria-live="polite" 
        aria-atomic="false" 
        className="sr-only"
        id="loading-status"
      >
        Field metadata is being loaded. Form fields will appear once data is ready.
      </div>
    </div>
  );
}