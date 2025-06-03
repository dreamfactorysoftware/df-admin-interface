/**
 * Loading UI component for the user management section
 * 
 * Displays skeleton placeholders during data fetching operations with:
 * - Next.js app router loading state patterns
 * - WCAG 2.1 AA compliant accessibility features
 * - Responsive design for mobile and desktop viewports
 * - Theme-aware styling with Tailwind CSS animations
 * - Semantic structure matching the actual user management interface
 * 
 * @returns React component for user management loading state
 */
export default function UsersLoading() {
  return (
    <div 
      className="space-y-6 animate-pulse" 
      data-testid="users-loading"
      role="status"
      aria-label="Loading user management interface"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading user management interface, please wait
      </div>

      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          {/* Page Title */}
          <div 
            className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-48 animate-pulse"
            aria-hidden="true"
          />
          {/* Page Description */}
          <div 
            className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-80 animate-pulse"
            aria-hidden="true"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div 
            className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-32 animate-pulse"
            aria-hidden="true"
          />
          <div 
            className="h-10 bg-primary-200 dark:bg-primary-700 rounded-md w-36 animate-pulse"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Statistics Cards - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div 
            key={`stat-${index}`}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-3"
            aria-hidden="true"
          >
            {/* Stat Icon */}
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            {/* Stat Value */}
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
            {/* Stat Label */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div 
              className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
              aria-hidden="true"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div 
                key={`filter-${index}`}
                className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-full sm:w-36 animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Select All Checkbox */}
            <div 
              className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              aria-hidden="true"
            />
            {/* Selection Count */}
            <div 
              className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
              aria-hidden="true"
            />
          </div>
          
          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div 
                key={`bulk-action-${index}`}
                className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Data Table Skeleton */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Table column headers */}
            {['Select', 'Avatar', 'Name', 'Email', 'Role', 'Actions'].map((header, index) => (
              <div 
                key={`header-${index}`}
                className={`h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
                  index === 0 ? 'w-12' : 
                  index === 1 ? 'w-16' : 
                  index === 5 ? 'w-20' : 'w-full'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                {/* Checkbox */}
                <div 
                  className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  aria-hidden="true"
                />
                
                {/* Avatar */}
                <div 
                  className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                  aria-hidden="true"
                />
                
                {/* Name */}
                <div className="space-y-2">
                  <div 
                    className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"
                    aria-hidden="true"
                  />
                  <div 
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"
                    aria-hidden="true"
                  />
                </div>
                
                {/* Email */}
                <div 
                  className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"
                  aria-hidden="true"
                />
                
                {/* Role Badge */}
                <div 
                  className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"
                  aria-hidden="true"
                />
                
                {/* Actions Menu */}
                <div className="flex gap-2">
                  <div 
                    className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    aria-hidden="true"
                  />
                  <div 
                    className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Pagination Info */}
          <div 
            className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"
            aria-hidden="true"
          />
          
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <div 
              className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              aria-hidden="true"
            />
            
            {/* Page Numbers */}
            {Array.from({ length: 5 }).map((_, index) => (
              <div 
                key={`page-${index}`}
                className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                aria-hidden="true"
              />
            ))}
            
            {/* Next Button */}
            <div 
              className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Mobile-optimized loading state for smaller screens */}
      <div className="md:hidden space-y-4">
        {/* Mobile user cards */}
        {Array.from({ length: 6 }).map((_, index) => (
          <div 
            key={`mobile-card-${index}`}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
            aria-hidden="true"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              
              <div className="flex-1 space-y-2">
                {/* Name */}
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                {/* Email */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
              </div>
              
              {/* Actions */}
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            
            {/* Role Badge */}
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator for screen readers */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        User data is being loaded. This page will update automatically when ready.
      </div>
    </div>
  );
}