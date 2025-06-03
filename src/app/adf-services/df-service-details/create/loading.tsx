/**
 * Service Creation Loading State Component
 * 
 * This component provides animated skeleton placeholders while the service creation
 * wizard loads. Implements Next.js app router loading patterns with WCAG 2.1 AA
 * accessibility compliance and optimized performance.
 * 
 * Features:
 * - Skeleton animations with Tailwind CSS 4.1+ for sub-100ms render time
 * - Dark mode theme integration with proper contrast ratios
 * - WCAG 2.1 AA compliant accessibility attributes
 * - Responsive design with mobile-first approach
 * - Optimized for React 19 performance characteristics
 * 
 * @version 1.0.0
 * @compliance WCAG 2.1 AA
 * @performance <100ms render time
 */

export default function CreateServiceLoading() {
  return (
    <div 
      className="max-w-4xl mx-auto space-y-6 animate-pulse" 
      data-testid="create-service-loading"
      role="status"
      aria-live="polite"
      aria-label="Loading service creation wizard"
    >
      {/* Page Header Section */}
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Back Button Skeleton */}
          <div 
            className="h-10 w-10 bg-secondary-200 dark:bg-secondary-700 rounded-md"
            aria-hidden="true"
          />
          
          {/* Title and Description Skeleton */}
          <div className="space-y-2">
            <div 
              className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-64"
              aria-hidden="true"
            />
            <div 
              className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-96"
              aria-hidden="true"
            />
          </div>
        </div>
        
        {/* Help Button Skeleton */}
        <div 
          className="h-10 w-24 bg-secondary-200 dark:bg-secondary-700 rounded-md"
          aria-hidden="true"
        />
      </header>

      {/* Progress Indicator Section */}
      <div 
        className="bg-card border border-border rounded-lg p-6"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-48" />
          <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-16" />
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-secondary-100 dark:bg-secondary-800 rounded-full h-2">
          <div className="bg-primary-200 dark:bg-primary-700 h-2 rounded-full w-1/4" />
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Form Header */}
        <div className="border-b border-border p-6">
          <div className="space-y-2">
            <div 
              className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-40"
              aria-hidden="true"
            />
            <div 
              className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-80"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-8" aria-hidden="true">
          {/* Database Type Selection */}
          <section className="space-y-4">
            <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-32" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 bg-secondary-100 dark:bg-secondary-800 rounded-lg border-2 border-secondary-200 dark:border-secondary-700"
                />
              ))}
            </div>
          </section>

          {/* Connection Details Form */}
          <section className="space-y-6">
            <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-44" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Name */}
              <div className="space-y-2">
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24" />
                <div className="h-11 bg-secondary-100 dark:bg-secondary-800 rounded-md border border-secondary-200 dark:border-secondary-700" />
              </div>

              {/* Database Host */}
              <div className="space-y-2">
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-28" />
                <div className="h-11 bg-secondary-100 dark:bg-secondary-800 rounded-md border border-secondary-200 dark:border-secondary-700" />
              </div>

              {/* Database Port */}
              <div className="space-y-2">
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-20" />
                <div className="h-11 bg-secondary-100 dark:bg-secondary-800 rounded-md border border-secondary-200 dark:border-secondary-700" />
              </div>

              {/* Database Name */}
              <div className="space-y-2">
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-32" />
                <div className="h-11 bg-secondary-100 dark:bg-secondary-800 rounded-md border border-secondary-200 dark:border-secondary-700" />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-20" />
                <div className="h-11 bg-secondary-100 dark:bg-secondary-800 rounded-md border border-secondary-200 dark:border-secondary-700" />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-20" />
                <div className="h-11 bg-secondary-100 dark:bg-secondary-800 rounded-md border border-secondary-200 dark:border-secondary-700" />
              </div>
            </div>
          </section>

          {/* Advanced Options */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-secondary-200 dark:bg-secondary-700 rounded" />
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-36" />
            </div>
            
            {/* Collapsible Advanced Settings */}
            <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-32" />
                  <div className="h-11 bg-secondary-100 dark:bg-secondary-800 rounded-md border border-secondary-200 dark:border-secondary-700" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-28" />
                  <div className="h-11 bg-secondary-100 dark:bg-secondary-800 rounded-md border border-secondary-200 dark:border-secondary-700" />
                </div>
              </div>
            </div>
          </section>

          {/* Connection Test Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-36" />
              <div className="h-10 w-32 bg-secondary-200 dark:bg-secondary-700 rounded-md" />
            </div>
            
            {/* Test Results Placeholder */}
            <div className="bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 bg-secondary-200 dark:bg-secondary-700 rounded-full" />
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-48" />
              </div>
            </div>
          </section>
        </div>

        {/* Form Actions Footer */}
        <div className="border-t border-border p-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-24 bg-secondary-200 dark:bg-secondary-700 rounded-md" />
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-24 bg-secondary-200 dark:bg-secondary-700 rounded-md" />
              <div className="h-10 w-32 bg-primary-200 dark:bg-primary-700 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Status Message for Screen Readers */}
      <div className="sr-only" aria-live="polite">
        Loading service creation wizard. Please wait while we prepare the form.
      </div>
    </div>
  );
}