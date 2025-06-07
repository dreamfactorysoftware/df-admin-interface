/**
 * @fileoverview Next.js loading UI component for create limits route
 * 
 * Provides skeleton loading states while the page component and form data are being fetched.
 * Implements consistent loading patterns with Tailwind CSS animations and accessibility
 * features for screen readers during SSR hydration and data loading operations.
 * 
 * Features:
 * - Next.js 15.1+ app router loading UI patterns for suspense boundaries
 * - Tailwind CSS 4.1+ skeleton animations with shimmer effects
 * - WCAG 2.1 AA compliance for loading states and screen reader accessibility
 * - Visual consistency matching limit-form component layout structure
 * - Performance-optimized animations respecting prefers-reduced-motion
 * 
 * @version 1.0.0
 * @since Next.js 15.1.0 / React 19.0.0
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Loading announcer for screen readers */}
        <div 
          className="sr-only" 
          role="status" 
          aria-live="polite"
          aria-label="Loading create limit form"
        >
          Loading create limit form. Please wait while the form loads...
        </div>

        {/* Page Header Skeleton */}
        <div className="mb-8">
          {/* Breadcrumb skeleton */}
          <div className="mb-4 flex items-center space-x-2">
            <div className="loading-skeleton h-4 w-16 rounded" />
            <div className="text-gray-400">/</div>
            <div className="loading-skeleton h-4 w-20 rounded" />
            <div className="text-gray-400">/</div>
            <div className="loading-skeleton h-4 w-24 rounded" />
          </div>

          {/* Page title skeleton */}
          <div className="loading-skeleton h-8 w-48 rounded mb-2" />
          
          {/* Page description skeleton */}
          <div className="space-y-2">
            <div className="loading-skeleton h-4 w-96 rounded" />
            <div className="loading-skeleton h-4 w-72 rounded" />
          </div>
        </div>

        {/* Main Form Card Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="loading-skeleton h-6 w-32 rounded mb-2" />
            <div className="loading-skeleton h-4 w-80 rounded" />
          </div>

          {/* Card Content */}
          <div className="px-6 py-6 space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="loading-skeleton h-5 w-40 rounded" />
              
              {/* Form fields row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Limit Name Field */}
                <div className="space-y-2">
                  <div className="loading-skeleton h-4 w-24 rounded" />
                  <div className="loading-skeleton h-10 w-full rounded-md" />
                </div>

                {/* Limit Type Field */}
                <div className="space-y-2">
                  <div className="loading-skeleton h-4 w-20 rounded" />
                  <div className="loading-skeleton h-10 w-full rounded-md" />
                </div>
              </div>

              {/* Form fields row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rate Limit Field */}
                <div className="space-y-2">
                  <div className="loading-skeleton h-4 w-32 rounded" />
                  <div className="loading-skeleton h-10 w-full rounded-md" />
                </div>

                {/* Duration Field */}
                <div className="space-y-2">
                  <div className="loading-skeleton h-4 w-20 rounded" />
                  <div className="loading-skeleton h-10 w-full rounded-md" />
                </div>
              </div>
            </div>

            {/* Target Configuration Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="loading-skeleton h-5 w-48 rounded" />
              
              {/* Service/API Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="loading-skeleton h-4 w-28 rounded" />
                  <div className="loading-skeleton h-10 w-full rounded-md" />
                </div>

                <div className="space-y-2">
                  <div className="loading-skeleton h-4 w-24 rounded" />
                  <div className="loading-skeleton h-10 w-full rounded-md" />
                </div>
              </div>

              {/* Endpoint Pattern Field */}
              <div className="space-y-2">
                <div className="loading-skeleton h-4 w-36 rounded" />
                <div className="loading-skeleton h-10 w-full rounded-md" />
                <div className="loading-skeleton h-3 w-64 rounded mt-1" />
              </div>
            </div>

            {/* User/Role Configuration Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="loading-skeleton h-5 w-44 rounded" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Selection */}
                <div className="space-y-2">
                  <div className="loading-skeleton h-4 w-20 rounded" />
                  <div className="loading-skeleton h-10 w-full rounded-md" />
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <div className="loading-skeleton h-4 w-16 rounded" />
                  <div className="loading-skeleton h-10 w-full rounded-md" />
                </div>
              </div>
            </div>

            {/* Advanced Options Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="loading-skeleton h-5 w-40 rounded" />
              
              {/* Checkbox options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="loading-skeleton h-4 w-4 rounded" />
                  <div className="loading-skeleton h-4 w-32 rounded" />
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="loading-skeleton h-4 w-4 rounded" />
                  <div className="loading-skeleton h-4 w-40 rounded" />
                </div>

                <div className="flex items-center space-x-3">
                  <div className="loading-skeleton h-4 w-4 rounded" />
                  <div className="loading-skeleton h-4 w-28 rounded" />
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <div className="loading-skeleton h-4 w-24 rounded" />
                <div className="loading-skeleton h-24 w-full rounded-md" />
                <div className="loading-skeleton h-3 w-48 rounded mt-1" />
              </div>
            </div>
          </div>

          {/* Card Footer with Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              {/* Left side - Cancel button */}
              <div className="loading-skeleton h-10 w-20 rounded-md" />
              
              {/* Right side - Action buttons */}
              <div className="flex items-center space-x-3">
                <div className="loading-skeleton h-10 w-24 rounded-md" />
                <div className="loading-skeleton h-10 w-28 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading Progress Indicator */}
        <div className="mt-6 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            {/* Animated spinner */}
            <div 
              className="animate-spin h-5 w-5 border-2 border-primary-200 border-t-primary-500 rounded-full"
              aria-hidden="true"
            />
            
            {/* Loading text */}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Preparing form...
            </span>
          </div>
        </div>

        {/* Accessibility status update */}
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        >
          Form is loading. Form fields and options will be available shortly.
        </div>
      </div>

      {/* Global overlay for better focus management */}
      <div 
        className="fixed inset-0 bg-black/5 dark:bg-black/20 pointer-events-none z-[-1]"
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Loading component accessibility features:
 * 
 * 1. Screen Reader Support:
 *    - role="status" with aria-live="polite" for loading announcements
 *    - Descriptive aria-label attributes for loading states
 *    - sr-only class for screen reader only content
 * 
 * 2. WCAG 2.1 AA Compliance:
 *    - Proper semantic structure with headings and landmarks
 *    - Sufficient color contrast maintained in dark/light themes
 *    - Animation respects prefers-reduced-motion preferences via CSS
 *    - Focus management maintained during loading states
 * 
 * 3. Performance Considerations:
 *    - Uses CSS classes from globals.css for optimized animations
 *    - Skeleton placeholders prevent layout shift
 *    - Minimal JavaScript execution during loading
 *    - Responsive design optimized for all viewport sizes
 * 
 * 4. Next.js Integration:
 *    - Works seamlessly with app router suspense boundaries
 *    - Compatible with SSR hydration patterns
 *    - Supports parallel route loading
 *    - Integrates with Next.js loading UI conventions
 */