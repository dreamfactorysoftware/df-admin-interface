/**
 * Loading state component for the DreamFactory Resources page
 * 
 * This component provides skeleton loading animations during page initialization
 * and data fetching operations, following Next.js app router loading.tsx conventions.
 * 
 * Features:
 * - Tailwind CSS skeleton animations replacing Angular Material progress indicators
 * - WCAG 2.1 AA accessibility compliance with screen reader support
 * - Responsive design matching the resource link cards layout
 * - Semantic HTML structure simulating actual content
 * 
 * @component
 * @returns {JSX.Element} Loading skeleton interface for resources page
 */
export default function ResourcesLoading() {
  return (
    <div 
      className="space-y-8 animate-pulse"
      data-testid="resources-loading"
      role="status"
      aria-label="Loading resources page"
      aria-live="polite"
    >
      {/* Page Header Skeleton */}
      <div className="space-y-4">
        {/* Page Title Skeleton */}
        <div 
          className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48 sm:w-64 animate-pulse"
          aria-hidden="true"
        />
        
        {/* Page Description Skeleton */}
        <div className="space-y-2">
          <div 
            className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-2xl animate-pulse"
            aria-hidden="true"
          />
          <div 
            className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 max-w-xl animate-pulse"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Resources Grid Skeleton */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        aria-hidden="true"
      >
        {/* Generate 6 resource card skeletons to match typical resource count */}
        {Array.from({ length: 6 }).map((_, index) => (
          <ResourceCardSkeleton key={index} />
        ))}
      </div>

      {/* Additional Resources Section Skeleton */}
      <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          {/* Section Title Skeleton */}
          <div 
            className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"
            aria-hidden="true"
          />
          
          {/* Quick Links List Skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div 
                key={index}
                className="flex items-center space-x-3"
                aria-hidden="true"
              >
                {/* Icon Skeleton */}
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                
                {/* Link Text Skeleton */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screen Reader Loading Announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Loading DreamFactory resources and documentation links. Please wait...
      </div>
    </div>
  );
}

/**
 * Individual resource card skeleton component
 * 
 * Simulates the structure of resource link cards with icon, title,
 * description, and action button areas.
 */
function ResourceCardSkeleton() {
  return (
    <div 
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200"
      aria-hidden="true"
    >
      {/* Card Header with Icon and Title */}
      <div className="flex items-start space-x-4">
        {/* Resource Icon Skeleton */}
        <div className="flex-shrink-0">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
        
        {/* Title and Category Skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        </div>
      </div>

      {/* Description Skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-pulse" />
      </div>

      {/* Tags/Labels Skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 2 + Math.floor(Math.random() * 2) }).map((_, index) => (
          <div 
            key={index}
            className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
            style={{ width: `${60 + Math.random() * 40}px` }}
          />
        ))}
      </div>

      {/* Action Button Skeleton */}
      <div className="pt-2">
        <div className="h-9 bg-primary-200 dark:bg-primary-800 rounded-md w-24 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Component type definition for TypeScript support
 */
ResourcesLoading.displayName = 'ResourcesLoading';