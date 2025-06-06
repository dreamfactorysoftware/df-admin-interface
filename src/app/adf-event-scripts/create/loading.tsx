/**
 * Loading UI component for the event script creation page
 * 
 * Displays skeleton placeholders during form initialization and data fetching operations.
 * Implements Next.js app router loading patterns with accessible loading indicators,
 * responsive design using Tailwind CSS animations, and proper ARIA attributes for
 * screen reader compatibility during script creation workflow setup.
 * 
 * Features:
 * - WCAG 2.1 AA compliant loading indicators with proper ARIA live regions
 * - Responsive design adapting to mobile and desktop viewports
 * - Theme-aware styling matching application design system
 * - Specific loading states for script form fields, code editor, and storage service configuration
 * - Performance-optimized Tailwind CSS animations
 */

'use client';

import React from 'react';

/**
 * Inline Skeleton component following design system standards
 * WCAG 2.1 AA compliant with proper contrast ratios and animations
 */
function Skeleton({ 
  className = '',
  'aria-label': ariaLabel = 'Loading content',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { 'aria-label'?: string }) {
  return (
    <div
      className={`animate-pulse bg-secondary-200 dark:bg-secondary-700 rounded-md ${className}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      {...props}
    />
  );
}

/**
 * Inline Loading Spinner component with accessibility features
 * Meets WCAG 2.1 AA contrast requirements and provides screen reader announcements
 */
function LoadingSpinner({ 
  size = 'md',
  className = '',
  'aria-label': ariaLabel = 'Loading',
  ...props
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div
      className={`inline-block ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      {...props}
    >
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-secondary-300 dark:border-secondary-600 border-t-primary-600 dark:border-t-primary-400`} />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

/**
 * Main loading component for event script creation page
 * 
 * Provides comprehensive loading states for all form sections with proper
 * accessibility support and responsive design patterns
 */
export default function Loading() {
  return (
    <div 
      className="min-h-screen bg-secondary-50 dark:bg-secondary-950 p-4 sm:p-6 lg:p-8"
      role="main"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading script creation form"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading event script creation form. Please wait while we prepare the interface.
      </div>

      {/* Main container with responsive design */}
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Page header loading */}
        <div className="space-y-4">
          <Skeleton 
            className="h-8 w-64 sm:w-80" 
            aria-label="Loading page title"
          />
          <Skeleton 
            className="h-4 w-full max-w-2xl" 
            aria-label="Loading page description"
          />
        </div>

        {/* Main form container */}
        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 sm:p-8">
          
          {/* Form sections container */}
          <div className="space-y-8">
            
            {/* Script metadata section */}
            <section aria-labelledby="metadata-loading">
              <h2 id="metadata-loading" className="sr-only">Loading script metadata form</h2>
              
              <div className="space-y-6">
                {/* Section title */}
                <Skeleton 
                  className="h-6 w-40 sm:w-48" 
                  aria-label="Loading metadata section title"
                />
                
                {/* Form fields grid - responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Script name field */}
                  <div className="space-y-2">
                    <Skeleton 
                      className="h-4 w-24" 
                      aria-label="Loading script name label"
                    />
                    <Skeleton 
                      className="h-12 w-full" 
                      aria-label="Loading script name input field"
                    />
                  </div>
                  
                  {/* Script type field */}
                  <div className="space-y-2">
                    <Skeleton 
                      className="h-4 w-20" 
                      aria-label="Loading script type label"
                    />
                    <Skeleton 
                      className="h-12 w-full" 
                      aria-label="Loading script type dropdown"
                    />
                  </div>
                </div>

                {/* Description field - full width */}
                <div className="space-y-2">
                  <Skeleton 
                    className="h-4 w-28" 
                    aria-label="Loading description label"
                  />
                  <Skeleton 
                    className="h-24 w-full" 
                    aria-label="Loading description textarea"
                  />
                </div>
              </div>
            </section>

            {/* Storage service configuration section */}
            <section aria-labelledby="storage-loading">
              <h2 id="storage-loading" className="sr-only">Loading storage service configuration</h2>
              
              <div className="space-y-6">
                {/* Section title with loading spinner */}
                <div className="flex items-center space-x-3">
                  <Skeleton 
                    className="h-6 w-44" 
                    aria-label="Loading storage configuration title"
                  />
                  <LoadingSpinner 
                    size="sm" 
                    aria-label="Loading storage services"
                  />
                </div>
                
                {/* Storage service selector */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Skeleton 
                      className="h-4 w-32" 
                      aria-label="Loading storage service label"
                    />
                    <Skeleton 
                      className="h-12 w-full" 
                      aria-label="Loading storage service dropdown"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Skeleton 
                      className="h-4 w-28" 
                      aria-label="Loading storage path label"
                    />
                    <Skeleton 
                      className="h-12 w-full" 
                      aria-label="Loading storage path input"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Code editor section */}
            <section aria-labelledby="editor-loading">
              <h2 id="editor-loading" className="sr-only">Loading code editor</h2>
              
              <div className="space-y-4">
                {/* Editor toolbar */}
                <div className="flex items-center justify-between">
                  <Skeleton 
                    className="h-6 w-32" 
                    aria-label="Loading editor title"
                  />
                  <div className="flex items-center space-x-3">
                    <LoadingSpinner 
                      size="sm" 
                      aria-label="Loading editor features"
                    />
                    <Skeleton 
                      className="h-8 w-24" 
                      aria-label="Loading editor controls"
                    />
                  </div>
                </div>
                
                {/* Code editor placeholder */}
                <div className="relative">
                  <Skeleton 
                    className="h-80 sm:h-96 w-full rounded-lg" 
                    aria-label="Loading code editor interface"
                  />
                  
                  {/* Editor loading overlay */}
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/50 dark:bg-secondary-900/50">
                    <div className="flex items-center space-x-3 px-4 py-2 bg-white dark:bg-secondary-800 rounded-md shadow-sm border border-secondary-200 dark:border-secondary-600">
                      <LoadingSpinner 
                        size="md" 
                        aria-label="Initializing code editor"
                      />
                      <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Initializing code editor...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Configuration options section */}
            <section aria-labelledby="options-loading">
              <h2 id="options-loading" className="sr-only">Loading configuration options</h2>
              
              <div className="space-y-6">
                <Skeleton 
                  className="h-6 w-48" 
                  aria-label="Loading options section title"
                />
                
                {/* Toggle options - responsive grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                      <Skeleton 
                        className="h-5 w-9 rounded-full" 
                        aria-label={`Loading toggle option ${index}`}
                      />
                      <Skeleton 
                        className="h-4 w-20" 
                        aria-label={`Loading option ${index} label`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Action buttons section */}
          <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-700">
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
              <Skeleton 
                className="h-12 w-full sm:w-24" 
                aria-label="Loading cancel button"
              />
              <Skeleton 
                className="h-12 w-full sm:w-32" 
                aria-label="Loading save button"
              />
            </div>
          </div>
        </div>

        {/* Additional loading content for mobile optimization */}
        <div className="block sm:hidden space-y-4">
          <Skeleton 
            className="h-4 w-full" 
            aria-label="Loading mobile help text"
          />
          <div className="flex justify-center">
            <LoadingSpinner 
              size="lg" 
              aria-label="Loading mobile interface"
            />
          </div>
        </div>
      </div>

      {/* Loading progress indicator for longer operations */}
      <div 
        className="fixed bottom-4 right-4 bg-white dark:bg-secondary-800 p-4 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-600 max-w-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center space-x-3">
          <LoadingSpinner 
            size="sm" 
            aria-label="Loading script creation components"
          />
          <div className="text-sm">
            <div className="font-medium text-secondary-900 dark:text-secondary-100">
              Setting up script creation
            </div>
            <div className="text-secondary-500 dark:text-secondary-400">
              Loading form components...
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-1.5">
          <div 
            className="bg-primary-600 dark:bg-primary-400 h-1.5 rounded-full animate-pulse" 
            style={{ width: '60%' }}
            role="progressbar"
            aria-valuenow={60}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Loading progress: 60% complete"
          />
        </div>
      </div>
    </div>
  );
}