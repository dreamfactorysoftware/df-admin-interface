/**
 * Loading component for the service details route segment that displays animated skeleton 
 * elements while service configuration data is being fetched. Provides optimized loading 
 * states for service forms, connection status indicators, and wizard steps to maintain 
 * smooth user experience during data loading operations with proper accessibility features.
 * 
 * This component follows Next.js app router loading UI patterns and implements Tailwind CSS-based
 * skeleton animations with WCAG 2.1 AA compliance for accessibility.
 */

export default function ServiceDetailsLoading() {
  return (
    <div 
      className="space-y-6" 
      data-testid="service-details-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading service configuration"
    >
      {/* Screen reader announcement */}
      <span className="sr-only">Loading database service configuration...</span>

      {/* Service Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          {/* Service title skeleton */}
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
          {/* Service description skeleton */}
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse" />
          {/* Service type badge skeleton */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
        </div>
        
        {/* Action buttons skeleton */}
        <div className="flex space-x-3">
          <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
        </div>
      </div>

      {/* Connection Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-6 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Service Configuration Form Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Form header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        </div>

        {/* Form content */}
        <div className="p-6 space-y-6">
          {/* Basic Configuration Section */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Database Connection Details Section */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Options Section */}
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
            
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Steps Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Wizard header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-56 animate-pulse" />
        </div>

        {/* Step indicators */}
        <div className="p-6">
          <div className="flex items-center justify-center space-x-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center">
                {/* Step circle */}
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                {/* Step connector line (except for last item) */}
                {i < 3 && (
                  <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-4 animate-pulse" />
                )}
              </div>
            ))}
          </div>

          {/* Step labels */}
          <div className="flex justify-center space-x-8 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            ))}
          </div>

          {/* Wizard content area */}
          <div className="min-h-[300px] bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80 animate-pulse" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                    <div className="h-10 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wizard navigation buttons */}
          <div className="flex justify-between mt-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 animate-pulse" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-x-3">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive layout for mobile devices */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {/* Mobile-specific loading elements */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading progress indicator for accessibility */}
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 bg-primary-600 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    </div>
  );
}