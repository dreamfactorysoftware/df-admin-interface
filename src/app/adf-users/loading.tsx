/**
 * Loading UI component for the user management section
 * 
 * Displays skeleton placeholders during data fetching operations for user table
 * and form components. Implements Next.js app router loading states with accessible
 * loading indicators and responsive design using Tailwind CSS animations.
 * 
 * Features:
 * - Skeleton placeholders for user table and forms
 * - WCAG 2.1 AA compliance with proper ARIA attributes
 * - Responsive design that adapts to different viewport sizes
 * - Theme-aware styling matching application design system
 * - Performance optimized animations with Tailwind CSS
 * - Server-side rendering compatibility
 */

export default function UsersLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Page Header Skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Title Skeleton */}
            <div className="animate-pulse">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            
            {/* Action Buttons Skeleton */}
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
              <div className="h-10 w-32 bg-primary-200 dark:bg-primary-800 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Search and Filters Skeleton */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Bar Skeleton */}
            <div className="flex-1 max-w-md">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            </div>
            
            {/* Filter Controls Skeleton */}
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
            </div>
          </div>
        </div>

        {/* Data Table Skeleton */}
        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-gray-700 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Select All Checkbox Skeleton */}
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                
                {/* Column Headers Skeleton */}
                <div className="flex gap-8">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-18 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              
              {/* Table Actions Skeleton */}
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>

          {/* Table Rows Skeleton */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Row Checkbox Skeleton */}
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    
                    {/* User Avatar Skeleton */}
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    
                    {/* User Data Skeleton */}
                    <div className="flex gap-8">
                      <div className="space-y-1">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                  
                  {/* Row Actions Skeleton */}
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Skeleton */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Loading Status for Screen Readers */}
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading user management interface"
        className="sr-only"
      >
        Loading user management interface. Please wait while we fetch user data and prepare the table view.
      </div>

      {/* Progress Indicator */}
      <div
        className="fixed bottom-4 right-4 z-50"
        role="progressbar"
        aria-label="Page loading progress"
        aria-valuenow={75}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {/* Spinning Loader */}
            <div className="relative">
              <div className="h-4 w-4 rounded-full border-2 border-gray-200 dark:border-gray-600" />
              <div className="absolute inset-0 h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-primary-500 border-r-primary-500" />
            </div>
            
            {/* Loading Text */}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Loading users...
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2 w-32 bg-gray-200 rounded-full h-1 dark:bg-gray-700">
            <div className="bg-primary-500 h-1 rounded-full animate-pulse w-3/4 transition-all duration-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
}