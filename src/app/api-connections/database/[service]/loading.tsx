/**
 * Loading component for the service details route segment
 * 
 * Displays animated skeleton elements while service configuration data is being fetched.
 * Provides optimized loading states for service forms, connection status indicators, 
 * and wizard steps to maintain smooth user experience during data loading operations 
 * with proper accessibility features.
 * 
 * Features:
 * - Multi-step wizard skeleton for new database services
 * - Service configuration form skeletons
 * - Connection status loading indicators
 * - Action button placeholders
 * - WCAG 2.1 AA compliant loading announcements
 * - Responsive design across all supported browsers
 * - Tailwind CSS-based animations with consistent theming
 */

export default function ServiceDetailsLoading() {
  return (
    <div 
      className="space-y-6" 
      data-testid="service-details-loading"
      role="status"
      aria-label="Loading service details"
      aria-live="polite"
    >
      {/* Screen reader announcement */}
      <div className="sr-only">
        Loading service configuration details. Please wait while we fetch the service information.
      </div>

      {/* Service Header Section */}
      <div className="space-y-4">
        {/* Page title skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse" />
        </div>

        {/* Service status indicator skeleton */}
        <div className="flex items-center space-x-3">
          <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
      </div>

      {/* Multi-step Wizard Skeleton for New Services */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {/* Stepper navigation skeleton */}
        <div className="flex items-center justify-between mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center">
              {/* Step circle */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              </div>
              
              {/* Step label */}
              <div className="ml-3 hidden sm:block">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              </div>
              
              {/* Connector line (except for last step) */}
              {index < 3 && (
                <div className="hidden sm:block w-16 h-0.5 bg-gray-200 dark:bg-gray-700 ml-4 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* Current step content skeleton */}
        <div className="space-y-6">
          {/* Step title */}
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80 animate-pulse" />
          </div>

          {/* Service type selection grid skeleton (Step 1) */}
          <div className="space-y-4">
            {/* Search field skeleton */}
            <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-md border animate-pulse" />
            
            {/* Service type cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div 
                  key={index} 
                  className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Service configuration form skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic form fields */}
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-md border animate-pulse" />
              </div>
            ))}
          </div>

          {/* Advanced options accordion skeleton */}
          <div className="space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-md">
              {/* Accordion header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              
              {/* Accordion content */}
              <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
                      <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Security configuration cards skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
            
            {/* Security option cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div 
                  key={index} 
                  className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 animate-pulse"
                />
              ))}
            </div>

            {/* Access level toggle group skeleton */}
            <div className="flex space-x-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div 
                  key={index} 
                  className="h-16 w-32 bg-gray-100 dark:bg-gray-700 rounded border animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Test Section Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
          
          <div className="flex items-center space-x-4">
            {/* Test connection button skeleton */}
            <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-36 animate-pulse" />
            
            {/* Connection status skeleton */}
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
            </div>
          </div>

          {/* Connection details skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Action Bar Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          {/* Left action buttons */}
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          </div>

          {/* Right action buttons */}
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-28 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Additional Navigation Links Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
          
          <div className="flex flex-wrap gap-3">
            {/* Quick action links */}
            {['Schema Discovery', 'API Documentation', 'Security Settings'].map((_, index) => (
              <div 
                key={index} 
                className="h-9 bg-gray-100 dark:bg-gray-700 rounded w-32 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Performance Indicator for Screen Readers */}
      <div className="sr-only" aria-live="polite">
        Service details are loading. This typically takes less than 2 seconds.
      </div>
    </div>
  );
}