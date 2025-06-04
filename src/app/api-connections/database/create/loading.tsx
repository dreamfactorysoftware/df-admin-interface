/**
 * Loading state component for the database service creation page.
 * 
 * Provides visual feedback during initial page load and form initialization with
 * skeleton placeholders for the multi-step wizard interface, service type cards,
 * and configuration forms. Ensures loading states meet the 2-second SSR requirement
 * while providing smooth user experience during data fetching operations.
 * 
 * Features:
 * - Skeleton placeholders for multi-step wizard interface maintaining visual hierarchy
 * - Responsive skeleton layouts for service type selection cards and configuration forms
 * - Tailwind CSS animation utilities optimized by Turbopack for smooth transitions
 * - Layout structure matching main page to prevent layout shift
 * - Next.js loading.tsx conventions for automatic loading state management
 * - WCAG 2.1 AA accessibility compliance with appropriate ARIA labels
 */

export default function CreateServiceLoading() {
  return (
    <div 
      className="max-w-4xl mx-auto space-y-6 animate-pulse" 
      data-testid="create-service-loading"
      role="status"
      aria-label="Loading database service creation form"
    >
      {/* Page Header Section */}
      <div className="flex items-center space-x-4 mb-8">
        {/* Back Button Skeleton */}
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        
        {/* Page Title and Description */}
        <div className="space-y-2 flex-1">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-72 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse" />
        </div>
      </div>

      {/* Multi-Step Wizard Progress Indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          {/* Step indicators */}
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex items-center">
                {/* Step circle */}
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                {/* Step label */}
                <div className="ml-3 h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              </div>
              {/* Connector line (except for last step) */}
              {index < 3 && (
                <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-4 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content Area */}
        <div className="space-y-6">
          {/* Step Title */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />

          {/* Service Type Selection Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-800 animate-pulse"
              >
                {/* Service Icon */}
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                
                {/* Service Name */}
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                
                {/* Service Description */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                </div>
                
                {/* Selection Badge */}
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Configuration Form Section */}
          <div className="space-y-6 mt-8">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
            
            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Configuration Fields */}
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  {/* Field Label */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                  
                  {/* Field Input */}
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse" />
                  
                  {/* Optional Field Help Text */}
                  {index % 3 === 0 && (
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                  )}
                </div>
              ))}
            </div>

            {/* Advanced Options Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
              </div>
              
              {/* Collapsible Advanced Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
                    <div className="h-10 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Test Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 bg-blue-200 dark:bg-blue-700 rounded animate-pulse" />
                <div className="h-5 bg-blue-200 dark:bg-blue-700 rounded w-32 animate-pulse" />
              </div>
              <div className="h-4 bg-blue-200 dark:bg-blue-700 rounded w-64 animate-pulse" />
              <div className="h-8 bg-blue-200 dark:bg-blue-700 rounded w-28 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex items-center justify-between pt-6 mt-8 border-t border-gray-200 dark:border-gray-700">
          {/* Back Button */}
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          
          {/* Next/Save Buttons */}
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
            <div className="h-10 bg-primary-200 dark:bg-primary-700 rounded w-24 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Help and Documentation Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          {/* Help Title */}
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          </div>
          
          {/* Help Content */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse" />
          </div>
          
          {/* Quick Links */}
          <div className="flex space-x-4 mt-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Screen Reader Only Loading Message */}
      <div className="sr-only" aria-live="polite">
        Loading database service creation form. Please wait while we prepare the interface.
      </div>
    </div>
  );
}